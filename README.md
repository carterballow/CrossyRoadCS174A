# 🐔 Crossy Road — CS 174A Final Project

A browser 3D reimagining of the classic mobile game **Crossy Road**, built with **Three.js** and **TypeScript**

**[Play it live](https://crossy-road-cs-174-a.vercel.app/)**

---

## Overview

Navigate a low poly chicken through an infinite, procedurally generated lanes in the city with a night theme in the back. Dodge cars, avoid trains, hop on logs, and survive as long as possible. The speed increases of the objects as you progress. The world is set in a rainy urban night and has HRTF spatial audio.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Three.js](https://threejs.org/) | 3D rendering, shaders, scene graph |
| TypeScript | Primary language |
| [Vite](https://vitejs.dev/) | Dev server & bundler |
| Web Audio API | HRTF spatial audio & sound synthesis |
| GLSL | Custom water + puddle shaders |
| Vercel | Deployment |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/carterballow/CrossyRoadCS174A.git
cd CrossyRoadCS174A

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open your browser and go to: **http://localhost:5173**

> 🎧 Headphones recommended — the game uses HRTF binaural spatial audio.

---

## How to Play

| Key | Action |
|-----|--------|
| `W` | Hop forward |
| `S` | Hop backward |
| `A` | Hop left |
| `D` | Hop right |
| Any key | Start game / restart after death |

- **Goal:** Reach the highest row number before dying.
- **Grass lanes** are safe — trees and rocks block movement.
- **Road lanes** have cars. Police chase lanes spawn a supercar + police car in pursuit.
- **Railway lanes** have trains. Watch for flashing warning lights. Bullet trains move ~3× faster.
- **River lanes** — hop on logs to survive. Drift off screen = death.
- **Idle penalty:** Standing still for more than 5 seconds drains your score at 1 pt/sec.
- Your **high score** is saved in the browser.

---

## Features

- **Procedural generation** — infinite lanes with tuned difficulty scaling
- **Custom GLSL water shader** — 6-layer wave simulation, caustics, Fresnel reflection, foam, rain ripples
- **Wet ground / puddle shader** — animated splash ripples with normal perturbation
- **HRTF 3D spatial audio** — vehicles are audible before they appear on screen
- **AABB collision detection** — per-frame checks for vehicles, trains, and logs
- **Particle system** — squash + red burst on vehicle death, splash + blue arc on drowning
- **UnrealBloom post-processing** — every light source glows into the scene
- **Instanced rain system** — 200 animated rain drops synchronized with puddle shaders
- **Police chase lane** — original mechanic not in the source game
- **Bullet train variant** — sleeker geometry, early audio warning, ~3× speed
- **Difficulty curve** — `difficulty = min(4.0, 1 + max(0, Z) × 0.065)`

---

## Project Structure

```
CrossyRoadCS174A/
├── src/
│   ├── main.ts          # Entry point
│   ├── game/            # Game loop, state machine
│   ├── lanes/           # Lane generation & types
│   ├── entities/        # Player, vehicles, trains, logs
│   ├── shaders/         # GLSL water + puddle shaders
│   ├── audio/           # AudioManager, HRTF setup
│   └── particles/       # Particle system archetypes
├── public/              # Static assets
├── index.html
├── vite.config.ts
└── tsconfig.json
```

> Note: folder structure is approximate — update if yours differs.

---

## Deployment

The project is deployed on **Vercel**. To deploy your own fork:

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel will auto-detect Vite — just click **Deploy**

---

## Team

- Ashutosh Sundresh
- Mergen Enkhbat
- Carter Ballow

*CS 174A — UCLA*
