import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transformText";

export function transform(ast) {
  const context = createTransformContext(ast);
  traverse(ast, context);
}

function traverse(node, context) {
  context.currentNode = node;
  const transforms = context.nodeTransforms;
  const exitFns = [];
  for (let i = 0; i < transforms.length; i++) {
    const onExit = transforms[i](node, context);
    onExit && exitFns.push(onExit);
    if (!context.currentNode) return; // 如果当前节点被删掉了，就不需要遍历儿子了
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      for (let i = 0; i < node.children.length; i++) {
        context.parent = node;
        traverse(node.children[i], context);
      }
      break;
    default:
      break;
  }
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function createTransformContext(root) {
  const context = {
    currentNode: root, // 当前节点
    parent: null, // 父节点
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    nodeTransforms: [transformElement, transformText, transformExpression],
  };
  return context;
}
