import { ReactiveEffect } from "./effect";

let activeEffectScope = null;
class EffectScope {
  public active: boolean = true;
  public parent: any = null;
  public effects: ReactiveEffect[] = [];
  run(fn: () => any) {
    if (this.active) {
      try {
        this.parent = activeEffectScope;
        activeEffectScope = this;
        return fn();
      } finally {
        activeEffectScope = this.parent;
        this.parent = null;
      }
    }
  }
  stop() {
    if (this.active) {
      for (let i = 0; i < this.effects.length; i++) {
        this.effects[i].stop();
      }
      this.active = false;
    }
  }
}

export function recordEffectScope(effect: ReactiveEffect) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect);
  }
}
export function effectScope() {
  return new EffectScope();
}
