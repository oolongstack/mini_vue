export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
}

export const baseHandler = {
  // receiver就是proxy代理对象，用于解决属性访问器的this指向问题
  get(target: any, key: string, receiver: any) {
    console.log("get", target, key);
    // track
    if (key === ReactiveFlags.IS_REACTIVE) return true; // 被代理过的对象访问is_reactive枚举属性会走这个逻辑
    return Reflect.get(target, key, receiver);
  },
  set(target: any, key: string, newVal: any, receiver: any) {
    console.log("set", target, key, newVal);
    const result = Reflect.set(target, key, newVal, receiver);
    // trigger
    console.log(result);
    return result;
  },
};
