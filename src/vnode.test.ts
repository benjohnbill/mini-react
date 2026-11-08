// M1 공통 테스트입니다. 동작의 근거는 ADR 0005입니다.
import { describe, expect, it } from "vitest";
import { createDomFromVNode, createVNodeFromDom, type VNode } from "./vnode";

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

function createRoundTripDom(element: Element): Node {
  return createDomFromVNode(createVNodeFromDom(element));
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
});

describe("왕복", () => {
  it("T34 내용이 없는 자식 요소가 그대로 돌아옵니다", () => {
    const element = createElementFromHtml("<div><span></span></div>");
    expect(createRoundTripDom(element).isEqualNode(element)).toBe(true);
  });

  it("T35 글자와 요소가 섞인 한글 문장이 그대로 돌아옵니다", () => {
    const element = createElementFromHtml(
      "<p>안녕 <strong>React</strong> 반가워!</p>",
    );
    expect(createRoundTripDom(element).isEqualNode(element)).toBe(true);
  });

  it("T36 공백, 한글, 특수문자가 그대로 돌아옵니다", () => {
    const element = createElementFromHtml(
      "<p>   안녕하세요 &amp; 반갑습니다! &lt;React&gt;    </p>",
    );
    expect(createRoundTripDom(element).isEqualNode(element)).toBe(true);
  });

  it("T37 친 글자가 .value로 돌아옵니다", () => {
    const input = createInputFromHtml("<input>");
    input.value = "typed";
    const node = createRoundTripDom(input);
    expect(node).toBeInstanceOf(HTMLInputElement);
    expect((node as HTMLInputElement).value).toBe("typed");
  });

  it.todo("T38 M2-M3: 주석이 섞여 있어도 올바른 노드를 고칩니다");
});
