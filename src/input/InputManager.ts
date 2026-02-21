export class InputManager {
  private pressed = new Set<string>();
  private consumed = new Set<string>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
      }
      if (!this.pressed.has(key)) {
        this.pressed.add(key);
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.pressed.delete(key);
      this.consumed.delete(key);
    });
  }

  // Returns true once per physical press — ignores held keys.
  justPressed(key: string): boolean {
    const k = key.toLowerCase();
    if (this.pressed.has(k) && !this.consumed.has(k)) {
      this.consumed.add(k);
      return true;
    }
    return false;
  }

  // Returns true if any key was just pressed (unconsumed).
  anyJustPressed(): boolean {
    for (const k of this.pressed) {
      if (!this.consumed.has(k)) {
        this.consumed.add(k);
        return true;
      }
    }
    return false;
  }
}
