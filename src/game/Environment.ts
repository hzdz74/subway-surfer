import * as THREE from 'three';

/**
 * Builds the "end of the world" prehistoric backdrop: a gradient sky dome,
 * an erupting volcano with emissive glow, layered distant mountains,
 * falling ash particles, lights and exponential fog.
 *
 * Everything here is static relative to the camera-ish world; the volcano
 * and mountains sit far away so parallax keeps them effectively fixed.
 */
export class Environment {
  public readonly group = new THREE.Group();
  private ash: THREE.Points;
  private ashVelocities: Float32Array;
  private ashCount = 1200;
  private volcanoGlow: THREE.PointLight;
  private emberMat: THREE.PointsMaterial;
  private embers: THREE.Points;
  private emberVel: Float32Array;
  private emberCount = 200;
  private t = 0;

  constructor(scene: THREE.Scene) {
    // ── Fog: warm, dense haze for depth ──────────────────────────────────
    scene.fog = new THREE.FogExp2(0x3a1408, 0.012);
    scene.background = new THREE.Color(0x2a1208);

    this.buildSky();
    this.buildMountains();
    this.buildVolcano();

    // ── Lights ───────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0x5a3a4a, 0.55);
    this.group.add(ambient);

    const hemi = new THREE.HemisphereLight(0xff7a3a, 0x2a1810, 0.6);
    this.group.add(hemi);

    const sun = new THREE.DirectionalLight(0xffb070, 1.5);
    sun.position.set(-18, 26, -30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 120;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    sun.shadow.bias = -0.0004;
    this.group.add(sun);
    this.group.add(sun.target);
    sun.target.position.set(0, 0, 40);

    // Warm rim light from the volcano direction
    const rim = new THREE.DirectionalLight(0xff4010, 0.5);
    rim.position.set(6, 10, -40);
    this.group.add(rim);

    this.volcanoGlow = new THREE.PointLight(0xff4810, 6, 120, 2);
    this.volcanoGlow.position.set(8, 22, -85);
    this.group.add(this.volcanoGlow);

    // ── Ash particles ─────────────────────────────────────────────────────
    const ashGeo = new THREE.BufferGeometry();
    const ashPos = new Float32Array(this.ashCount * 3);
    this.ashVelocities = new Float32Array(this.ashCount);
    for (let i = 0; i < this.ashCount; i++) {
      ashPos[i * 3] = (Math.random() - 0.5) * 120;
      ashPos[i * 3 + 1] = Math.random() * 60;
      ashPos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 20;
      this.ashVelocities[i] = 1.5 + Math.random() * 2.5;
    }
    ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
    const ashMat = new THREE.PointsMaterial({
      color: 0x222018,
      size: 0.5,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.ash = new THREE.Points(ashGeo, ashMat);
    this.group.add(this.ash);

    // ── Glowing embers near the volcano ───────────────────────────────────
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(this.emberCount * 3);
    this.emberVel = new Float32Array(this.emberCount * 2);
    for (let i = 0; i < this.emberCount; i++) {
      emberPos[i * 3] = 8 + (Math.random() - 0.5) * 10;
      emberPos[i * 3 + 1] = 28 + Math.random() * 6;
      emberPos[i * 3 + 2] = -85 + (Math.random() - 0.5) * 10;
      this.emberVel[i * 2] = 2 + Math.random() * 4; // up speed
      this.emberVel[i * 2 + 1] = Math.random() * Math.PI * 2; // phase
    }
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    this.emberMat = new THREE.PointsMaterial({
      color: 0xff6010,
      size: 1.1,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.embers = new THREE.Points(emberGeo, this.emberMat);
    this.group.add(this.embers);
  }

  private buildSky(): void {
    const skyGeo = new THREE.SphereGeometry(400, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a0d18) },
        midColor: { value: new THREE.Color(0x7a2410) },
        botColor: { value: new THREE.Color(0xff7a28) },
      },
      vertexShader: /* glsl */`
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vWorldPos;
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 botColor;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 col;
          if (h > 0.15) {
            col = mix(midColor, topColor, smoothstep(0.15, 0.7, h));
          } else {
            col = mix(botColor, midColor, smoothstep(-0.1, 0.15, h));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(sky);

    // A dim, smoky sun disc
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(14, 32),
      new THREE.MeshBasicMaterial({ color: 0xffcf80, transparent: true, opacity: 0.5, depthWrite: false }),
    );
    sunDisc.position.set(-60, 55, -180);
    this.group.add(sunDisc);
  }

  private buildMountains(): void {
    // Several layers of jagged silhouettes for parallax depth.
    const layers = [
      { z: -150, color: 0x2a1410, h: 55, w: 360, count: 9, y: -2 },
      { z: -110, color: 0x331810, h: 40, w: 300, count: 8, y: -2 },
      { z: -75, color: 0x3d1c12, h: 30, w: 240, count: 7, y: -2 },
    ];
    for (const layer of layers) {
      const shape = new THREE.Shape();
      shape.moveTo(-layer.w / 2, layer.y);
      let x = -layer.w / 2;
      const step = layer.w / layer.count;
      for (let i = 0; i <= layer.count; i++) {
        const peak = layer.h * (0.5 + Math.random() * 0.5);
        shape.lineTo(x + step / 2, layer.y + peak);
        shape.lineTo(x + step, layer.y + peak * (0.3 + Math.random() * 0.3));
        x += step;
      }
      shape.lineTo(layer.w / 2, layer.y);
      shape.lineTo(layer.w / 2, layer.y - 40);
      shape.lineTo(-layer.w / 2, layer.y - 40);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshStandardMaterial({ color: layer.color, roughness: 1, metalness: 0, fog: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0, layer.z);
      this.group.add(mesh);
    }
  }

  private buildVolcano(): void {
    const volcano = new THREE.Group();
    volcano.position.set(8, 0, -85);

    // Cone body with truncated top (crater)
    const coneGeo = new THREE.CylinderGeometry(6, 26, 34, 24, 6, true);
    // Roughen the cone vertices for a craggy look
    const pos = coneGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
      const n = (Math.sin(vx * 1.3 + vy) + Math.cos(vz * 1.1 - vy)) * 0.6;
      pos.setX(i, vx + n);
      pos.setZ(i, vz + n);
    }
    coneGeo.computeVertexNormals();
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x241008, roughness: 1, metalness: 0 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 17;
    volcano.add(cone);

    // Glowing lava at the crater
    const lavaTop = new THREE.Mesh(
      new THREE.CircleGeometry(6, 24),
      new THREE.MeshBasicMaterial({ color: 0xff5010 }),
    );
    lavaTop.rotation.x = -Math.PI / 2;
    lavaTop.position.y = 34;
    volcano.add(lavaTop);

    // Lava streaks down the side
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const streak = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 22),
        new THREE.MeshBasicMaterial({ color: 0xff3808, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      );
      streak.position.set(Math.cos(a) * 12, 20, Math.sin(a) * 12);
      streak.lookAt(Math.cos(a) * 40, 20, Math.sin(a) * 40);
      volcano.add(streak);
    }

    // Smoke plume (large soft sprites)
    for (let i = 0; i < 6; i++) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(7 + i * 2, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 1, transparent: true, opacity: 0.4 }),
      );
      smoke.position.set((Math.random() - 0.5) * 8, 38 + i * 7, (Math.random() - 0.5) * 8);
      volcano.add(smoke);
    }

    this.group.add(volcano);
  }

  update(dt: number): void {
    this.t += dt;

    // Ash drift downward, recycle at top
    const ashPos = this.ash.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.ashCount; i++) {
      let y = ashPos.getY(i) - this.ashVelocities[i] * dt;
      let x = ashPos.getX(i) + Math.sin(this.t * 0.5 + i) * dt * 0.3;
      if (y < 0) {
        y = 55 + Math.random() * 10;
        x = (Math.random() - 0.5) * 120;
      }
      ashPos.setX(i, x);
      ashPos.setY(i, y);
    }
    ashPos.needsUpdate = true;

    // Embers rise, flicker, recycle
    const emPos = this.embers.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.emberCount; i++) {
      let y = emPos.getY(i) + this.emberVel[i * 2] * dt;
      const phase = this.emberVel[i * 2 + 1];
      const x = 8 + Math.sin(this.t * 2 + phase) * 3;
      if (y > 50) {
        y = 28 + Math.random() * 4;
      }
      emPos.setX(i, x);
      emPos.setY(i, y);
    }
    emPos.needsUpdate = true;

    // Volcano glow flicker
    this.volcanoGlow.intensity = 5 + Math.sin(this.t * 8) * 1.2 + Math.sin(this.t * 3.3) * 0.8;
  }
}
