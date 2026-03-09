export class HUD {
  private container: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private highScoreEl: HTMLDivElement;
  private startScreen: HTMLDivElement;
  private deathScreen: HTMLDivElement;
  private deathScoreEl: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      userSelect: 'none',
    });
    document.body.appendChild(this.container);

    // Score display (top center)
    this.scoreEl = document.createElement('div');
    Object.assign(this.scoreEl.style, {
      position: 'absolute',
      top: '30px',
      width: '100%',
      textAlign: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '2px 4px 8px rgba(0,0,0,0.5)',
    });
    this.scoreEl.textContent = '0';
    this.container.appendChild(this.scoreEl);

    // High score (top right)
    this.highScoreEl = document.createElement('div');
    Object.assign(this.highScoreEl.style, {
      position: 'absolute',
      top: '20px',
      right: '30px',
      fontSize: '16px',
      color: 'rgba(255,255,255,0.7)',
      textShadow: '1px 2px 4px rgba(0,0,0,0.4)',
    });
    this.highScoreEl.textContent = '';
    this.container.appendChild(this.highScoreEl);

    // Start screen
    this.startScreen = document.createElement('div');
    Object.assign(this.startScreen.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
    });
    this.startScreen.innerHTML = `
      <div style="font-size:64px;font-weight:bold;color:#fff;text-shadow:3px 6px 12px rgba(0,0,0,0.6);margin-bottom:16px;">
        CROSSY ROAD
      </div>
      <div style="font-size:22px;color:rgba(255,255,255,0.8);text-shadow:1px 2px 4px rgba(0,0,0,0.4);">
        Press any key to start
      </div>
      <div style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:12px;">
        WASD or Arrow Keys to move
      </div>
    `;
    this.container.appendChild(this.startScreen);

    // Death screen
    this.deathScreen = document.createElement('div');
    Object.assign(this.deathScreen.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    });

    this.deathScoreEl = document.createElement('div');
    this.deathScreen.innerHTML = `
      <div style="font-size:52px;font-weight:bold;color:#f44336;text-shadow:2px 4px 10px rgba(0,0,0,0.6);margin-bottom:8px;">
        GAME OVER
      </div>
    `;
    this.deathScoreEl = document.createElement('div');
    Object.assign(this.deathScoreEl.style, {
      fontSize: '28px',
      color: '#fff',
      textShadow: '1px 3px 6px rgba(0,0,0,0.5)',
      marginBottom: '24px',
    });
    this.deathScreen.appendChild(this.deathScoreEl);

    const restartHint = document.createElement('div');
    Object.assign(restartHint.style, {
      fontSize: '20px',
      color: 'rgba(255,255,255,0.7)',
    });
    restartHint.textContent = 'Press any key to restart';
    this.deathScreen.appendChild(restartHint);

    this.container.appendChild(this.deathScreen);
  }

  setScore(score: number): void {
    this.scoreEl.textContent = String(score);
  }

  setHighScore(score: number): void {
    if (score > 0) {
      this.highScoreEl.textContent = `Best: ${score}`;
    }
  }

  showStart(): void {
    this.startScreen.style.display = 'flex';
    this.deathScreen.style.display = 'none';
    this.scoreEl.style.display = 'none';
  }

  showPlaying(): void {
    this.startScreen.style.display = 'none';
    this.deathScreen.style.display = 'none';
    this.scoreEl.style.display = 'block';
  }

  showDeath(score: number, highScore: number): void {
    this.deathScreen.style.display = 'flex';
    this.scoreEl.style.display = 'none';
    this.deathScoreEl.textContent = `Score: ${score}`;
    this.setHighScore(highScore);
  }
}
