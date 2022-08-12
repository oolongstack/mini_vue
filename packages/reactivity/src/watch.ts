import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

function traversal(value, set = new Set()) {
  if (!isObject(value)) return value;
  if (set.has(value)) return value;
  set.add(value);
  for (const key in value) {
    // value[key] 取值 收集依赖
    traversal(value[key], set);
  }
  return value;
}
// source是对象或函数，如果是对象，将深度监听该对象，如果是函数，就监听函数的返回值
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 对用户传入的数据递归循环收集依赖
    getter = () => traversal(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn;
  };
  let oldValue;
  const job = () => {
    if (cleanup) cleanup();
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  };
  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
}
