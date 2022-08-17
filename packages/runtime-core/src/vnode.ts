import { isArray, isString, ShapeFlags } from "@vue/shared";

export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

export function isVnode(value) {
  return value ? value.__v_isVNode === true : false;
}
// 标签名和key都一样才是同样的vnode
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
/**
 * @param type div p 组件
 * @param props dom节点属性 组件的props
 * @param children
 */
export function createVnode(type, props, children = null) {
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT /* ELEMENT */
    : 0; /* HOST */
  const vnode = {
    __v_isVNode: true, // vnode标识
    shapeFlag,
    el: null,
    type,
    props,
    children,
    key: props?.key, // 没有时为undefined
  };

  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      // children不是数组
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type;
  }
  return vnode;
}
