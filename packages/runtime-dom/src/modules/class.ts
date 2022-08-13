export function patchClass(el, nextValue) {
  if (nextValue != null) {
    el.className = nextValue;
  } else {
    el.removeAttribute("class");
  }
}
