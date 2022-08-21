import { NodeTypes } from "../ast";

export function transformExpression(node, context) {
  // 表达式的内容放到了node.content.content里面
  if (node.type === NodeTypes.INTERPOLATION) {
    const content = node.content.content;
    node.content.content = `_ctx.${content}`;
  }
}
