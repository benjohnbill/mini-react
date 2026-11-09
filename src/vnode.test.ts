// M1 공통 테스트입니다. 동작의 근거는 ADR 0005입니다. 왕복 테스트는 round-trip.test.ts에 있습니다.
import { describe, expect, it } from "vitest";
import {
  createDomFromVNode,
  createVNodeFromDom,
  isTextInput,
  type VNode,
} from "./vnode";

const DEEP_NESTING_LEVEL = 500;

function createElementFromHtml(html: string): Element {
  const host = document.createElement("div");
  host.innerHTML = html;
  const element = host.firstElementChild;
  if (element === null) {
    throw new Error(`Fixture has no element: ${html}`);
  }
  return element;
}

function createInputFromHtml(html: string): HTMLInputElement {
  const element = createElementFromHtml(html);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Fixture is not an input: ${html}`);
  }
  return element;
}

function countNestingLevel(vnode: VNode): number {
  let level = 0;
  let current: VNode | undefined = vnode;
  while (current !== undefined) {
    if (typeof current === "string") {
      throw new Error(`Unexpected text at level ${level}: ${current}`);
    }
    expect(current.type).toBe("div");
    expect(current.props).toStrictEqual({});
    expect(current.children.length).toBeLessThanOrEqual(1);
    level += 1;
    current = current.children[0];
  }
  return level;
}

describe("createVNodeFromDom", () => {
  describe("노드 종류", () => {
    it("T1 요소 노드를 객체로 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<div></div>")),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: [],
      });
    });

    it("T2 글자 노드를 문자열로 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<p>hello</p>")),
      ).toStrictEqual({
        type: "p",
        props: {},
        children: ["hello"],
      });
    });

    it("T3 주석 노드를 버립니다", () => {
      const element = createElementFromHtml(
        "<div>hello<!-- 설명 --><span>world</span></div>",
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "div",
        props: {},
        children: ["hello", { type: "span", props: {}, children: ["world"] }],
      });
    });

    it("T4 여러 깊이의 주석을 모두 버립니다", () => {
      const element = createElementFromHtml(
        "<div><!--a--><p><!--b--><span>x</span><!--c--></p><!--d--></div>",
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "div",
        props: {},
        children: [
          {
            type: "p",
            props: {},
            children: [{ type: "span", props: {}, children: ["x"] }],
          },
        ],
      });
    });

    it("T5 읽은 뒤에도 입력 DOM을 바꾸지 않습니다", () => {
      const html = "<div>hello<!-- 설명 --><span>world</span></div>";
      const element = createElementFromHtml(html);
      createVNodeFromDom(element);
      expect(element.outerHTML).toBe(html);
    });

    it("T6 주석 양옆의 글자를 합치지 않습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<div>a<!--x-->b</div>")),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: ["a", "b"],
      });
    });

    it("T39 주석만 있는 요소는 빈 children으로 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<div><!-- 메모 --></div>")),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: [],
      });
    });

    it("T40 대문자로 적은 태그를 소문자 type으로 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<DIV><SPAN>x</SPAN></DIV>")),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: [{ type: "span", props: {}, children: ["x"] }],
      });
    });
  });

  describe("속성", () => {
    it("T7 속성 하나를 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml('<div id="a"></div>')),
      ).toStrictEqual({
        type: "div",
        props: { id: "a" },
        children: [],
      });
    });

    it("T8 여러 속성을 빠짐없이 읽습니다", () => {
      const element = createElementFromHtml(
        '<a id="x" class="y" href="/z" data-k="v"></a>',
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "a",
        props: { id: "x", class: "y", href: "/z", "data-k": "v" },
        children: [],
      });
    });

    it("T9 값이 빈 속성을 버리지 않습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<div hidden></div>")),
      ).toStrictEqual({
        type: "div",
        props: { hidden: "" },
        children: [],
      });
    });

    it("T41 입력칸의 값 없는 속성도 빈 값으로 읽고 value를 함께 넣습니다", () => {
      expect(
        createVNodeFromDom(createInputFromHtml("<input disabled>")),
      ).toStrictEqual({
        type: "input",
        props: { disabled: "", value: "" },
        children: [],
      });
    });
  });

  describe("자식", () => {
    it("T10 자식의 자식까지 읽습니다", () => {
      expect(
        createVNodeFromDom(
          createElementFromHtml("<div><ul><li>x</li></ul></div>"),
        ),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: [
          {
            type: "ul",
            props: {},
            children: [{ type: "li", props: {}, children: ["x"] }],
          },
        ],
      });
    });

    it("T11 글자와 요소가 섞인 자식을 DOM 순서대로 읽습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<p>one<b>two</b>three</p>")),
      ).toStrictEqual({
        type: "p",
        props: {},
        children: ["one", { type: "b", props: {}, children: ["two"] }, "three"],
      });
    });

    it("T12 내용이 없는 자식 요소를 버리지 않습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<div><span></span></div>")),
      ).toStrictEqual({
        type: "div",
        props: {},
        children: [{ type: "span", props: {}, children: [] }],
      });
    });

    it("T42 형제 요소를 DOM 순서대로 읽습니다", () => {
      expect(
        createVNodeFromDom(
          createElementFromHtml("<ul><li>a</li><li>b</li></ul>"),
        ),
      ).toStrictEqual({
        type: "ul",
        props: {},
        children: [
          { type: "li", props: {}, children: ["a"] },
          { type: "li", props: {}, children: ["b"] },
        ],
      });
    });

    it("T43 500단계로 겹친 div를 오류 없이 끝까지 읽습니다", () => {
      const root = document.createElement("div");
      let deepest = root;
      for (let level = 1; level < DEEP_NESTING_LEVEL; level += 1) {
        const child = document.createElement("div");
        deepest.append(child);
        deepest = child;
      }
      expect(countNestingLevel(createVNodeFromDom(root))).toBe(
        DEEP_NESTING_LEVEL,
      );
    });
  });

  describe("글자", () => {
    it("T13 공백만 있는 글자 노드를 버리지 않습니다", () => {
      expect(
        createVNodeFromDom(createElementFromHtml("<p><b>a</b> <i>b</i></p>")),
      ).toStrictEqual({
        type: "p",
        props: {},
        children: [
          { type: "b", props: {}, children: ["a"] },
          " ",
          { type: "i", props: {}, children: ["b"] },
        ],
      });
    });

    it("T14 엔티티를 해석된 글자로 읽고 앞뒤 공백을 다듬지 않습니다", () => {
      const element = createElementFromHtml(
        "<p>   안녕하세요 &amp; 반갑습니다! &lt;React&gt;    </p>",
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "p",
        props: {},
        children: ["   안녕하세요 & 반갑습니다! <React>    "],
      });
    });

    it("T15 빈 글자 노드를 버리지 않습니다", () => {
      const paragraph = document.createElement("p");
      paragraph.append(
        document.createTextNode(""),
        createElementFromHtml("<b>x</b>"),
      );
      expect(createVNodeFromDom(paragraph)).toStrictEqual({
        type: "p",
        props: {},
        children: ["", { type: "b", props: {}, children: ["x"] }],
      });
    });

    it("T44 줄바꿈과 들여쓰기만 있는 글자 노드도 버리지 않습니다", () => {
      const element = createElementFromHtml(
        "<ul>\n  <li>a</li>\n  <li>b</li>\n</ul>",
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "ul",
        props: {},
        children: [
          "\n  ",
          { type: "li", props: {}, children: ["a"] },
          "\n  ",
          { type: "li", props: {}, children: ["b"] },
          "\n",
        ],
      });
    });

    it("T45 pre 안의 들여쓰기와 줄바꿈을 그대로 읽습니다", () => {
      expect(
        createVNodeFromDom(
          createElementFromHtml("<pre>  if (a) {\n    b();\n  }\n</pre>"),
        ),
      ).toStrictEqual({
        type: "pre",
        props: {},
        children: ["  if (a) {\n    b();\n  }\n"],
      });
    });
  });

  describe("입력칸 상태", () => {
    it("T16 입력칸이 아닌 요소의 .value를 읽지 않습니다", () => {
      const element = createElementFromHtml(
        "<ol><li>x</li><li><button>y</button></li></ol>",
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "ol",
        props: {},
        children: [
          { type: "li", props: {}, children: ["x"] },
          {
            type: "li",
            props: {},
            children: [{ type: "button", props: {}, children: ["y"] }],
          },
        ],
      });
    });

    it("T17 아무것도 치지 않은 입력칸의 처음 값을 읽습니다", () => {
      expect(
        createVNodeFromDom(createInputFromHtml('<input value="a">')),
      ).toStrictEqual({
        type: "input",
        props: { value: "a" },
        children: [],
      });
    });

    it("T18 value 속성이 없어도 친 글자를 읽습니다", () => {
      const input = createInputFromHtml("<input>");
      input.value = "typed";
      expect(createVNodeFromDom(input)).toStrictEqual({
        type: "input",
        props: { value: "typed" },
        children: [],
      });
    });

    it("T19 value 속성보다 친 글자를 우선합니다", () => {
      const input = createInputFromHtml('<input value="a">');
      input.value = "typed";
      expect(createVNodeFromDom(input)).toStrictEqual({
        type: "input",
        props: { value: "typed" },
        children: [],
      });
    });

    it("T20 모두 지운 입력칸을 빈 값으로 읽습니다", () => {
      const input = createInputFromHtml('<input value="a">');
      input.value = "";
      expect(createVNodeFromDom(input)).toStrictEqual({
        type: "input",
        props: { value: "" },
        children: [],
      });
    });

    it("T21 아무것도 치지 않은 빈 입력칸에도 value를 넣습니다", () => {
      expect(createVNodeFromDom(createInputFromHtml("<input>"))).toStrictEqual({
        type: "input",
        props: { value: "" },
        children: [],
      });
    });

    it("T46 입력칸이 아닌 요소에 적힌 value 속성은 속성 그대로 읽습니다", () => {
      const element = createElementFromHtml(
        '<ol><li value="3">x</li><li><button value="go">y</button></li></ol>',
      );
      expect(createVNodeFromDom(element)).toStrictEqual({
        type: "ol",
        props: {},
        children: [
          { type: "li", props: { value: "3" }, children: ["x"] },
          {
            type: "li",
            props: {},
            children: [
              { type: "button", props: { value: "go" }, children: ["y"] },
            ],
          },
        ],
      });
    });
  });

  describe("입력 보존", () => {
    it("T47 읽은 뒤에도 자식 노드, 글자, 주석, 속성, 친 글자를 바꾸지 않습니다", () => {
      const element = createElementFromHtml(
        '<div id="a">hello<!-- 설명 --><input value="a"></div>',
      );
      const [text, comment, input] = element.childNodes;
      if (!(input instanceof HTMLInputElement)) {
        throw new Error("Fixture has no input");
      }
      input.value = "typed";

      createVNodeFromDom(element);

      expect(element.childNodes.length).toBe(3);
      expect(element.childNodes[0]).toBe(text);
      expect(element.childNodes[1]).toBe(comment);
      expect(element.childNodes[2]).toBe(input);
      expect(text?.textContent).toBe("hello");
      expect(comment?.nodeType).toBe(Node.COMMENT_NODE);
      expect(comment?.textContent).toBe(" 설명 ");
      expect(element.getAttribute("id")).toBe("a");
      expect(input.getAttribute("value")).toBe("a");
      expect(input.value).toBe("typed");
    });
  });
});

describe("createDomFromVNode", () => {
  it("T22 요소를 만듭니다", () => {
    const node = createDomFromVNode({ type: "div", props: {}, children: [] });
    expect(node.isEqualNode(createElementFromHtml("<div></div>"))).toBe(true);
  });

  it("T23 문자열로 글자 노드를 만듭니다", () => {
    const node = createDomFromVNode("hello");
    expect(node.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe("hello");
  });

  it("T24 속성 하나를 만듭니다", () => {
    const node = createDomFromVNode({
      type: "div",
      props: { id: "a" },
      children: [],
    });
    expect(node.isEqualNode(createElementFromHtml('<div id="a"></div>'))).toBe(
      true,
    );
  });

  it("T25 여러 속성을 빠짐없이 만듭니다", () => {
    const node = createDomFromVNode({
      type: "a",
      props: { id: "x", class: "y", href: "/z", "data-k": "v" },
      children: [],
    });
    expect(
      node.isEqualNode(
        createElementFromHtml('<a id="x" class="y" href="/z" data-k="v"></a>'),
      ),
    ).toBe(true);
  });

  it("T26 값이 빈 속성을 만듭니다", () => {
    const node = createDomFromVNode({
      type: "div",
      props: { hidden: "" },
      children: [],
    });
    expect(node.isEqualNode(createElementFromHtml("<div hidden></div>"))).toBe(
      true,
    );
  });

  it("T27 자식의 자식까지 만듭니다", () => {
    const vnode: VNode = {
      type: "div",
      props: {},
      children: [
        {
          type: "ul",
          props: {},
          children: [{ type: "li", props: {}, children: ["x"] }],
        },
      ],
    };
    expect(
      createDomFromVNode(vnode).isEqualNode(
        createElementFromHtml("<div><ul><li>x</li></ul></div>"),
      ),
    ).toBe(true);
  });

  it("T28 자식을 순서대로 모두 만듭니다", () => {
    const node = createDomFromVNode({
      type: "p",
      props: {},
      children: ["one", { type: "b", props: {}, children: ["two"] }, "three"],
    });
    expect(
      node.isEqualNode(createElementFromHtml("<p>one<b>two</b>three</p>")),
    ).toBe(true);
  });

  it("T29 내용이 없는 자식 요소를 만듭니다", () => {
    const node = createDomFromVNode({
      type: "div",
      props: {},
      children: [{ type: "span", props: {}, children: [] }],
    });
    expect(
      node.isEqualNode(createElementFromHtml("<div><span></span></div>")),
    ).toBe(true);
  });

  it("T30 공백만 있는 문자열도 글자 노드로 만듭니다", () => {
    const node = createDomFromVNode({
      type: "p",
      props: {},
      children: [
        { type: "b", props: {}, children: ["a"] },
        " ",
        { type: "i", props: {}, children: ["b"] },
      ],
    });
    expect(node.childNodes.length).toBe(3);
    expect(
      node.isEqualNode(createElementFromHtml("<p><b>a</b> <i>b</i></p>")),
    ).toBe(true);
  });

  it("T31 문자열을 HTML로 해석하지 않고 글자로만 만듭니다", () => {
    const text = "  a &amp; <img src=x onerror=alert(1)>  ";
    const node = createDomFromVNode({ type: "p", props: {}, children: [text] });
    expect(node.childNodes.length).toBe(1);
    expect(node.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(node.textContent).toBe(text);
  });

  it("T32 빈 문자열도 글자 노드로 만듭니다", () => {
    const node = createDomFromVNode({ type: "p", props: {}, children: [""] });
    expect(node.childNodes.length).toBe(1);
    expect(node.firstChild?.nodeType).toBe(Node.TEXT_NODE);
  });

  it("T33 props.value를 입력칸의 .value로 보이게 합니다", () => {
    const node = createDomFromVNode({
      type: "input",
      props: { value: "x" },
      children: [],
    });
    expect(node).toBeInstanceOf(HTMLInputElement);
    expect((node as HTMLInputElement).value).toBe("x");
  });

  it("T48 형제 요소를 적힌 순서대로 만듭니다", () => {
    const node = createDomFromVNode({
      type: "ul",
      props: {},
      children: [
        { type: "li", props: {}, children: ["a"] },
        { type: "li", props: {}, children: ["b"] },
        { type: "li", props: {}, children: ["c"] },
      ],
    });
    expect(
      node.isEqualNode(
        createElementFromHtml("<ul><li>a</li><li>b</li><li>c</li></ul>"),
      ),
    ).toBe(true);
  });

  it("T49 만든 뒤에도 입력 VNode를 바꾸지 않습니다", () => {
    const vnode: VNode = {
      type: "div",
      props: { id: "a" },
      children: [
        "hello",
        { type: "input", props: { value: "x" }, children: [] },
        {
          type: "ul",
          props: {},
          children: [{ type: "li", props: {}, children: ["b"] }],
        },
      ],
    };
    createDomFromVNode(vnode);
    expect(vnode).toStrictEqual({
      type: "div",
      props: { id: "a" },
      children: [
        "hello",
        { type: "input", props: { value: "x" }, children: [] },
        {
          type: "ul",
          props: {},
          children: [{ type: "li", props: {}, children: ["b"] }],
        },
      ],
    });
  });

  it("T50 같은 VNode로 두 번 만들면 서로 다른 노드를 돌려줍니다", () => {
    const vnode: VNode = {
      type: "p",
      props: {},
      children: ["one", { type: "b", props: {}, children: ["two"] }],
    };
    const first = createDomFromVNode(vnode);
    const second = createDomFromVNode(vnode);
    expect(second).not.toBe(first);
    expect(second.childNodes[0]).not.toBe(first.childNodes[0]);
    expect(second.childNodes[1]).not.toBe(first.childNodes[1]);

    first.childNodes[0]?.remove();
    expect(
      second.isEqualNode(createElementFromHtml("<p>one<b>two</b></p>")),
    ).toBe(true);
  });
});

describe("isTextInput", () => {
  it("T51 type이 없거나 text인 input은 입력칸입니다", () => {
    expect(isTextInput(createElementFromHtml("<input>"))).toBe(true);
    expect(isTextInput(createElementFromHtml('<input type="text">'))).toBe(
      true,
    );
  });

  it("T52 checkbox와 radio는 입력칸이 아닙니다", () => {
    expect(isTextInput(createElementFromHtml('<input type="checkbox">'))).toBe(
      false,
    );
    expect(isTextInput(createElementFromHtml('<input type="radio">'))).toBe(
      false,
    );
  });

  it("T53 .value가 있어도 input이 아닌 li와 button은 입력칸이 아닙니다", () => {
    expect(isTextInput(createElementFromHtml("<li>x</li>"))).toBe(false);
    expect(isTextInput(createElementFromHtml("<button>y</button>"))).toBe(
      false,
    );
  });
});
