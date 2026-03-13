export interface TrainAudioInfo {
  x: number;
  laneZ: number;
  isWarning: boolean;
  isCrossing: boolean;
  direction: number;
}

export interface CarAudioInfo {
  x: number;
  laneZ: number;
  speed: number;
  direction: number;
}

// Only hear trains within this many lanes ahead (never behind)
const TRAIN_AHEAD_MAX = 5;
// Car whoosh only fires when car is within this X distance of player
const CAR_X_TRIGGER = 2.0;
// Seconds between car sound triggers
const CAR_COOLDOWN = 0.4;

// 3D audio distance model parameters
const REF_DISTANCE = 1;     // distance at which volume is full
const MAX_DISTANCE = 20;    // beyond this, sound is silent
const ROLLOFF = 1.5;        // how fast volume drops with distance

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

/** Position a PannerNode in 3D space (game coords: x=left/right, z=forward) */
function setPannerPos(panner: PannerNode, x: number, y: number, z: number): void {
  if (panner.positionX) {
    // Modern API — smooth interpolation
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
    // Forward: looking toward +Z (direction player walks)
    L.forwardX.value = 0;
    L.forwardY.value = 0;
    L.forwardZ.value = 1;
    // Up: +Y
    L.upX.value = 0;
    L.upY.value = 1;
    L.upZ.value = 0;
  } else {
    L.setOrientation(0, 0, 1, 0, 1, 0);
  }
}

export class AudioManager {
  private ctx: AudioContext | null = null;

  // Persistent train warning (bell when signal is flashing)
  private warnOsc: OscillatorNode | null = null;
  private warnLfo: OscillatorNode | null = null;
  private warnGain: GainNode | null = null;
  private warnPanner: PannerNode | null = null;

  // Persistent train rumble (while crossing)
  private rumbleOsc: OscillatorNode | null = null;
  private rumbleOsc2: OscillatorNode | null = null;
  private rumbleGain: GainNode | null = null;
  private rumblePanner: PannerNode | null = null;

  private carCooldown = 0;
  private orientationSet = false;

