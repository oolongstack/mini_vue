// 目前活跃的 effect
export let activeEffect: any = undefined;

class ReactiveEffect {
  public active = true; // 该effect的状态，是否活跃
  public parent = null;
  constructor(public fn: () => any) {}
  run() {
    try {
      // 非激活状态无需进行依赖收集，只需执行fn即可
      if (!this.active) return this.fn();
      this.parent = activeEffect;
      activeEffect = this;
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  stop() {
    this.active = false;
  }
}

// fn可以根据状态变化重新执行，而且effect可以嵌套使用
export function effect(fn: () => any) {
  const _effect = new ReactiveEffect(fn);
  // 默认执行一次effect
  _effect.run();
}
