import { isFunction } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";

// 计算属性
class ComputedRefImpl {
  public effect: ReactiveEffect;
  public _dirty: boolean = true;
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep = new Set();
  constructor(public getter, public setter) {
    // 传入scheduler
    this.effect = new ReactiveEffect(getter, () => {
      // 依赖的值变化会走scheduler
      if (!this._dirty) {
        this._dirty = true;
        triggerEffects(this.dep);
      }
    });
  }
  get value() {
    // 使用computed的value值时应该收集这个effect
    trackEffects(this.dep);
    if (this._dirty) {
      // 收集依赖
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }
  set value(newVal: any) {
    this.setter(newVal);
  }
}

export function computed(getterOrOptions) {
  let getter;
  let setter;
  let onlyGetter = isFunction(getterOrOptions);
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("no set");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
