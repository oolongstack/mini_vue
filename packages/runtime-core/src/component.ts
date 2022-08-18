import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode) {
  // 组件实例
  const instance = {
    data: null, // 响应式数据
    vnode,
    subTree: null, //组件渲染的真正的vnode
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props || {},
    props: {}, // 组件的props
    attrs: {},
    proxy: null, // 渲染上下文，代理props，state等数据
  };
  return instance;
}
const publicPropertyMap = {
  $attrs: (i) => i.attrs,
};

// 组件render函数中取值设置值的时候，会走这个方法
const publicInstanceProxy = {
  get(target, key) {
    const { props, data } = target; // state props都是响应式的
    if (data && hasOwn(data, key)) {
      // 收集依赖
      return data[key];
    } else if (props && hasOwn(props, key)) {
      // 收集依赖
      return props[key];
    } else {
      // $attrs 等
      const getter = publicPropertyMap[key];
      if (getter) {
        return getter(target);
      }
    }
  },
  set(target, key, newVal) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      // 触发更新
      data[key] = newVal;
      return true;
    } else if (props && hasOwn(props, key)) {
      console.warn(`props key ${String(key)} is readonly`);
      return false;
    } else {
      return true;
    }
  },
};
export function setupComponent(instance) {
  const { type, props } = instance.vnode;
  initProps(instance, props);

  instance.proxy = new Proxy(instance, publicInstanceProxy);

  // 用户写的data
  const { data, render } = type;
  if (data) {
    if (!isFunction(data)) {
      return console.warn("data must be a function");
    }
    instance.data = reactive(data.call(instance.proxy));
  }
  if (render) {
    instance.render = render;
  }
}
