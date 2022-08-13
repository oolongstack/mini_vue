export function patchAttr(el, prop, nextValue) {
  if (nextValue) {
    el.setAttribute(prop, nextValue);
  } else {
    el.removeAttribute(prop);
  }
}
