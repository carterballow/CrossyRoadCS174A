import type { CarVariant } from '../entities/Car';

// MP3 imports — Vite resolves these to asset URLs
import rainMp3 from './eryliaa-gentle-rain-for-relaxation-and-sleep-337279.mp3';
import riverMp3 from './dragon-studio-soothing-river-flow-372456.mp3';
import policeSirenMp3 from './dragon-studio-police-siren-397963.mp3';
import bulletTrainMp3 from './kauasilbershlachparodes-bullet-train-493988.mp3';
import trainMp3 from './kauasilbershlachparodes-train-493986.mp3';
import supercarMp3 from './freesound_community-080136_v8-supercar-acceleration-82900.mp3';
import carPassMp3 from './soundreality-car-passing-city-364146.mp3';

export interface TrainAudioInfo {
  x: number;
  laneZ: number;
  isWarning: boolean;
  isCrossing: boolean;
  direction: number;
  isBullet: boolean;
}

export interface CarAudioInfo {
  x: number;
  laneZ: number;
  speed: number;
  direction: number;
  variant: CarVariant;
}

// Only hear trains within this many lanes ahead (never behind)
const TRAIN_AHEAD_MAX = 5;

// 3D audio distance model parameters
const REF_DISTANCE = 1;
const MAX_DISTANCE = 20;
const ROLLOFF = 1.5;

/** Create an HRTF-based 3D panner node */
function createSpatialPanner(ctx: AudioContext): PannerNode {
  const panner = ctx.createPanner();
  panner.panningModel = 'HRTF';
  panner.distanceModel = 'inverse';
  panner.refDistance = REF_DISTANCE;
  panner.maxDistance = MAX_DISTANCE;
  panner.rolloffFactor = ROLLOFF;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 360;
  panner.coneOuterGain = 1;
  return panner;
}

/** Position a PannerNode in 3D space */
function setPannerPos(panner: PannerNode, x: number, y: number, z: number): void {
  if (panner.positionX) {
    const t = panner.context.currentTime;
    panner.positionX.setTargetAtTime(x, t, 0.02);
    panner.positionY.setTargetAtTime(y, t, 0.02);
    panner.positionZ.setTargetAtTime(z, t, 0.02);
  } else {
    panner.setPosition(x, y, z);
  }
}

/** Update the AudioListener to match the player's position */
function setListenerPos(ctx: AudioContext, x: number, y: number, z: number): void {
  const L = ctx.listener;
  if (L.positionX) {
    const t = ctx.currentTime;
    L.positionX.setTargetAtTime(x, t, 0.02);
    L.positionY.setTargetAtTime(y, t, 0.02);
    L.positionZ.setTargetAtTime(z, t, 0.02);
  } else {
    L.setPosition(x, y, z);
  }
}

/** Set listener orientation — facing +Z (forward in game), up is +Y */
function setListenerOrientation(ctx: AudioContext): void {
  const L = ctx.listener;
  if (L.forwardX) {
    L.forwardX.value = 0;
    L.forwardY.value = 0;
    L.forwardZ.value = 1;
    L.upX.value = 0;
    L.upY.value = 1;
    L.upZ.value = 0;
  } else {
    L.setOrientation(0, 0, 1, 0, 1, 0);
  }
}

/** Fetch and decode an MP3 URL into an AudioBuffer */
async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const resp = await fetch(url);
  const arr = await resp.arrayBuffer();
  return ctx.decodeAudioData(arr);
}

// Persistent looping source helper
interface LoopHandle {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: PannerNode | null;
}

function startLoop(
  ctx: AudioContext,
  buffer: AudioBuffer,
  volume: number,
  panner?: PannerNode,
): LoopHandle {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0;
  // Fade in
  gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.3);

  src.connect(gain);
  if (panner) {
    gain.connect(panner);
    panner.connect(ctx.destination);
  } else {
    gain.connect(ctx.destination);
  }
  src.start();

  return { source: src, gain, panner: panner ?? null };
}

function stopLoop(handle: LoopHandle | null, ctx: AudioContext): null {
  if (!handle) return null;
  handle.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  const s = handle.source;
  setTimeout(() => { try { s.stop(); } catch {} }, 600);
  return null;
}

export class AudioManager {
  private ctx: AudioContext | null = null;

  // Decoded buffers (loaded once)
  private buffers: {
    rain?: AudioBuffer;
    river?: AudioBuffer;
    policeSiren?: AudioBuffer;
    bulletTrain?: AudioBuffer;
    train?: AudioBuffer;
    supercar?: AudioBuffer;
    carPass?: AudioBuffer;
  } = {};
  private loaded = false;

  // Persistent loops
  private rainLoop: LoopHandle | null = null;
  private waterLoop: LoopHandle | null = null;
  private sirenLoop: LoopHandle | null = null;
  private supercarLoop: LoopHandle | null = null;
  private trainLoop: LoopHandle | null = null;
  private carLoop: LoopHandle | null = null;

