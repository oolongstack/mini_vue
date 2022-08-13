import { nodeOps } from "./nodeOps";

import { patchProp } from "./patchProp";

import { createRenderer } from "@vue/runtime-core";
// 渲染选项
const renderOptions = Object.assign(nodeOps, { patchProp });

function render(vnode, aontainer) {
  return createRenderer(renderOptions).render(vnode, aontainer);
}

export { render };
