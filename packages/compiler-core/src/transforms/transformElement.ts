import { NodeTypes } from "../ast";
function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}
export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const children = node.children;
      let hasText;
      // 合并连续的表达式和文本  例如 {{aaa}}  哈哈哈
      let currentContainer = null;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isText(child)) {
          hasText = true;
          // 下一节点是否为文本节点
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              j--;
            } else {
              currentContainer = null;
              break;
            }
          }
        }
      }
      if (!hasText || children.length === 1) {
        return;
      }

      console.log(node);
    };
  }
}
