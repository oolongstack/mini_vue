import { reactive, ReactiveEffect } from "@vue/reactivity";
import { invokeArrayFns, isNumber, isString, ShapeFlags } from "@vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { hasPropsChanged, updateProps } from "./componentProps";
import { queueJob } from "./scheduler";
import { getSequence } from "./sequence";
import { createVnode, isSameVnode, Text, Fragment } from "./vnode";
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
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor);
  };
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 挂载
      mountElement(n2, container, anchor);
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
          patchKeyedChildren(c1, c2, el);
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
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // sync from start
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // sync from end
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // common sequence + mount     i > e1 && i <= e2  挂载i到e2
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    }
    // common sequence + unmount   i <= e1 && i > e2  删除i到e1
    else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }
    // 乱序比对
    let s1 = i;
    let s2 = i;
    // 新的乱序序列的key对应的索引
    const keyToNewIndexMap = new Map();
    for (let i = s2; i <= e2; i++) {
      const childVnode = c2[i];
      keyToNewIndexMap.set(childVnode.key, i);
    }

    const toBePatched = e2 - s2 + 1;
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
    // 区老列表里去找key相同的进行patch，找不到的就删除
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i];
      const newIndex = keyToNewIndexMap.get(oldChild.key); // 寻找新的节点中是否有老的节点的key
      if (!newIndex) {
        unmount(oldChild);
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], el);
      }
    }

    const sequence = getSequence(newIndexToOldIndexMap);
    let j = sequence.length - 1;
    // patch完之后倒序插入
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = i + s2;
      const current = c2[index];
      const anchor = index + 1 < c2.length ? c2[index + 1].el : null;

      if (newIndexToOldIndexMap[i] === 0) {
        // 需要创建
        patch(null, current, el, anchor);
      } else {
        // 需要移动
        if (i !== sequence[j]) {
          hostInsert(current.el, el, anchor);
        } else {
          j--;
        }
      }
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      const el = (n2.el = hostCreateText(n2.children));
      hostInsert(el, container, anchor);
    } else {
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processFragment = (n1, n2, container) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const shouldUpdateComponent = (n1, n2) => {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevProps === nextProps) return false;
    if (prevChildren || nextChildren) {
      return true;
    }
    if (hasPropsChanged(prevProps, nextProps)) {
      return true;
    }
    return false;
  };
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      // 更新前的准备（更新props，slots等）
      // 更新组件
      instance.update();
    }
  };
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 挂载n2
      // console.log(n2);
      mountComponent(n2, container, anchor);
    } else {
      // patch组件  (传入的props改变等)
      updateComponent(n1, n2);
    }
  };
  const mountComponent = (vnode, container, anchor) => {
    const instance = (vnode.component = createComponentInstance(vnode));
    setupComponent(instance);

    setupRenderEffect(instance, container, anchor);
  };
  const setupRenderEffect = (instance, container, anchor) => {
    const { render } = instance;
    const componentUpdate = () => {
      if (!instance.isMounted) {
        // 执行bm
        const { bm, m } = instance;
        if (bm) {
          invokeArrayFns(bm);
        }
        const subTree = render.call(instance.proxy);
        patch(null, subTree, container, anchor);
        instance.subTree = subTree;
        instance.isMounted = true;
        if (m) {
          invokeArrayFns(m);
        }
      } else {
        const { next, bu, u } = instance;
        if (next) {
          updateComponentPreRender(instance, next);
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        const subTree = render.call(instance.proxy);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
        if (u) {
          invokeArrayFns(u);
        }
      }
    };
    const effect = new ReactiveEffect(componentUpdate, () => {
      queueJob(instance.update);
    });
    const update = (instance.update = effect.run.bind(effect));
    update();
  };
  const updateComponentPreRender = (instance, next) => {
    instance.next = null;
    instance.vnode = next;
    updateProps(instance.props, next.props);
  };
  // 渲染器核心
  const patch = (n1, n2, container, anchor = null) => {
    // debugger;
    if (n1 === n2) return;
    // 若不是同样的虚拟节点  (n1必须存在，不然就是挂载)
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // console.log(n2);
          processComponent(n1, n2, container, anchor);
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
