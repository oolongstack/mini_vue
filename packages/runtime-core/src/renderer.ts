import { isString, ShapeFlags } from "@vue/shared";
import { createVnode, Text } from "./vnode";
export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    remove: hostRemove,
    setText: hostSetText,
    nextSibling: hostNextSibling,
  } = renderOptions;
  const normalize = (child) => {
    if (isString(child)) {
      return createVnode(Text, null, child);
    }
    return child;
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children[i]);
      patch(null, child, container);
    }
  };
  const mountElement = (vnode, container) => {
    const { type, props, children, shapeFlag } = vnode;
    // 创建元素
    const el = (vnode.el = hostCreateElement(type));
    // 处理属性
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (children) {
      if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 文本
        hostSetElementText(el, children);
      } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el);
      }
    }
    hostInsert(el, container);
  };
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      // 挂载
      mountElement(n2, container);
    } else {
    }
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      const el = (n2.el = hostCreateText(n2.children));
      hostInsert(el, container);
    } else {
    }
  };
  // 渲染器核心
  const patch = (n1, n2, container) => {
    if (n1 === n2) return;
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        }
    }
  };
  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };
  const render = (vnode, container) => {
    if (vnode == null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      // 更新，第一次渲染 container上挂一个_vnode 第二次进行渲染的时候，就知道是更新了
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  return {
    render,
  };
}
