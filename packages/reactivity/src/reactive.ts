import { isObject } from "@vue/shared";
import { baseHandler, ReactiveFlags } from "./baseHandler";

const reactiveMap = new WeakMap<any, ProxyConstructor>();
// 将对象转化为响应式对象
export function reactive(target: any) {
  if (!isObject(target)) return;

  // 防止已经代理过的对象再次被代理
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }
  const proxy = new Proxy(target, baseHandler);

  reactiveMap.set(target, proxy);

  return proxy;
}
