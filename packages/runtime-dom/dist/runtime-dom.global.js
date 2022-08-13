var VueRuntimeDOM = (() => {
  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    },
    createElement(tag) {
      return document.createElement(tag);
    },
    createText(text) {
      return document.createTextNode(text);
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  function patchAttr(el, prop, nextValue) {
    if (nextValue) {
      el.setAttribute(prop, nextValue);
    } else {
      el.removeAttribute(prop);
    }
  }

  // packages/runtime-dom/src/modules/class.ts
  function patchClass(el, nextValue) {
    if (nextValue != null) {
      el.className = nextValue;
    } else {
      el.removeAttribute("class");
    }
  }

  // packages/runtime-dom/src/modules/event.ts
  function patchEvent(el, eventName, nextValue) {
    let invokers = el._vei || (el._vei = {});
    let exits = invokers[eventName];
    if (exits && nextValue) {
      exits.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvoker(nextValue);
        el.addEventListener(event, invoker);
      } else if (exits) {
        el.removeEventListener(event, exits);
        delete invokers[eventName];
      }
    }
  }
  function createInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
  }

  // packages/runtime-dom/src/modules/style.ts
  function patchStyle(el, prevValue, nextValue) {
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
        if (nextValue[key] === void 0) {
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

  // packages/runtime-dom/src/patchProp.ts
  function patchProp(el, key, prevValue, nextValue) {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  }

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  console.log(renderOptions);
})();
//# sourceMappingURL=runtime-dom.global.js.map
