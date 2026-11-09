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

    it("P2 TEXT는 글자를 HTML로 해석하지 않습니다", () => {
      const container = createContainerFromHtml("<p>a</p>");
      applyPatchesToDom(container, [
        { type: "TEXT", path: [0], text: "<b>x</b>" },
      ]);
      const view = getViewElement(container);
      expect(view.textContent).toBe("<b>x</b>");
      expect(view.children).toHaveLength(0);
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
      const records = applyPatchesWhileObserving(container, [
        { type: "TEXT", path: [0, 0], text: "b" },
      ]);
      expect(records).toHaveLength(1);
      expect(records[0]?.type).toBe("characterData");
    });
  });

  describe("path", () => {
    it("P15 path []는 View 자신을 가리키고, container는 그대로 둡니다", () => {
      const container = createContainerFromHtml("<div><p>a</p></div>");
      applyPatchesToDom(container, [
        {
          type: "REPLACE",
          path: [],
          node: { type: "section", props: {}, children: ["b"] },
        },
      ]);
      expect(container.innerHTML).toBe("<section>b</section>");
      expect(container.childNodes).toHaveLength(1);
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
      applyPatchesToDom(container, [
        { type: "TEXT", path: [1, 0], text: "earth" },
      ]);
      expect(container.innerHTML).toBe(
        "<div>hello<!-- 설명 --><span>earth</span></div>",
      );
    });

    it("P18 INSERT의 번호에도 주석을 세지 않습니다", () => {
      const container = createContainerFromHtml(
        "<ul><li>a</li><!-- 설명 --><li>c</li></ul>",
      );
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
    });

    it("P19 공백만 있는 글자 노드도 번호에 셉니다", () => {
      const container = createContainerFromHtml("<ul>\n  <li>a</li></ul>");
      applyPatchesToDom(container, [{ type: "TEXT", path: [1, 0], text: "b" }]);
      expect(container.innerHTML).toBe("<ul>\n  <li>b</li></ul>");
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
      applyPatchesToDom(container, [
        { type: "REMOVE", path: [0] },
        { type: "TEXT", path: [0, 0], text: "x" },
      ]);
      expect(container.innerHTML).toBe("<ul><li>x</li><li>c</li></ul>");
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
  });
});
