export function createRenderer(renderOptions) {
  const render = (vnode, container) => {
    console.log(renderOptions, vnode, container);
  };
  return {
    render,
  };
}
