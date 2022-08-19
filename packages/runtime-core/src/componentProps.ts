import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";

/**
 * 初始化组件的props
 * @param instance
 * @param rawProps
 */
export function initProps(instance, rawProps) {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {};

  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      // 如果用户写的props含有这个key
      if (hasOwn(options, key)) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }

  instance.props = reactive(props);
  instance.attrs = attrs;
}

export function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps);
  // 先判断前后属性的个数
  if (Object.keys(prevProps).length !== nextKeys.length) {
    return true;
  }
  // 判断值
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
}
export function updateProps(prevProps, nextProps) {
  // 先看props有没有变化
  for (const key in nextProps) {
    prevProps[key] = nextProps[key];
  }
  for (const key in prevProps) {
    if (!hasOwn(nextProps, key)) {
      delete prevProps[key];
    }
  }
}