  private orientationSet = false;

  resume(): void {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.loaded) this.loadAll();
  }

  private async loadAll(): Promise<void> {
    this.loaded = true;
    const ctx = this.ctx!;
    const [rain, river, policeSiren, bulletTrain, train, supercar, carPass] =
      await Promise.all([
        loadBuffer(ctx, rainMp3),
        loadBuffer(ctx, riverMp3),
        loadBuffer(ctx, policeSirenMp3),
        loadBuffer(ctx, bulletTrainMp3),
        loadBuffer(ctx, trainMp3),
        loadBuffer(ctx, supercarMp3),
        loadBuffer(ctx, carPassMp3),
      ]);
    this.buffers = { rain, river, policeSiren, bulletTrain, train, supercar, carPass };

    // Start rain ambient immediately
    this.startRain();
  }

  update(
    playerX: number,
    playerZ: number,
    trains: TrainAudioInfo[],
    cars: CarAudioInfo[],
    riverZs: number[],
    _delta: number,
  ): void {
    if (!this.ctx || !this.buffers.rain) return;

    if (!this.orientationSet) {
      setListenerOrientation(this.ctx);
      this.orientationSet = true;
    }
    setListenerPos(this.ctx, playerX, 0, playerZ);

    this.updateWater(playerX, playerZ, riverZs);
    this.updateTrainSound(playerX, playerZ, trains);
    this.updateSiren(playerX, playerZ, cars);
    this.updateSupercar(playerX, playerZ, cars);
    this.updateCarLoop(playerX, playerZ, cars);
  }

  // --- Jump (synthesized — quick pitch sweep, works well as-is) ---
  playJump(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(560, ctx.currentTime + 0.07);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  // --- Splash (synthesized noise burst) ---
  playSplash(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bufSize = Math.ceil(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 800;
    lpf.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    src.connect(lpf);
    lpf.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  // --- Impact (synthesized low thud) ---
  playImpact(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  // ------------------------------------------------------------------
  //  Rain ambient: constant gentle background loop (non-spatial)
  // ------------------------------------------------------------------
  private startRain(): void {
    if (this.rainLoop || !this.ctx || !this.buffers.rain) return;
    this.rainLoop = startLoop(this.ctx, this.buffers.rain, 0.07);
  }

  // ------------------------------------------------------------------
  //  Water/river ambient: spatial loop near nearest river
  // ------------------------------------------------------------------
  private updateWater(playerX: number, playerZ: number, riverZs: number[]): void {
    const ctx = this.ctx!;

    let closestZ = -1;
    let closestDist = Infinity;
    for (const rz of riverZs) {
      const d = Math.abs(rz - playerZ);
      if (d < closestDist) {
        closestDist = d;
        closestZ = rz;
      }
    }

    const inRange = closestDist <= 4;

    if (inRange && !this.waterLoop && this.buffers.river) {
      const panner = createSpatialPanner(ctx);
      panner.refDistance = 1;
      panner.maxDistance = 10;
      panner.rolloffFactor = 1.2;
      this.waterLoop = startLoop(ctx, this.buffers.river, 0.18, panner);
    } else if (!inRange && this.waterLoop) {
      this.waterLoop = stopLoop(this.waterLoop, ctx);
    }

    if (this.waterLoop?.panner && inRange) {
      setPannerPos(this.waterLoop.panner, playerX, -0.2, closestZ);
    }
  }

  // ------------------------------------------------------------------
  //  Train sounds: spatial loop for warning/crossing trains
  //  Uses bullet train MP3 for bullet trains, regular train MP3 otherwise
  // ------------------------------------------------------------------
  private updateTrainSound(_playerX: number, playerZ: number, trains: TrainAudioInfo[]): void {
    const ctx = this.ctx!;

    // Find the most relevant train (warning or crossing, ahead of player)
    const activeTrain = trains.find(t => {
      const dz = t.laneZ - playerZ;
      return (t.isWarning || t.isCrossing) && dz >= 0 && dz <= TRAIN_AHEAD_MAX;
    });

    if (activeTrain && !this.trainLoop) {
      const buf = activeTrain.isBullet ? this.buffers.bulletTrain : this.buffers.train;
      if (!buf) return;

      const panner = createSpatialPanner(ctx);
      panner.refDistance = 2;
      panner.maxDistance = 25;
      panner.rolloffFactor = 1.0;
      this.trainLoop = startLoop(ctx, buf, activeTrain.isCrossing ? 0.4 : 0.25, panner);
    } else if (!activeTrain && this.trainLoop) {
      this.trainLoop = stopLoop(this.trainLoop, ctx);
    }

    if (this.trainLoop?.panner && activeTrain) {
      // Position at the train or signal post
      if (activeTrain.isCrossing) {
        setPannerPos(this.trainLoop.panner, activeTrain.x, 0, activeTrain.laneZ);
      } else {
        const bellX = activeTrain.x - activeTrain.direction * 6;
        setPannerPos(this.trainLoop.panner, bellX, 1.5, activeTrain.laneZ);
      }
      // Louder when crossing
      const vol = activeTrain.isCrossing ? 0.45 : 0.2;
      this.trainLoop.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
    }
  }

  // ------------------------------------------------------------------
  //  Police siren: spatial loop following nearest police car
  // ------------------------------------------------------------------
  private updateSiren(playerX: number, playerZ: number, cars: CarAudioInfo[]): void {
    const ctx = this.ctx!;

    let nearest: CarAudioInfo | null = null;
    let nearestDist = Infinity;
    for (const c of cars) {
      if (c.variant !== 'police') continue;
      const d = Math.sqrt((c.x - playerX) ** 2 + (c.laneZ - playerZ) ** 2);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }

    const inRange = nearest && nearestDist < 12;

    if (inRange && !this.sirenLoop && this.buffers.policeSiren) {
      const panner = createSpatialPanner(ctx);
      panner.refDistance = 1.5;
      panner.maxDistance = 15;
      panner.rolloffFactor = 1.0;
      this.sirenLoop = startLoop(ctx, this.buffers.policeSiren, 0.22, panner);
    } else if (!inRange && this.sirenLoop) {
      this.sirenLoop = stopLoop(this.sirenLoop, ctx);
    }

    if (this.sirenLoop?.panner && nearest) {
      setPannerPos(this.sirenLoop.panner, nearest.x, 0.8, nearest.laneZ);
    }
  }

  // ------------------------------------------------------------------
  //  Supercar engine: spatial loop following nearest supercar
  // ------------------------------------------------------------------
  private updateSupercar(playerX: number, playerZ: number, cars: CarAudioInfo[]): void {
    const ctx = this.ctx!;

    let nearest: CarAudioInfo | null = null;
    let nearestDist = Infinity;
    for (const c of cars) {
      if (c.variant !== 'supercar') continue;
      const d = Math.sqrt((c.x - playerX) ** 2 + (c.laneZ - playerZ) ** 2);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }

    const inRange = nearest && nearestDist < 10;

    if (inRange && !this.supercarLoop && this.buffers.supercar) {
      const panner = createSpatialPanner(ctx);
      panner.refDistance = 1;
      panner.maxDistance = 12;
      panner.rolloffFactor = 1.2;
      this.supercarLoop = startLoop(ctx, this.buffers.supercar, 0.18, panner);
    } else if (!inRange && this.supercarLoop) {
      this.supercarLoop = stopLoop(this.supercarLoop, ctx);
    }

    if (this.supercarLoop?.panner && nearest) {
      setPannerPos(this.supercarLoop.panner, nearest.x, 0, nearest.laneZ);
      // Modulate playback rate with speed for rev feel
      const rate = 0.8 + nearest.speed * 0.06;
      this.supercarLoop.source.playbackRate.setTargetAtTime(
        Math.min(2.0, rate), ctx.currentTime, 0.05,
      );
    }
  }

  // ------------------------------------------------------------------
  //  Normal car: spatial loop following nearest normal car
  // ------------------------------------------------------------------
  private updateCarLoop(playerX: number, playerZ: number, cars: CarAudioInfo[]): void {
    const ctx = this.ctx!;

    let nearest: CarAudioInfo | null = null;
    let nearestDist = Infinity;
    for (const c of cars) {
      if (c.variant !== 'normal') continue;
      const d = Math.sqrt((c.x - playerX) ** 2 + (c.laneZ - playerZ) ** 2);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }

    const inRange = nearest && nearestDist < 8;

    if (inRange && !this.carLoop && this.buffers.carPass) {
      const panner = createSpatialPanner(ctx);
      panner.refDistance = 1;
      panner.maxDistance = 10;
      panner.rolloffFactor = 1.5;
      this.carLoop = startLoop(ctx, this.buffers.carPass, 0.2, panner);
    } else if (!inRange && this.carLoop) {
      this.carLoop = stopLoop(this.carLoop, ctx);
    }

    if (this.carLoop?.panner && nearest) {
      setPannerPos(this.carLoop.panner, nearest.x, 0, nearest.laneZ);
    }
  }

  dispose(): void {
    if (!this.ctx) return;
    this.rainLoop = stopLoop(this.rainLoop, this.ctx);
    this.waterLoop = stopLoop(this.waterLoop, this.ctx);
    this.sirenLoop = stopLoop(this.sirenLoop, this.ctx);
    this.supercarLoop = stopLoop(this.supercarLoop, this.ctx);
    this.trainLoop = stopLoop(this.trainLoop, this.ctx);
    this.carLoop = stopLoop(this.carLoop, this.ctx);
    this.ctx.close();
  }
}