  resume(): void {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  update(
    playerX: number,
    playerZ: number,
    trains: TrainAudioInfo[],
    cars: CarAudioInfo[],
    delta: number,
  ): void {
    if (!this.ctx) return;

    // Set listener orientation once (it doesn't change)
    if (!this.orientationSet) {
      setListenerOrientation(this.ctx);
      this.orientationSet = true;
    }

    // Move the listener to the player's position (y=0, ground level)
    setListenerPos(this.ctx, playerX, 0, playerZ);

    this.carCooldown = Math.max(0, this.carCooldown - delta);

    // ---- Train warning bell ----
    // Only trains AHEAD of the player and within range
    const warningTrain = trains.find(t => {
      const dz = t.laneZ - playerZ;
      return t.isWarning && dz >= 0 && dz <= TRAIN_AHEAD_MAX;
    });

    if (warningTrain && !this.warnOsc) {
      this.startTrainWarning();
    } else if (!warningTrain && this.warnOsc) {
      this.stopTrainWarning();
    }
    if (this.warnPanner && warningTrain) {
      // Position the bell at the train's signal post location
      // Offset X by direction so the bell comes from the side the train approaches
      const bellX = warningTrain.x - warningTrain.direction * 6;
      setPannerPos(this.warnPanner, bellX, 1.5, warningTrain.laneZ);
    }

    // ---- Train crossing rumble ----
    // Only trains on same lane or 1 lane ahead
    const crossingTrain = trains.find(t => {
      const dz = t.laneZ - playerZ;
      return t.isCrossing && dz >= 0 && dz <= 2;
    });

    if (crossingTrain && !this.rumbleOsc) {
      this.startTrainRumble();
    } else if (!crossingTrain && this.rumbleOsc) {
      this.stopTrainRumble();
    }
    if (this.rumblePanner && crossingTrain) {
      // Position the rumble at the train body itself — moves with it
      setPannerPos(this.rumblePanner, crossingTrain.x, 0, crossingTrain.laneZ);
    }

    // ---- Car pass (subtle) ----
    // Only cars on the player's exact lane or 1 lane adjacent, passing close in X
    if (this.carCooldown <= 0) {
      const nearCar = cars.find(c => {
        const dz = Math.abs(c.laneZ - playerZ);
        const dx = Math.abs(c.x - playerX);
        // Prefer cars moving toward the player
        const movingToward = c.direction * (playerX - c.x) > 0;
        return dz <= 1 && dx < CAR_X_TRIGGER && movingToward;
      });
      if (nearCar) {
        this.playCarPass(nearCar.x, nearCar.laneZ, nearCar.speed);
        this.carCooldown = CAR_COOLDOWN;
      }
    }
  }

  // Called from Game.ts when player successfully hops
  playJump(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Quick pitch-up sine sweep — plays at listener position (no spatialization needed)
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

  // Called from Game.ts on drown death
  playSplash(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // White noise through a lowpass for a watery splat — at player feet
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

  // Called from Game.ts on squash death
  playImpact(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Low thud: short sine at 70 Hz with sharp attack and fast decay
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
  //  Train warning bell: LFO-chopped sine — ding ding ding
  //  Now placed in 3D space via HRTF PannerNode
  // ------------------------------------------------------------------
  private startTrainWarning(): void {
    const ctx = this.ctx!;

    const panner = createSpatialPanner(ctx);
    panner.refDistance = 2;
    panner.maxDistance = 25;
    panner.rolloffFactor = 1.2;
    panner.connect(ctx.destination);

    const gain = ctx.createGain();
    gain.gain.value = 0.28;
    gain.connect(panner);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(gain);
    osc.start();

    // Square LFO at 1.8 Hz chops gain → ding rhythm
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 1.8;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.14;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    this.warnOsc = osc;
    this.warnLfo = lfo;
    this.warnGain = gain;
    this.warnPanner = panner;
  }

  private stopTrainWarning(): void {
    const ctx = this.ctx!;
    if (this.warnGain) this.warnGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    const osc = this.warnOsc;
    const lfo = this.warnLfo;
    setTimeout(() => { osc?.stop(); lfo?.stop(); }, 300);
    this.warnOsc = this.warnLfo = this.warnGain = this.warnPanner = null;
  }

  // ------------------------------------------------------------------
  //  Train crossing rumble: sawtooth → lowpass — heavy freight sound
  //  3D positioned at the moving train body
  // ------------------------------------------------------------------
  private startTrainRumble(): void {
    const ctx = this.ctx!;

    const panner = createSpatialPanner(ctx);
    panner.refDistance = 1;
    panner.maxDistance = 15;
    panner.rolloffFactor = 1.0;
    panner.connect(ctx.destination);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(panner);
    gain.gain.setTargetAtTime(0.4, ctx.currentTime, 0.12);

    // Low-freq sawtooth body
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 160;
    lpf.connect(gain);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 52;
    osc.connect(lpf);
    osc.start();

    // Second oscillator for metallic texture (higher harmonic)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 104;
    const g2 = ctx.createGain();
    g2.gain.value = 0.3;
    osc2.connect(g2);
    g2.connect(lpf);
    osc2.start();

    this.rumbleOsc = osc;
    this.rumbleOsc2 = osc2;
    this.rumbleGain = gain;
    this.rumblePanner = panner;
  }

  private stopTrainRumble(): void {
    const ctx = this.ctx!;
    if (this.rumbleGain) this.rumbleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.18);
    const osc = this.rumbleOsc;
    const osc2 = this.rumbleOsc2;
    setTimeout(() => { osc?.stop(); osc2?.stop(); }, 600);
    this.rumbleOsc = this.rumbleOsc2 = this.rumbleGain = this.rumblePanner = null;
  }

  // ------------------------------------------------------------------
  //  Car pass: bandpass noise burst — 3D positioned at the car
  // ------------------------------------------------------------------
  private playCarPass(carX: number, carZ: number, speed: number): void {
    const ctx = this.ctx!;

    const duration = 0.12;
    const bufSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 400 + speed * 30;
    bpf.Q.value = 1.2;

    const panner = createSpatialPanner(ctx);
    panner.refDistance = 0.8;
    panner.maxDistance = 8;
    panner.rolloffFactor = 2;
    setPannerPos(panner, carX, 0, carZ);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    src.start();
  }

  dispose(): void {
    this.stopTrainWarning();
    this.stopTrainRumble();
    this.ctx?.close();
  }
}
