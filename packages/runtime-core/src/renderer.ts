import { isNumber, isString, ShapeFlags } from "@vue/shared";
import { createVnode, isSameVnode, Text } from "./vnode";
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
    if (isString(child) || isNumber(child)) {
      return createVnode(Text, null, child);
    }
    return child;
  };
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children[i]);
      children[i] = child; // 字符串替换为vnode
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
      // 复用老节点，不用重新挂载到container上
      patchElement(n1, n2);
    }
  };
  const patchElement = (n1, n2) => {
    // 先复用节点，再比对属性，最后比对儿子节点
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };
  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      console.log("unmountChildren", children[i]);
      unmount(children[i]);
    }
  };
  // 对比两个节点的儿子节点
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    /**
     * 比较两个儿子的差异
     * 1 新的是文本节点，老的是数组 ：删除老的数组，挂载新的文本节点
     * 2 新的是文本节点，老的是文本节点：比较文本节点是否相同，不同则替换
     * 3 新的是数组节点，老的是数组节点: diff算法
     * 4 新的是数组节点，老的是文本节点：删除老的文本节点 挂载新的数组节点
     * 5 老的是空节点，新的是文本节点：挂载新的文本节点
     * 6 老的是空节点，新的是数组节点：挂载新的数组节点
     */
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 删除老的数组，挂载新的文本节点
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff算法
        } else {
          // 之前是数组，现在是文本，删除老的数组，挂载新的文本节点
          unmountChildren(c1);
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 之前是文本，现在是数组，挂载新的数组节点
          hostSetElementText(el, "");
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };
  const processText = (n1, n2, container) => {
    if (n1 == null) {
      const el = (n2.el = hostCreateText(n2.children));
      hostInsert(el, container);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  // 渲染器核心
  const patch = (n1, n2, container) => {
    if (n1 === n2) return;
    // 若不是同样的虚拟节点  (n1必须存在，不然就是挂载)
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }

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
