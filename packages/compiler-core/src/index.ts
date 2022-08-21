import { parse } from "./parse";
import { transform } from "./transform";

export function compile(template) {
  const ast = parse(template);
  // 生成代码前的转化
  transform(ast);
  return ast;
}
