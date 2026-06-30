import * as THREE from 'three';
import { LANE_X, TRACK_SEGMENT_COUNT, TRACK_SEGMENT_LENGTH } from './constants';

/**
 * Infinite scrolling 3-lane ground. Built from a pool of segments that are
 * recycled from back to front as the world moves toward the camera (+Z → 0).
 *
 * The ground uses a custom shader for procedural volcanic rock with cracks
 * glowing faintly, plus subtle bump-style normal perturbation done in the
 * vertex shader so it reads as uneven terrain under the directional light.
 */
export class Track {
  public readonly group = new THREE.Group();
  private segments: THREE.Mesh[] = [];
  private trackWidth = 8;
  private material: THREE.ShaderMaterial;
  private rails: THREE.Group;

  constructor() {
    this.material = this.buildGroundMaterial();

    const segGeo = new THREE.PlaneGeometry(this.trackWidth, TRACK_SEGMENT_LENGTH, 24, 48);
    segGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < TRACK_SEGMENT_COUNT; i++) {
      const seg = new THREE.Mesh(segGeo, this.material);
      seg.receiveShadow = true;
      seg.position.z = i * TRACK_SEGMENT_LENGTH;
      this.segments.push(seg);
      this.group.add(seg);
    }

    // Lane separators (carved glowing grooves) and side berms
    this.rails = new THREE.Group();
    this.group.add(this.rails);
    this.buildSideTerrain();
  }

  private buildGroundMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorLow: { value: new THREE.Color(0x1c0f0a) },
        uColorHigh: { value: new THREE.Color(0x4a2c1c) },
        uCrack: { value: new THREE.Color(0xff4810) },
        uLightDir: { value: new THREE.Vector3(-18, 26, -30).normalize() },
        uFogColor: { value: new THREE.Color(0x3a1408) },
        uFogDensity: { value: 0.012 },
      },
      vertexShader: /* glsl */`
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vH;

        // hash & value noise
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p); vec2 f=fract(p);
          float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
          vec2 u=f*f*(3.0-2.0*f);
          return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float s=0.0, amp=0.5;
          for(int i=0;i<4;i++){ s+=amp*noise(p); p*=2.0; amp*=0.5; }
          return s;
        }

        void main(){
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position,1.0);
          // World-space displacement so segments tile seamlessly along Z.
          float h = fbm(vec2(wp.x*0.6, wp.z*0.35)) * 0.5;
          h += fbm(vec2(wp.x*2.2, wp.z*1.5)) * 0.12;
          vH = h;
          vec3 dp = position;
          dp.y += h;
          vec4 wp2 = modelMatrix * vec4(dp,1.0);
          vWorldPos = wp2.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp2;
        }
      `,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform vec3 uColorLow;
        uniform vec3 uColorHigh;
        uniform vec3 uCrack;
        uniform vec3 uLightDir;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vH;

        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i=floor(p); vec2 f=fract(p);
          float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
          vec2 u=f*f*(3.0-2.0*f);
          return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float s=0.0, amp=0.5;
          for(int i=0;i<5;i++){ s+=amp*noise(p); p*=2.02; amp*=0.5; }
          return s;
        }

        void main(){
          vec2 wp = vWorldPos.xz;
          float rock = fbm(wp * 0.9);
          vec3 col = mix(uColorLow, uColorHigh, rock * 0.9 + vH);

          // Cracks: ridged noise threshold -> glowing magma seams
          float crackField = abs(fbm(wp * 0.5 + 3.7) - 0.5);
          float crack = smoothstep(0.04, 0.0, crackField);
          float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + wp.x + wp.y);
          col = mix(col, uCrack * pulse, crack * 0.85);

          // Cheap directional shading from height field gradient
          float hx = fbm(wp*0.9 + vec2(0.1,0.0)) - fbm(wp*0.9 - vec2(0.1,0.0));
          float hz = fbm(wp*0.9 + vec2(0.0,0.1)) - fbm(wp*0.9 - vec2(0.0,0.1));
          vec3 n = normalize(vec3(-hx, 1.0, -hz));
          float diff = clamp(dot(n, normalize(uLightDir)), 0.0, 1.0);
          col *= 0.55 + 0.65 * diff;

          // Lane tint guide (3 lanes across width 8 → x in [-4,4])
          float lane = abs(fract((vWorldPos.x + 4.0) / 2.6667) - 0.5);
          float groove = smoothstep(0.0, 0.05, 0.5 - lane);
          col = mix(col, col * 0.5, groove * 0.0); // grooves drawn separately

          // Distance fog
          float dist = length(vWorldPos - cameraPosition);
          float fogF = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
          col = mix(col, uFogColor, clamp(fogF, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }

  private buildSideTerrain(): void {
    // Raised rocky berms along both edges of the track for containment feel.
    const bermMat = new THREE.MeshStandardMaterial({ color: 0x241208, roughness: 1, metalness: 0 });
    const length = TRACK_SEGMENT_COUNT * TRACK_SEGMENT_LENGTH;
    for (const side of [-1, 1]) {
      const bermGeo = new THREE.BoxGeometry(3, 2.2, length);
      const pos = bermGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const vy = pos.getY(i);
        if (vy > 0) {
          pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.8);
          pos.setY(i, vy + (Math.random()) * 0.6);
        }
      }
      bermGeo.computeVertexNormals();
      const berm = new THREE.Mesh(bermGeo, bermMat);
      berm.position.set(side * (this.trackWidth / 2 + 1.2), 0.2, length / 2 - TRACK_SEGMENT_LENGTH / 2);
      berm.receiveShadow = true;
      berm.castShadow = true;
      this.group.add(berm);
    }

    // Faint glowing lane guide lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x6a2a12, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 2; i++) {
      const x = (LANE_X[i] + LANE_X[i + 1]) / 2;
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.08, length), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, length / 2 - TRACK_SEGMENT_LENGTH / 2);
      this.rails.add(line);
    }
  }

  update(dt: number, speed: number, time: number): void {
    this.material.uniforms.uTime.value = time;
    const dz = speed * dt;
    for (const seg of this.segments) {
      seg.position.z -= dz;
      if (seg.position.z < -TRACK_SEGMENT_LENGTH) {
        // Recycle to the far end
        const maxZ = Math.max(...this.segments.map((s) => s.position.z));
        seg.position.z = maxZ + TRACK_SEGMENT_LENGTH;
      }
    }
  }
}
