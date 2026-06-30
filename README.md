# 🦖 Dino Runner — Endless Prehistoric Runner

Un *endless runner* 3D inspiré de Subway Surfers, transposé dans un univers
préhistorique de fin du monde : volcan en éruption, ciel embrasé, coulées de
lave et dinosaures. Construit avec **Three.js (WebGL)**, **TypeScript**,
**Vite** et **TailwindCSS**.

## ✨ Fonctionnalités

- **Gameplay 3 voies** façon Subway Surfers (gauche / centre / droite).
- **Saut** avec gravité réaliste et **glissade** au sol (hitbox réduite).
- **Vitesse progressive** : le défilement accélère linéairement avec le temps.
- **Génération procédurale infinie** d'obstacles et d'os, avec recyclage
  (object pooling) et garantie d'au moins une voie franchissable.
- **Obstacles thématiques** :
  - *À sauter* : coulées de lave, troncs calcinés, failles béantes.
  - *À éviter en glissant* : ptérodactyles volant bas, arches rocheuses.
  - *Bloqueurs de voie* : stégosaures et tricératops immobiles.
- **Environnement réaliste sans assets externes** : sol de roche volcanique en
  shader procédural (fissures de magma animées), ciel en dégradé, volcan actif
  avec braises et panache de fumée, montagnes en parallaxe, cendres qui
  tombent, brouillard exponentiel, ombres temps réel et tone mapping ACES.
- **Boutique & économie** : collecte d'**os** (monnaie), 4 dinosaures
  paramétriques déblocables (T-Rex gratuit, Tricératops 100, Vélociraptor 250,
  Spinosaure 500). Sauvegarde du **highscore** et du total d'os via
  `localStorage`.
- **Audio procédural** (Web Audio API) : saut, glissade, collecte, crash et
  grondement volcanique — aucun fichier son requis.
- **UI complète** (HTML/Tailwind) : menu d'accueil, HUD, boutique, pause,
  écran de game over.
- **Contrôles clavier et tactiles** (swipe).

## 🎮 Contrôles

| Action | Touches |
| --- | --- |
| Voie gauche | `←` / `Q` / `A` ou swipe gauche |
| Voie droite | `→` / `D` ou swipe droite |
| Sauter | `↑` / `Z` / `W` / `Espace` ou swipe haut |
| Glisser | `↓` / `S` ou swipe bas |

## 🚀 Démarrage

```bash
npm install      # installe three, vite, tailwind…
npm run dev      # serveur de dev → http://localhost:5173
npm run build    # build de production (type-check + bundle)
npm run preview  # prévisualise le build
```

## 🏗️ Architecture

```
src/
├── main.ts                       # point d'entrée
├── style.css                     # Tailwind + styles custom
├── components/
│   └── UI.ts                     # overlay : menu, HUD, boutique, game over
└── game/
    ├── Game.ts                   # boucle principale, renderer, caméra
    ├── Environment.ts            # ciel, volcan, montagnes, cendres, lumières, fog
    ├── Track.ts                  # sol 3 voies défilant (shader procédural)
    ├── constants.ts              # réglages gameplay
    ├── entities/
    │   ├── Player.ts             # joueur : voies, saut, glissade, hitbox
    │   ├── Dinos.ts              # factory des 4 dinosaures paramétriques
    │   ├── Obstacles.ts          # lave, tronc, faille, ptéro, arche, blocs
    │   └── Bone.ts               # os collectable (merge de géométrie)
    └── managers/
        ├── Input.ts              # clavier + tactile
        ├── State.ts              # machine à états (menu/jeu/boutique/…)
        ├── Sound.ts              # audio procédural (Web Audio)
        ├── Storage.ts            # persistance localStorage
        ├── Collision.ts          # collisions AABB + collecte d'os
        └── ProceduralGeneration.ts # spawner infini avec object pooling
```

## 📝 Notes techniques

- Le sol utilise un `ShaderMaterial` : displacement par bruit fbm dans le
  vertex shader, fissures de magma pulsantes et brouillard dans le fragment
  shader, le tout en coordonnées monde pour un *tiling* sans couture des
  segments recyclés.
- Les dinosaures sont entièrement procéduraux (primitives groupées), animés
  par cinématique simple (cycle de pattes, balancement de queue, bob de tête).
- Aucune dépendance d'assets : modèles, textures et sons sont tous générés au
  runtime.
