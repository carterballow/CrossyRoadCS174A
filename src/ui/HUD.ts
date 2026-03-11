export class HUD {
  private container: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private highScoreEl: HTMLDivElement;
  private startScreen: HTMLDivElement;
  private deathScreen: HTMLDivElement;
  private deathScoreEl: HTMLDivElement;
  private deathHighScoreEl: HTMLDivElement;
  private newBestEl: HTMLDivElement;

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
      fontSize: '52px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '0 0 20px rgba(100,200,255,0.4), 2px 4px 8px rgba(0,0,0,0.6)',
      letterSpacing: '2px',
    });
    this.scoreEl.textContent = '0';
    this.container.appendChild(this.scoreEl);

    // High score (top right)
    this.highScoreEl = document.createElement('div');
    Object.assign(this.highScoreEl.style, {
      position: 'absolute',
      top: '24px',
      right: '30px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.5)',
      textShadow: '1px 2px 4px rgba(0,0,0,0.4)',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    });
    this.highScoreEl.textContent = '';
    this.container.appendChild(this.highScoreEl);

    // Start screen
    this.startScreen = this.buildStartScreen();
    this.container.appendChild(this.startScreen);

    // Death screen
    const { screen, scoreEl, highScoreEl, newBestEl } = this.buildDeathScreen();
    this.deathScreen = screen;
    this.deathScoreEl = scoreEl;
    this.deathHighScoreEl = highScoreEl;
    this.newBestEl = newBestEl;
    this.container.appendChild(this.deathScreen);
  }

  private buildStartScreen(): HTMLDivElement {
    const screen = document.createElement('div');
    Object.assign(screen.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
    });

    const title = document.createElement('div');
    Object.assign(title.style, {
      fontSize: '72px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '0 0 40px rgba(100,200,255,0.3), 0 0 80px rgba(100,200,255,0.15), 3px 6px 12px rgba(0,0,0,0.6)',
      marginBottom: '8px',
      letterSpacing: '4px',
    });
    title.textContent = 'CROSSY ROAD';
    screen.appendChild(title);

    const subtitle = document.createElement('div');
    Object.assign(subtitle.style, {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.4)',
      letterSpacing: '6px',
      textTransform: 'uppercase',
      marginBottom: '40px',
    });
    subtitle.textContent = 'Night Edition';
    screen.appendChild(subtitle);

    const prompt = document.createElement('div');
    Object.assign(prompt.style, {
      fontSize: '20px',
      color: 'rgba(255,255,255,0.7)',
      textShadow: '1px 2px 4px rgba(0,0,0,0.4)',
      animation: 'pulse 2s ease-in-out infinite',
    });
    prompt.textContent = 'Press any key to start';
    screen.appendChild(prompt);

    const controls = document.createElement('div');
    Object.assign(controls.style, {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.35)',
      marginTop: '16px',
      letterSpacing: '1px',
    });
    controls.textContent = 'WASD or Arrow Keys to move';
    screen.appendChild(controls);

    // CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return screen;
  }

  private buildDeathScreen(): {
    screen: HTMLDivElement;
    scoreEl: HTMLDivElement;
    highScoreEl: HTMLDivElement;
    newBestEl: HTMLDivElement;
  } {
    const screen = document.createElement('div');
    Object.assign(screen.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, rgba(20,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)',
    });

    const gameOver = document.createElement('div');
    Object.assign(gameOver.style, {
      fontSize: '56px',
      fontWeight: 'bold',
      color: '#ff4444',
      textShadow: '0 0 30px rgba(255,50,50,0.4), 2px 4px 10px rgba(0,0,0,0.6)',
      marginBottom: '16px',
      letterSpacing: '3px',
    });
    gameOver.textContent = 'GAME OVER';
    screen.appendChild(gameOver);

    const scoreEl = document.createElement('div');
    Object.assign(scoreEl.style, {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '1px 3px 6px rgba(0,0,0,0.5)',
      marginBottom: '8px',
    });
    screen.appendChild(scoreEl);

    const newBestEl = document.createElement('div');
    Object.assign(newBestEl.style, {
      fontSize: '18px',
      color: '#ffcc00',
      textShadow: '0 0 15px rgba(255,200,0,0.4)',
      marginBottom: '8px',
      display: 'none',
      letterSpacing: '2px',
    });
    newBestEl.textContent = 'NEW BEST!';
    screen.appendChild(newBestEl);

    const highScoreEl = document.createElement('div');
    Object.assign(highScoreEl.style, {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.5)',
      marginBottom: '32px',
    });
    screen.appendChild(highScoreEl);

    const restartHint = document.createElement('div');
    Object.assign(restartHint.style, {
      fontSize: '18px',
      color: 'rgba(255,255,255,0.6)',
      animation: 'pulse 2s ease-in-out infinite',
    });
    restartHint.textContent = 'Press any key to restart';
    screen.appendChild(restartHint);

    return { screen, scoreEl, highScoreEl, newBestEl };
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
    this.scoreEl.style.animation = 'fadeIn 0.3s ease-out';
  }

  showDeath(score: number, highScore: number, isNewBest: boolean): void {
    this.deathScreen.style.display = 'flex';
    this.deathScreen.style.animation = 'fadeIn 0.4s ease-out';
    this.scoreEl.style.display = 'none';
    this.deathScoreEl.textContent = `Score: ${score}`;
    this.deathHighScoreEl.textContent = `Best: ${highScore}`;
    this.newBestEl.style.display = isNewBest ? 'block' : 'none';
    this.setHighScore(highScore);
  }
}
