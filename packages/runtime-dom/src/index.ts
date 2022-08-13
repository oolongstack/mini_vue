import { nodeOps } from "./nodeOps";

import { patchProp } from "./patchProp";

// 渲染选项
const renderOptions = Object.assign(nodeOps, { patchProp });

console.log(renderOptions);
