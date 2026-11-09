// M3 공통 테스트입니다. 동작의 근거는 ADR 0005와 ADR 0006입니다.
import { describe, expect, it } from "vitest";
import { applyPatchesToDom, type Patch } from "./patch";

function createContainerFromHtml(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

function getViewElement(container: Element): Element {
  const view = container.firstElementChild;
  if (view === null) {
    throw new Error(`Container has no element: ${container.innerHTML}`);
  }
  return view;
}

function applyPatchesWhileObserving(
  container: Element,
  patches: Patch[],
): MutationRecord[] {
  const observer = new MutationObserver(() => {});
  observer.observe(container, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  applyPatchesToDom(container, patches);
  const records = observer.takeRecords();
  observer.disconnect();
  return records;
}

describe("applyPatchesToDom", () => {
  describe("종류별 변경", () => {
    it("P1 TEXT는 글자 노드의 글자를 바꿉니다", () => {
      const container = createContainerFromHtml("<div><p>a</p><p>x</p></div>");
      applyPatchesToDom(container, [{ type: "TEXT", path: [0, 0], text: "b" }]);
      expect(container.innerHTML).toBe("<div><p>b</p><p>x</p></div>");
    });

    it("P2 TEXT는 글자를 HTML로 해석하지 않고 같은 글자 노드에 씁니다", () => {
      const container = createContainerFromHtml("<p>a</p>");
      const view = getViewElement(container);
      const text = view.firstChild;
      expect(text).toBeInstanceOf(Text);
      applyPatchesToDom(container, [
        { type: "TEXT", path: [0], text: "<b>x</b>" },
      ]);
      expect(getViewElement(container)).toBe(view);
      expect(view.textContent).toBe("<b>x</b>");
      expect(view.children).toHaveLength(0);
      expect(view.childNodes).toHaveLength(1);
      expect(view.firstChild).toBe(text);
    });

    it("P3 REPLACE는 그 위치의 노드를 Patch의 node로 바꿉니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      applyPatchesToDom(container, [
        {
          type: "REPLACE",
          path: [0],
          node: { type: "span", props: { class: "c" }, children: ["b"] },
        },
      ]);
      expect(container.innerHTML).toBe('<div><span class="c">b</span></div>');
    });

    it("P4 REPLACE는 글자 노드를 요소로 바꿉니다", () => {
      const container = createContainerFromHtml("<div>a</div>");
      applyPatchesToDom(container, [
        {
          type: "REPLACE",
          path: [0],
          node: { type: "b", props: {}, children: ["a"] },
        },
      ]);
      expect(container.innerHTML).toBe("<div><b>a</b></div>");
    });

    it("P5 PROPS의 set은 속성을 새 값으로 씁니다", () => {
      const container = createContainerFromHtml('<p class="x">a</p>');
      applyPatchesToDom(container, [
        {
          type: "PROPS",
          path: [],
          set: { class: "y", title: "t" },
          remove: [],
        },
      ]);
      const view = getViewElement(container);
      expect(view.getAttribute("class")).toBe("y");
      expect(view.getAttribute("title")).toBe("t");
    });

    it("P6 PROPS의 remove는 속성을 지웁니다", () => {
      const container = createContainerFromHtml('<p id="a">a</p>');
      applyPatchesToDom(container, [
        { type: "PROPS", path: [], set: {}, remove: ["id"] },
      ]);
      expect(getViewElement(container).hasAttribute("id")).toBe(false);
    });

    it("P7 INSERT는 path의 번호에 새 노드를 끼워 넣습니다", () => {
      const container = createContainerFromHtml("<ul><li>a</li></ul>");
      applyPatchesToDom(container, [
        {
          type: "INSERT",
          path: [1],
          node: { type: "li", props: {}, children: ["b"] },
        },
      ]);
      expect(container.innerHTML).toBe("<ul><li>a</li><li>b</li></ul>");
    });

    it("P8 INSERT는 속성과 자식을 가진 요소를 만듭니다", () => {
      const container = createContainerFromHtml("<div></div>");
      applyPatchesToDom(container, [
        {
          type: "INSERT",
          path: [0],
          node: {
            type: "p",
            props: { class: "c" },
            children: ["a", { type: "b", props: {}, children: ["b"] }],
          },
        },
      ]);
      expect(container.innerHTML).toBe('<div><p class="c">a<b>b</b></p></div>');
    });

    it("P9 REMOVE는 그 위치의 노드를 지웁니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><li>b</li><li>c</li></ul>",
      );
      applyPatchesToDom(container, [
        { type: "REMOVE", path: [2] },
        { type: "REMOVE", path: [1] },
      ]);
      expect(container.innerHTML).toBe("<ul><li>a</li></ul>");
    });

    it("P29 INSERT [0]은 첫 자식 앞에 끼워 넣고 원래 자식을 남깁니다", () => {
      const container = createContainerFromHtml("<ul><li>b</li></ul>");
      const list = getViewElement(container);
      const oldItem = list.firstChild;
      applyPatchesToDom(container, [
        {
          type: "INSERT",
          path: [0],
          node: { type: "li", props: {}, children: ["a"] },
        },
      ]);
      expect(container.innerHTML).toBe("<ul><li>a</li><li>b</li></ul>");
      expect(list.childNodes).toHaveLength(2);
      expect(list.childNodes[1]).toBe(oldItem);
    });

    it("P30 PROPS의 빈 값은 속성을 남기고, remove만 속성을 지웁니다", () => {
      const container = createContainerFromHtml(
        '<div><p>a</p><p title="x">b</p></div>',
      );
      const [first, second] = getViewElement(container).children;
      if (first === undefined || second === undefined) {
        throw new Error("Fixture has no two paragraphs");
      }
      applyPatchesToDom(container, [
        { type: "PROPS", path: [0], set: { title: "" }, remove: [] },
        { type: "PROPS", path: [1], set: { title: "" }, remove: [] },
      ]);
      expect(first.hasAttribute("title")).toBe(true);
      expect(first.getAttribute("title")).toBe("");
      expect(second.hasAttribute("title")).toBe(true);
      expect(second.getAttribute("title")).toBe("");

      applyPatchesToDom(container, [
        { type: "PROPS", path: [1], set: {}, remove: ["title"] },
      ]);
      expect(second.hasAttribute("title")).toBe(false);
      expect(getViewElement(container).children[0]).toBe(first);
      expect(getViewElement(container).children[1]).toBe(second);
    });
  });

  describe("바꾸지 않을 노드", () => {
    it("P10 TEXT 옆의 형제 요소는 같은 객체로 남습니다", () => {
      const container = createContainerFromHtml("<div><p>a</p><p>x</p></div>");
      const secondParagraph = getViewElement(container).children[1];
      applyPatchesToDom(container, [{ type: "TEXT", path: [0, 0], text: "b" }]);
      expect(getViewElement(container).children[1]).toBe(secondParagraph);
    });

    it("P11 PROPS는 요소를 바꾸지 않고 적지 않은 속성을 남깁니다", () => {
      const container = createContainerFromHtml('<p id="a" class="x">a</p>');
      const view = getViewElement(container);
      applyPatchesToDom(container, [
        { type: "PROPS", path: [], set: { class: "y" }, remove: [] },
      ]);
      expect(getViewElement(container)).toBe(view);
      expect(view.getAttribute("id")).toBe("a");
    });

    it("P12 REPLACE, INSERT, REMOVE 뒤에도 형제 요소는 같은 객체로 남습니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><li>b</li><li>c</li></ul>",
      );
      const [first, second] = getViewElement(container).children;
      applyPatchesToDom(container, [
        {
          type: "REPLACE",
          path: [2],
          node: { type: "li", props: {}, children: ["z"] },
        },
        {
          type: "INSERT",
          path: [3],
          node: { type: "li", props: {}, children: ["d"] },
        },
        { type: "REMOVE", path: [3] },
      ]);
      const items = getViewElement(container).children;
      expect(items[0]).toBe(first);
      expect(items[1]).toBe(second);
      expect(container.innerHTML).toBe(
        "<ul><li>a</li><li>b</li><li>z</li></ul>",
      );
    });

    it("P13 빈 목록은 DOM을 바꾸지 않습니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      expect(applyPatchesWhileObserving(container, [])).toHaveLength(0);
    });

    it("P14 글자 하나를 바꾸면 그 글자 노드의 변경 1건만 일어납니다", () => {
      const container = createContainerFromHtml("<div><p>a</p><p>x</p></div>");
      const text = getViewElement(container).firstElementChild?.firstChild;
      expect(text).toBeInstanceOf(Text);
      const records = applyPatchesWhileObserving(container, [
        { type: "TEXT", path: [0, 0], text: "b" },
      ]);
      expect(records).toHaveLength(1);
      expect(records[0]?.type).toBe("characterData");
      expect(records[0]?.target).toBe(text);
      expect(getViewElement(container).firstElementChild?.firstChild).toBe(
        text,
      );
    });

    it("P31 set과 remove가 모두 빈 PROPS는 DOM을 바꾸지 않습니다", () => {
      const container = createContainerFromHtml('<p id="a">a</p>');
      expect(
        applyPatchesWhileObserving(container, [
          { type: "PROPS", path: [], set: {}, remove: [] },
        ]),
      ).toHaveLength(0);
      expect(container.innerHTML).toBe('<p id="a">a</p>');
    });
  });

  describe("path", () => {
    it("P15 path []는 View 자신을 가리키고, container는 그대로 둡니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      const parent = document.createElement("main");
      parent.append(container);
      const oldView = getViewElement(container);
      applyPatchesToDom(container, [
        {
          type: "REPLACE",
          path: [],
          node: { type: "section", props: {}, children: ["b"] },
        },
      ]);
      expect(container.innerHTML).toBe("<section>b</section>");
      expect(container.childNodes).toHaveLength(1);
      expect(parent.firstChild).toBe(container);
      expect(container.firstChild).not.toBe(oldView);
      expect(oldView.parentNode).toBeNull();
    });

    it("P16 깊은 path의 글자 노드를 찾습니다", () => {
      const container = createContainerFromHtml(
        "<div><section><p>a</p><p>b</p></section></div>",
      );
      applyPatchesToDom(container, [
        { type: "TEXT", path: [0, 1, 0], text: "c" },
      ]);
      expect(container.innerHTML).toBe(
        "<div><section><p>a</p><p>c</p></section></div>",
      );
    });

    it("P17 노드를 찾을 때 주석을 세지 않습니다", () => {
      const container = createContainerFromHtml(
        "<div>hello<!-- 설명 --><span>world</span></div>",
      );
      const [hello, comment, span] = getViewElement(container).childNodes;
      const world = span?.firstChild;
      expect(world).toBeInstanceOf(Text);
      applyPatchesToDom(container, [
        { type: "TEXT", path: [1, 0], text: "earth" },
      ]);
      expect(container.innerHTML).toBe(
        "<div>hello<!-- 설명 --><span>earth</span></div>",
      );
      // toStrictEqual은 DOM 노드를 isEqualNode로 비교하므로, 참조는 toBe로 봅니다.
      const childNodes = getViewElement(container).childNodes;
      expect(childNodes).toHaveLength(3);
      expect(childNodes[0]).toBe(hello);
      expect(childNodes[1]).toBe(comment);
      expect(childNodes[2]).toBe(span);
      expect(span?.firstChild).toBe(world);
    });

    it("P18 INSERT의 번호에도 주석을 세지 않습니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><!-- 설명 --><li>c</li></ul>",
      );
      const [first, comment, last] = getViewElement(container).childNodes;
      applyPatchesToDom(container, [
        {
          type: "INSERT",
          path: [1],
          node: { type: "li", props: {}, children: ["b"] },
        },
      ]);
      expect(container.innerHTML).toBe(
        "<ul><li>a</li><!-- 설명 --><li>b</li><li>c</li></ul>",
      );
      const childNodes = getViewElement(container).childNodes;
      expect(childNodes[0]).toBe(first);
      expect(childNodes[1]).toBe(comment);
      expect(childNodes[3]).toBe(last);
    });

    it("P19 공백만 있는 글자 노드도 번호에 셉니다", () => {
      const container = createContainerFromHtml("<ul>\n  <li>a</li></ul>");
      applyPatchesToDom(container, [{ type: "TEXT", path: [1, 0], text: "b" }]);
      expect(container.innerHTML).toBe("<ul>\n  <li>b</li></ul>");
    });

    it("P32 빈 글자 노드와 공백은 세고 주석은 세지 않으며, 대상 밖 노드는 같은 객체로 남습니다", () => {
      // innerHTML로 만들면 파서가 이웃 글자를 합치므로 DOM API로 만듭니다.
      const container = document.createElement("div");
      const view = document.createElement("div");
      const emptyText = document.createTextNode("");
      const spaceText = document.createTextNode(" ");
      const comment = document.createComment("x");
      const letterText = document.createTextNode("a");
      const span = document.createElement("span");
      const spanText = document.createTextNode("world");
      span.append(spanText);
      view.append(emptyText, spaceText, comment, letterText, span);
      container.append(view);

      applyPatchesToDom(container, [
        { type: "TEXT", path: [3, 0], text: "earth" },
      ]);

      expect(span.textContent).toBe("earth");
      expect(span.firstChild).toBe(spanText);
      expect(emptyText.data).toBe("");
      expect(spaceText.data).toBe(" ");
      expect(letterText.data).toBe("a");
      expect(container.firstChild).toBe(view);
      expect(view.childNodes).toHaveLength(5);
      expect(view.childNodes[0]).toBe(emptyText);
      expect(view.childNodes[1]).toBe(spaceText);
      expect(view.childNodes[2]).toBe(comment);
      expect(view.childNodes[3]).toBe(letterText);
      expect(view.childNodes[4]).toBe(span);
    });

    it("P33 주석 양옆의 글자 노드는 따로 세므로, [1]은 주석 뒤의 글자 노드입니다", () => {
      const container = document.createElement("div");
      const view = document.createElement("p");
      const firstText = document.createTextNode("a");
      const comment = document.createComment("x");
      const secondText = document.createTextNode("b");
      view.append(firstText, comment, secondText);
      container.append(view);

      applyPatchesToDom(container, [{ type: "TEXT", path: [1], text: "c" }]);

      expect(firstText.data).toBe("a");
      expect(secondText.data).toBe("c");
      expect(view.childNodes).toHaveLength(3);
      expect(view.childNodes[0]).toBe(firstText);
      expect(view.childNodes[1]).toBe(comment);
      expect(view.childNodes[2]).toBe(secondText);
    });
  });

  describe("여러 Patch의 순서", () => {
    it("P20 받은 순서대로 적용하므로 앞에서부터 INSERT하면 차례로 쌓입니다", () => {
      const container = createContainerFromHtml("<ul></ul>");
      applyPatchesToDom(container, [
        {
          type: "INSERT",
          path: [0],
          node: { type: "li", props: {}, children: ["a"] },
        },
        {
          type: "INSERT",
          path: [1],
          node: { type: "li", props: {}, children: ["b"] },
        },
        {
          type: "INSERT",
          path: [2],
          node: { type: "li", props: {}, children: ["c"] },
        },
      ]);
      expect(container.innerHTML).toBe(
        "<ul><li>a</li><li>b</li><li>c</li></ul>",
      );
    });

    it("P21 path는 앞의 Patch를 적용한 뒤의 트리를 기준으로 합니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><li>b</li><li>c</li></ul>",
      );
      const list = getViewElement(container);
      const [first, second, third] = list.children;
      const secondText = second?.firstChild;
      expect(secondText).toBeInstanceOf(Text);
      applyPatchesToDom(container, [
        { type: "REMOVE", path: [0] },
        { type: "TEXT", path: [0, 0], text: "x" },
      ]);
      expect(container.innerHTML).toBe("<ul><li>x</li><li>c</li></ul>");
      expect(getViewElement(container)).toBe(list);
      expect(first?.parentNode).toBeNull();
      expect(list.children).toHaveLength(2);
      expect(list.children[0]).toBe(second);
      expect(list.children[1]).toBe(third);
      expect(second?.firstChild).toBe(secondText);
    });

    it("P22 번호가 같은 자식끼리 바꾼 뒤 끝의 자식을 지웁니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><li>b</li><li>c</li></ul>",
      );
      applyPatchesToDom(container, [
        { type: "TEXT", path: [1, 0], text: "c" },
        { type: "REMOVE", path: [2] },
      ]);
      expect(container.innerHTML).toBe("<ul><li>a</li><li>c</li></ul>");
    });
  });

  describe("입력칸 상태", () => {
    it("P23 PROPS의 value는 입력칸의 .value에 씁니다", () => {
      const container = createContainerFromHtml('<input value="old">');
      applyPatchesToDom(container, [
        { type: "PROPS", path: [], set: { value: "new" }, remove: [] },
      ]);
      const input = getViewElement(container);
      if (!(input instanceof HTMLInputElement)) {
        throw new Error("Fixture is not an input");
      }
      expect(input.value).toBe("new");
    });

    it("P24 사용자가 친 글자가 있어도 PROPS의 value가 .value를 바꿉니다", () => {
      const container = createContainerFromHtml('<input value="old">');
      const input = getViewElement(container);
      if (!(input instanceof HTMLInputElement)) {
        throw new Error("Fixture is not an input");
      }
      input.value = "typed";
      applyPatchesToDom(container, [
        { type: "PROPS", path: [], set: { value: "new" }, remove: [] },
      ]);
      expect(input.value).toBe("new");
    });

    it("P34 사용자가 친 글자가 있어도 PROPS의 빈 value가 같은 입력칸의 .value를 비웁니다", () => {
      const container = createContainerFromHtml('<input value="initial">');
      const input = getViewElement(container);
      if (!(input instanceof HTMLInputElement)) {
        throw new Error("Fixture is not an input");
      }
      input.value = "typed";
      applyPatchesToDom(container, [
        { type: "PROPS", path: [], set: { value: "" }, remove: [] },
      ]);
      expect(getViewElement(container)).toBe(input);
      expect(input.value).toBe("");
    });
  });

  describe("입력", () => {
    it("P25 patches를 바꾸지 않습니다", () => {
      const container = createContainerFromHtml("<ul><li>a</li></ul>");
      const patches: Patch[] = [
        {
          type: "INSERT",
          path: [1],
          node: { type: "li", props: { class: "c" }, children: ["b"] },
        },
        { type: "PROPS", path: [0], set: { id: "x" }, remove: ["class"] },
        { type: "TEXT", path: [0, 0], text: "z" },
      ];
      const copy = structuredClone(patches);
      applyPatchesToDom(container, patches);
      expect(patches).toStrictEqual(copy);
    });
  });

  describe("실패", () => {
    it("P26 없는 path는 그 path를 적은 Error를 던집니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      expect(() =>
        applyPatchesToDom(container, [
          { type: "TEXT", path: [9, 9], text: "b" },
        ]),
      ).toThrow("[9, 9]");
    });

    it("P27 TEXT의 path가 요소를 가리키면 Error를 던집니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      expect(() =>
        applyPatchesToDom(container, [{ type: "TEXT", path: [0], text: "b" }]),
      ).toThrow("[0]");
    });

    it("P28 Error 앞에 적용한 Patch는 되돌리지 않습니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      expect(() =>
        applyPatchesToDom(container, [
          { type: "TEXT", path: [0, 0], text: "b" },
          { type: "TEXT", path: [9], text: "c" },
        ]),
      ).toThrow();
      expect(container.innerHTML).toBe("<div><p>b</p></div>");
    });

    it("P35 PROPS의 path가 글자 노드를 가리키면 path를 적은 Error를 던지고 DOM을 바꾸지 않습니다", () => {
      const container = createContainerFromHtml("<p>a</p>");
      const view = getViewElement(container);
      const text = view.firstChild;
      expect(() =>
        applyPatchesToDom(container, [
          { type: "PROPS", path: [0], set: { title: "t" }, remove: [] },
        ]),
      ).toThrow("[0]");
      expect(container.innerHTML).toBe("<p>a</p>");
      expect(getViewElement(container)).toBe(view);
      expect(view.firstChild).toBe(text);
    });

    it("P36 INSERT의 번호가 자식 수보다 크면 path를 적은 Error를 던지고 끼워 넣지 않습니다", () => {
      const container = createContainerFromHtml("<ul><li>a</li></ul>");
      const list = getViewElement(container);
      const item = list.firstChild;
      expect(() =>
        applyPatchesToDom(container, [
          {
            type: "INSERT",
            path: [2],
            node: { type: "li", props: {}, children: ["c"] },
          },
        ]),
      ).toThrow("[2]");
      expect(container.innerHTML).toBe("<ul><li>a</li></ul>");
      expect(list.childNodes).toHaveLength(1);
      expect(list.firstChild).toBe(item);
    });

    it("P37 INSERT path []는 끼워 넣을 자리가 없으므로 Error를 던지고 DOM을 바꾸지 않습니다", () => {
      const container = createContainerFromHtml("<p>a</p>");
      const view = getViewElement(container);
      expect(() =>
        applyPatchesToDom(container, [
          {
            type: "INSERT",
            path: [],
            node: { type: "p", props: {}, children: ["b"] },
          },
        ]),
      ).toThrow("[]");
      expect(container.childNodes).toHaveLength(1);
      expect(container.firstChild).toBe(view);
      expect(container.innerHTML).toBe("<p>a</p>");
    });
  });
  describe("리뷰에서 찾은 사례", () => {
    it("P38 file 입력칸을 글자 입력칸으로 바꾸는 PROPS도 오류 없이 적용합니다", () => {
      const container = createContainerFromHtml(
        '<div><input type="file"><p>a</p></div>',
      );
      applyPatchesToDom(container, [
        {
          type: "PROPS",
          path: [0],
          set: { value: "abc", type: "text" },
          remove: [],
        },
      ]);
      const input = getViewElement(container).firstElementChild;
      if (!(input instanceof HTMLInputElement)) {
        throw new Error("Fixture is not an input");
      }
      expect(input.type).toBe("text");
      expect(input.value).toBe("abc");
    });
  });
});
