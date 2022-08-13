export function patchStyle(el, prevValue, nextValue) {
  if (!nextValue) {
    el.removeAttribute("style");
    return;
  }

  if (typeof nextValue === "string") {
    el.setAttribute("style", nextValue);
    return;
  }

  if (nextValue) {
    for (const key in nextValue) {
      if (nextValue[key] === undefined) {
        el.style.removeProperty(key);
      } else {
        el.style.setProperty(key, nextValue[key]);
      }
    }
  }

  if (prevValue) {
    for (const key in prevValue) {
      if (!Object.prototype.hasOwnProperty.call(nextValue, key)) {
        el.style.removeProperty(key);
      }
    }
  }
}
