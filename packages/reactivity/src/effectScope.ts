import { ReactiveEffect } from "./effect";

let activeEffectScope = null;
class EffectScope {
  public active: boolean = true;
  public parent: any = null;
  public effects: ReactiveEffect[] = [];
  public scopes: EffectScope[] = []; // 子effectScope
  constructor(public detached?: boolean) {
    // 独立的effectScope 不会被父级effectScope收集
    if (!this.detached && activeEffectScope) {
      activeEffectScope.scopes.push(this);
    }
  }
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
      for (let i = 0; i < this.scopes.length; i++) {
        this.scopes[i].stop();
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

// 该efffectScope默认不是独立的，会被父级effectScope收集
export function effectScope(detached = false) {
  return new EffectScope(detached);
}
