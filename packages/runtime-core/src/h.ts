import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";

/**
 * @param type 类型 div 组件等
 * @param propsOrChildren
 * @param children
 */
export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVnode(propsOrChildren)) {
        return createVnode(type, null, [propsOrChildren]);
      }
      return createVnode(type, propsOrChildren);
    } else {
      return createVnode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = [...arguments].slice(2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    // 其他情况 1
    return createVnode(type, propsOrChildren, children);
  }
}
