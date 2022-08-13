import { isArray, isObject } from "@vue/shared";
import { ReactiveEffect, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
// 对象就使用reactive包裹成一个proxy
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
class RefImpl {
  public _value;
  public __v_isRef = true;
  public dep = new Set<ReactiveEffect>();
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackEffects(this.dep);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}

class ObjectRefImpl {
  constructor(public object, public key) {}
  get value() {
    return this.object[this.key];
  }
  set value(newValue) {
    this.object[this.key] = newValue;
  }
}
export function ref(value) {
  return new RefImpl(value);
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    result[key] = toRef(object, key);
  }
  return result;
}

export function toRef(object, key) {
  return new ObjectRefImpl(object, key);
}

export function proxyRefs(object) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      if (r.__v_isRef) {
        return r.value;
      }
      return r;
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key];
      if (oldValue.__v_isRef) {
        oldValue.value = newValue;
        return true;
      }
      return Reflect.set(target, key, newValue, receiver);
    },
  });
}
