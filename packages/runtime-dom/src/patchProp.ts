// 对于dom节点属性的操作在这里

import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

/**
 * @param el dom节点
 * @param key 属性名
 * @param prevValue 老值
 * @param nextValue 新值
 */
export function patchProp(el, key, prevValue, nextValue) {
  // 类名 classname
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    // 样式 style
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    // 事件 event
    patchEvent(el, key, nextValue);
  } else {
    // 其他属性
    patchAttr(el, key, nextValue);
  }
}
