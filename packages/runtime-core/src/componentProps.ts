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
