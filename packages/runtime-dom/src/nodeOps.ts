// dom的增删改查
export const nodeOps = {
  insert(child, parent, anchor = null) {
    // aanchor有值时，child插入到anchor的前面，anchor为null时，child插入到parent的末尾
    parent.insertBefore(child, anchor);
  },
  remove(child) {
    const parentNode = child.parentNode;
    if (parentNode) {
      parentNode.removeChild(child);
    }
  },
  // 元素内容的修改
  setElementText(el, text) {
    el.textContent = text;
  },
  // 文本节点设置内容
  setText(node, text) {
    node.nodeValue = text;
  },
  querySelector(selector) {
    return document.querySelector(selector);
  },
  parentNode(node) {
    return node.parentNode;
  },
  //节点的下一个兄弟节点
  nextSibling(node) {
    return node.nextSibling;
  },
  // 创建元素节点
  createElement(tag) {
    return document.createElement(tag);
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text);
  },
};
