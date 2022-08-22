import { recordEffectScope } from "./effectScope";
// 目前活跃的 effect
export let activeEffect: any = undefined;
function cleanupEffect(effect: ReactiveEffect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    (<Set<ReactiveEffect>>deps[i]).delete(effect);
  }
  effect.deps.length = 0;
}
export class ReactiveEffect {
  public active = true; // 该effect的状态，是否活跃
  public parent = null;
  public deps = []; // 该effect依赖的值的集合 用于清理effect
  constructor(public fn: () => any, public scheduler?) {
    recordEffectScope(this); // 记录当前effect 用于effectScope
  }
  run() {
    try {
      // 非激活状态无需进行依赖收集，只需执行fn即可
      if (!this.active) return this.fn();
      this.parent = activeEffect;
      activeEffect = this;
      // 执行之前，将之前收集的effect清空，重新收集effect（分支处理）
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this);
    }
  }
}

// fn可以根据状态变化重新执行，而且effect可以嵌套使用
export function effect(fn: () => any, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // 默认执行一次effect
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

// WeakMap => (target,new Map() => (key,new Set() => (activeEffect)))
const targetMap = new WeakMap<any, any>();
export function track<T>(target: any, type: T, key: string) {
  if (!activeEffect) return; // 没有活跃的effect（没有在effect中使用变量），不需要进行依赖收集
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key) as Set<ReactiveEffect>;
  if (!dep) {
    depsMap.set(key, (dep = new Set<ReactiveEffect>()));
  }
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (activeEffect) {
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
}

export function trigger<T>(
  target: any,
  type: T,
  key: string,
  newValue: any,
  oldValue: any
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  let effects = depsMap.get(key) as Set<ReactiveEffect>;
  if (effects) {
    triggerEffects(effects);
  }
}

export function triggerEffects(effects) {
  effects = new Set(effects);
  effects.forEach((effect) => {
    if (effect.active && activeEffect !== effect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  });
}
