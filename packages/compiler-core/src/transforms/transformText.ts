import { NodeTypes } from "../ast";
function isText(node) {
  return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
}
export function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.TEXT) {
    return () => {};
  }
}
