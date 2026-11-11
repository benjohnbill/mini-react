// M1 왕복 통합 테스트입니다. 동작의 근거는 ADR input-round-trip-is-compared-by-dot-value입니다.
// 두 함수가 같은 잘못된 규칙을 쓰면 왕복은 통과하므로, 각 규칙은 vnode.test.ts의 단위 테스트가 직접 확인합니다.
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

function getElement(node: Node): Element {
  if (!(node instanceof Element)) {
    throw new Error(`Node is not an element: ${node.nodeName}`);
  }
  return node;
}

function getInput(node: Node): HTMLInputElement {
  if (!(node instanceof HTMLInputElement)) {
    throw new Error(`Node is not an input: ${node.nodeName}`);
  }
  return node;
}

// ADR input-value-prop-is-dot-value와 comments-are-dropped-from-vnode-only의 정규형입니다: 입력칸에는 value가 있고, 글자 노드 하나는 문자열 하나이며, 주석이 없습니다.
function createSampleView(): VNode {
  return {
    type: "section",
    props: { id: "main", class: "card", "data-step": "1" },
    children: [
      { type: "h1", props: {}, children: ["제목"] },
      {
        type: "p",
        props: { class: "text" },
        children: [
          "안녕 ",
          { type: "b", props: {}, children: ["React"] },
          " ",
          { type: "i", props: {}, children: ["&amp; <b>x</b>"] },
          "a",
          "b",
          "",
        ],
      },
      {
        type: "ul",
        props: {},
        children: [
          { type: "li", props: {}, children: ["하나"] },
          { type: "li", props: { hidden: "" }, children: ["둘"] },
        ],
      },
      { type: "a", props: { href: "/x" }, children: [] },
      { type: "input", props: { type: "text", value: "hi" }, children: [] },
      { type: "input", props: { value: "" }, children: [] },
    ],
  };
}

describe("VNode에서 DOM을 거쳐 VNode로", () => {
  it("R1 태그, 속성, 섞인 자식이 있는 View가 처음과 같은 내용으로 돌아옵니다", () => {
    const element = getElement(createDomFromVNode(createSampleView()));
    expect(createVNodeFromDom(element)).toStrictEqual(createSampleView());
  });
});

describe("DOM에서 VNode를 거쳐 DOM으로", () => {
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
});

describe("입력칸 상태", () => {
  it("R2 value 속성과 친 글자가 다르면 친 글자가 .value로 돌아옵니다", () => {
    const input = createInputFromHtml('<input value="a">');
    input.value = "typed";
    expect(getInput(createRoundTripDom(input)).value).toBe("typed");
  });

  it("R3 모두 지운 입력칸은 빈 .value로 돌아옵니다", () => {
    const input = createInputFromHtml('<input value="a">');
    input.value = "";
    expect(getInput(createRoundTripDom(input)).value).toBe("");
  });

  it("R4 아무것도 치지 않은 입력칸은 두 번 왕복해도 같은 VNode로 읽힙니다", () => {
    const original = createInputFromHtml("<input>");
    const first = createVNodeFromDom(original);
    const second = createVNodeFromDom(getElement(createDomFromVNode(first)));
    const emptyInput = { type: "input", props: { value: "" }, children: [] };
    expect(first).toStrictEqual(emptyInput);
    expect(second).toStrictEqual(emptyInput);
  });
});

describe("주석", () => {
  it("R5 주석은 결과에서만 빠지고, 양옆 글자는 따로 남고, 원본 주석은 그대로입니다", () => {
    const element = createElementFromHtml("<div>a<!--x-->b</div>");
    const node = createRoundTripDom(element);

    expect(node.childNodes.length).toBe(2);
    expect(node.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(node.childNodes[0]?.textContent).toBe("a");
    expect(node.childNodes[1]?.nodeType).toBe(Node.TEXT_NODE);
    expect(node.childNodes[1]?.textContent).toBe("b");

    expect(element.childNodes.length).toBe(3);
    expect(element.childNodes[1]?.nodeType).toBe(Node.COMMENT_NODE);
  });
});
