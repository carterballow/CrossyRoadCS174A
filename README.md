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

- [Node.js](https://nodejs.org/
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

> 🎧 Headphones recommended

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
- **Grass lanes** are safe, trees and rocks block movement.
- **Road lanes** have cars. Police chase lanes spawn a supercar + police car in pursuit.
- **Railway lanes** have trains. Watch for flashing warning lights. Bullet trains move ~3× faster.
- **River lanes** — hop on logs to survive. Drift off screen = death.
- Your **high score** is saved in the browser.

---

## Deployment

The project is deployed on **Vercel**. To deploy your own fork:

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel will detect Vite, so just click **Deploy**

---

## Team

- Ashutosh Sundresh
- Mergen Enkhbat
- Carter Ballow

*CS 174A — UCLA*
