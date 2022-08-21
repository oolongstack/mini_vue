var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/compiler-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    compile: () => compile
  });

  // packages/compiler-core/src/parse.ts
  function parse(template) {
    const context = createParserContext(template);
    const start = getCursor(context);
    return createRoot(parseChildren(context), getSelection(context, start));
  }
  function createRoot(children, loc) {
    return {
      type: 0 /* ROOT */,
      children,
      loc
    };
  }
  function parseChildren(context) {
    const nodes = [];
    while (!isEnd(context)) {
      const { source } = context;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source[0] === "<") {
        node = parseElement(context);
      }
      if (!node) {
        node = psrseText(context);
      }
      nodes.push(node);
    }
    nodes.forEach((node, i) => {
      if (node.type === 2 /* TEXT */) {
        if (!/[^\t\r\n ]/.test(node.content)) {
          nodes[i] = null;
        }
      }
    });
    return nodes.filter(Boolean);
  }
  function isEnd(context) {
    const { source } = context;
    if (source.startsWith("</")) {
      return true;
    }
    return source.length === 0;
  }
  function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
      start,
      end,
      source: context.originalSource.slice(start.offset, end.offset)
    };
  }
  function parseElement(context) {
    let ele = parseTag(context);
    let children = parseChildren(context);
    if (context.source.startsWith("</")) {
      parseTag(context);
    }
    ele.loc = getSelection(context, ele.loc.start);
    ele.children = children;
    return ele;
  }
  function parseTag(context) {
    const start = getCursor(context);
    const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBySpaces(context);
    const props = parseAttributes(context);
    const isSelfClosing = context.source.startsWith("/>");
    advanceBy(context, isSelfClosing ? 2 : 1);
    return {
      type: 1 /* ELEMENT */,
      tag,
      isSelfClosing,
      children: [],
      props,
      loc: getSelection(context, start)
    };
  }
  function parseAttributes(context) {
    const props = [];
    while (context.source.length > 0 && !context.source.startsWith(">")) {
      const prop = parseAttribute(context);
      props.push(prop);
      advanceBySpaces(context);
    }
    return props;
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    let name = match[0];
    advanceBy(context, name.length);
    advanceBySpaces(context);
    advanceBy(context, 1);
    const value = parseAttributeValue(context);
    return {
      type: 6 /* ATTRIBUTE */,
      name,
      value: {
        type: 2 /* TEXT */,
        content: value.content,
        loc: value.loc
      },
      loc: getSelection(context, start)
    };
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    const quote = context.source[0];
    let content;
    if (quote == '"' || quote == "'") {
      advanceBy(context, 1);
      const endIndex = context.source.indexOf(quote);
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start)
    };
  }
  function parseInterpolation(context) {
    const start = getCursor(context);
    const closeIndex = context.source.indexOf("}}", "{{".length);
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - 2;
    const preContent = parseTextData(context, rawContentLength);
    const content = preContent.trim();
    const startOffset = preContent.indexOf(content);
    if (startOffset > 0) {
      advancePositionWithMutation(innerStart, preContent, startOffset);
    }
    const endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preContent, endOffset);
    advanceBy(context, 2);
    return {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, start)
    };
  }
  function psrseText(context) {
    const endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      const index = context.source.indexOf(endTokens[i], 1);
      if (index !== -1) {
        endIndex = Math.min(endIndex, index);
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, endIndex);
    return {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
  }
  function advanceBy(context, endIndex) {
    const source = context.source;
    advancePositionWithMutation(context, source, endIndex);
    context.source = source.slice(endIndex);
  }
  function advanceBySpaces(context) {
    const match = /^[ \t\r\n]+/.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
  function advancePositionWithMutation(context, source, endIndex) {
    let linesCount = 0;
    let linPos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) === 10) {
        linesCount++;
        linPos = i;
      }
    }
    context.line += linesCount;
    context.offset += endIndex;
    context.column = linPos == -1 ? context.column + endIndex : endIndex - linPos;
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function getCursor(context) {
    const { line, column, offset } = context;
    return {
      line,
      column,
      offset
    };
  }
  function createParserContext(template) {
    return {
      line: 1,
      column: 1,
      offset: 0,
      source: template,
      originalSource: template
    };
  }

  // packages/compiler-core/src/runtimeHelpers.ts
  var TO_DISPLAY_STRING = Symbol("toDisplayString");
  var helperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString"
  };

  // packages/compiler-core/src/transforms/transformElement.ts
  function isText(node) {
    return node.type === 2 /* TEXT */ || node.type === 5 /* INTERPOLATION */;
  }
  function transformElement(node, context) {
    if (node.type === 1 /* ELEMENT */) {
      return () => {
        const children = node.children;
        let hasText;
        let currentContainer = null;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (isText(child)) {
            hasText = true;
            for (let j = i + 1; j < children.length; j++) {
              const next = children[j];
              if (isText(next)) {
                if (!currentContainer) {
                  currentContainer = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [child]
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

  // packages/compiler-core/src/transforms/transformExpression.ts
  function transformExpression(node, context) {
    if (node.type === 5 /* INTERPOLATION */) {
      const content = node.content.content;
      node.content.content = `_ctx.${content}`;
    }
  }

  // packages/compiler-core/src/transforms/transformText.ts
  function transformText(node, context) {
    if (node.type === 1 /* ELEMENT */ || node.type === 2 /* TEXT */) {
      return () => {
      };
    }
  }

  // packages/compiler-core/src/transform.ts
  function transform(ast) {
    const context = createTransformContext(ast);
    traverse(ast, context);
  }
  function traverse(node, context) {
    context.currentNode = node;
    const transforms = context.nodeTransforms;
    const exitFns = [];
    for (let i2 = 0; i2 < transforms.length; i2++) {
      const onExit = transforms[i2](node, context);
      onExit && exitFns.push(onExit);
      if (!context.currentNode)
        return;
    }
    switch (node.type) {
      case 5 /* INTERPOLATION */:
        context.helper(TO_DISPLAY_STRING);
        break;
      case 1 /* ELEMENT */:
      case 0 /* ROOT */:
        for (let i2 = 0; i2 < node.children.length; i2++) {
          context.parent = node;
          traverse(node.children[i2], context);
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
      currentNode: root,
      parent: null,
      helpers: /* @__PURE__ */ new Map(),
      helper(name) {
        const count = context.helpers.get(name) || 0;
        context.helpers.set(name, count + 1);
        return name;
      },
      nodeTransforms: [transformElement, transformText, transformExpression]
    };
    return context;
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const ast = parse(template);
    transform(ast);
    return ast;
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map
