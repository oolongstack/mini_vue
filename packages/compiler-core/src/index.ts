import { NodeTypes } from "./ast";

export function compile(template) {
  const ast = parse(template);

  return ast;
}

function parse(template) {
  // 1.创建解析上下文  (解析的位置行列等信息)
  const context = createParserContext(template);
  return parseChildren(context);
}

function parseChildren(context) {
  const nodes = []; // 保存解析出来的节点
  /**
   * < 元素
   * {{}} 表达式
   */
  while (!isEnd(context)) {
    const { source } = context;
    let node;
    if (source.startsWith("{{")) {
      node = parseInterpolation(context);
    } else if (source[0] === "<") {
      node = parseElement(context);
    }
    // 文本
    if (!node) {
      node = psrseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
function isEnd(context) {
  const { source } = context;
  if (source.startsWith("</")) {
    return true;
  }
  return source.length === 0;
}

function getSelection(context, start, end?) {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}
function parseElement(context) {
  // <br />  <div name="cjl"></div>
  let ele = parseTag(context); // 得到解析的元素 例如div
  let children = parseChildren(context);

  if (context.source.startsWith("</")) {
    // 说明标签中间没有内容
    parseTag(context);
  }
  ele.loc = getSelection(context, ele.loc.start);
  ele.children = children;
  return ele;
}
function parseTag(context) {
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
  const tag = match[1]; // 拿到标签名

  advanceBy(context, match[0].length); // 删掉标签 <div
  advanceBySpaces(context); // 删除空格

  //  解析属性
  const props = parseAttributes(context);
  // <div>   <div/>
  // 判断是否为自闭和标签
  const isSelfClosing = context.source.startsWith("/>");

  advanceBy(context, isSelfClosing ? 2 : 1);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    isSelfClosing,
    children: [],
    props,
    loc: getSelection(context, start),
  };
}
function parseAttributes(context) {
  const props = [];
  while (context.source.length > 0 && !context.source.startsWith(">")) {
    const prop = parseAttribute(context);
    props.push(prop);
    advanceBySpaces(context); // 删除空格
  }
  return props;
}
function parseAttribute(context) {
  const start = getCursor(context);

  // 解析属性名字
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);

  let name = match[0];

  advanceBy(context, name.length);

  advanceBySpaces(context); // a ="1" 删掉空格

  advanceBy(context, 1); // 删掉 =

  const value = parseAttributeValue(context);

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc,
    },
    loc: getSelection(context, start),
  };
}
function parseAttributeValue(context) {
  const start = getCursor(context);
  // '' ""
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
    loc: getSelection(context, start),
  };
}
function parseInterpolation(context) {
  const start = getCursor(context);
  const closeIndex = context.source.indexOf("}}", "{{".length);
  advanceBy(context, 2);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  // 拿到双大括号里的内容
  const rawContentLength = closeIndex - 2;

  const preContent = parseTextData(context, rawContentLength);

  const content = preContent.trim();

  const startOffset = preContent.indexOf(content);

  if (startOffset > 0) {
    // 更新start
    advancePositionWithMutation(innerStart, preContent, startOffset);
  }
  // 更新结尾
  const endOffset = startOffset + content.length;

  advancePositionWithMutation(innerEnd, preContent, endOffset);
  advanceBy(context, 2);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc: getSelection(context, innerStart, innerEnd),
    },
    loc: getSelection(context, start),
  };
}
function psrseText(context) {
  const endTokens = ["<", "{{"]; // 文本结束的标识
  let endIndex = context.source.length; // 默认认为文本就是整个source
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1) {
      endIndex = Math.min(endIndex, index);
    }
  }

  // 创建行列信息 有利于后期追踪
  const start = getCursor(context);

  // 拿到内容
  const content = parseTextData(context, endIndex);
  return {
    type: NodeTypes.TEXT, // 类型
    content, // 内容
    loc: getSelection(context, start),
  };
}
function advanceBy(context, endIndex) {
  const source = context.source;
  // 更新行列信息
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
    // 换行
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
  // 删掉已经解析的内容
  advanceBy(context, endIndex);
  return rawText;
}
function getCursor(context) {
  const { line, column, offset } = context;
  return {
    line,
    column,
    offset,
  };
}
function createParserContext(template) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template, // 目前剩下的template（会不停被截取）
    originalSource: template, // 不会变
  };
}
