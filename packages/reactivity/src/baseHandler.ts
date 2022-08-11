import { isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { reactive } from "./reactive";
export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const baseHandler = {
  // receiver就是proxy代理对象，用于解决属性访问器的this指向问题
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) return true; // 被代理过的对象访问is_reactive枚举属性会走这个逻辑
    track<"get">(target, "get", key);
    const result = Reflect.get(target, key, receiver);
    if (isObject(result)) {
      return reactive(result); // 深度代理
    }
    return result;
  },
  set(target: any, key: string, newValue: any, receiver: any) {
    const oldValue = target[key];
    const result = Reflect.set(target, key, newValue, receiver);
    if (newValue !== oldValue) {
      trigger<"set">(target, "set", key, newValue, oldValue);
    }
    return result;
  },
};
