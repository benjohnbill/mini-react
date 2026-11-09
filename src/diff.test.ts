// M2 공통 테스트입니다. Patch의 형식과 순서의 근거는 ADR 0006입니다.
import { describe, expect, it } from "vitest";
import { diffViews } from "./diff";
import type { VNode } from "./vnode";

type ElementVNode = Exclude<VNode, string>;

function createElementVNode(
  type: string,
  props: Record<string, string>,
  children: VNode[],
): VNode {
  return { type, props, children };
}

function freezeVNodeDeeply(vnode: VNode): void {
  if (typeof vnode === "string") {
    return;
  }
  Object.freeze(vnode.props);
  for (const child of vnode.children) {
    freezeVNodeDeeply(child);
  }
  Object.freeze(vnode.children);
  Object.freeze(vnode);
}

function createListVNode(items: string[]): VNode {
  return createElementVNode(
    "ul",
    {},
    items.map((item) => createElementVNode("li", {}, [item])),
  );
}

describe.skip("diffViews", () => {
  describe("변경 없음", () => {
    it("D1 내용이 같은 두 View는 빈 배열을 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { id: "a" }, ["x"]),
          createElementVNode("div", { id: "a" }, ["x"]),
        ),
      ).toStrictEqual([]);
    });

    it("D2 같은 객체를 두 인자로 넘기면 빈 배열을 돌려줍니다", () => {
      const view = createListVNode(["a", "b"]);
      expect(diffViews(view, view)).toStrictEqual([]);
    });

    it("D3 중첩된 내용이 같으면 객체가 달라도 빈 배열을 돌려줍니다", () => {
      expect(
        diffViews(createListVNode(["a", "b"]), createListVNode(["a", "b"])),
      ).toStrictEqual([]);
    });

    it("D4 속성을 적은 순서만 다르면 빈 배열을 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("p", { id: "a", class: "c" }, []),
          createElementVNode("p", { class: "c", id: "a" }, []),
        ),
      ).toStrictEqual([]);
    });
  });

  describe("노드 종류와 태그", () => {
    it("D5 태그가 바뀌면 REPLACE 하나만 돌려주고 안쪽의 Patch는 없습니다", () => {
      const newView = createElementVNode("span", {}, ["a"]);
      expect(
        diffViews(createElementVNode("p", {}, ["a"]), newView),
      ).toStrictEqual([{ type: "REPLACE", path: [], node: newView }]);
    });

    it("D6 문자열이 요소로 바뀌면 그 path에 REPLACE를 돌려줍니다", () => {
      const bold = createElementVNode("b", {}, ["a"]);
      expect(
        diffViews(
          createElementVNode("p", {}, ["a"]),
          createElementVNode("p", {}, [bold]),
        ),
      ).toStrictEqual([{ type: "REPLACE", path: [0], node: bold }]);
    });

    it("D7 요소가 문자열로 바뀌면 그 path에 REPLACE를 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, [createElementVNode("b", {}, ["a"])]),
          createElementVNode("p", {}, ["a"]),
        ),
      ).toStrictEqual([{ type: "REPLACE", path: [0], node: "a" }]);
    });

    it("D8 깊은 자식의 태그가 바뀌면 그 path에 REPLACE를 돌려줍니다", () => {
      const newItem = createElementVNode("p", {}, ["b"]);
      expect(
        diffViews(
          createElementVNode("div", {}, [
            createElementVNode("section", {}, [
              createElementVNode("li", {}, ["b"]),
            ]),
          ]),
          createElementVNode("div", {}, [
            createElementVNode("section", {}, [newItem]),
          ]),
        ),
      ).toStrictEqual([{ type: "REPLACE", path: [0, 0], node: newItem }]);
    });

    it("D9 태그와 속성과 자식이 함께 바뀌어도 REPLACE 하나만 돌려줍니다", () => {
      const newView = createElementVNode("section", { id: "b" }, ["y", "z"]);
      expect(
        diffViews(createElementVNode("div", { class: "a" }, ["x"]), newView),
      ).toStrictEqual([{ type: "REPLACE", path: [], node: newView }]);
    });
  });

  describe("글자", () => {
    it("D10 글자가 바뀌면 TEXT 하나만 돌려주고 REPLACE는 없습니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, ["a"]),
          createElementVNode("p", {}, ["b"]),
        ),
      ).toStrictEqual([{ type: "TEXT", path: [0], text: "b" }]);
    });

    it("D11 빈 글자와 글자 사이의 변경도 TEXT로 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, ["", "a"]),
          createElementVNode("p", {}, ["a", ""]),
        ),
      ).toStrictEqual([
        { type: "TEXT", path: [0], text: "a" },
        { type: "TEXT", path: [1], text: "" },
      ]);
    });

    it("D12 빈 글자가 그대로면 Patch가 없습니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, [""]),
          createElementVNode("p", {}, [""]),
        ),
      ).toStrictEqual([]);
    });

    it("D13 공백과 줄바꿈만 달라도 글자를 다듬지 않고 TEXT를 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, ["a b"]),
          createElementVNode("p", {}, [" a\nb "]),
        ),
      ).toStrictEqual([{ type: "TEXT", path: [0], text: " a\nb " }]);
    });

    it("D14 한글과 특수문자를 그대로 TEXT에 담습니다", () => {
      expect(
        diffViews(
          createElementVNode("p", {}, ["안녕"]),
          createElementVNode("p", {}, ["<b>&amp;</b> 세상"]),
        ),
      ).toStrictEqual([{ type: "TEXT", path: [0], text: "<b>&amp;</b> 세상" }]);
    });

    it("D15 View 자체가 문자열이면 path []에 TEXT를 돌려줍니다", () => {
      expect(diffViews("a", "b")).toStrictEqual([
        { type: "TEXT", path: [], text: "b" },
      ]);
    });
  });

  describe("속성", () => {
    it("D16 속성값이 바뀌면 set에 새 값을 담습니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { class: "x" }, []),
          createElementVNode("div", { class: "y" }, []),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { class: "y" }, remove: [] },
      ]);
    });

    it("D17 속성이 생기면 set에 담고 remove는 비웁니다", () => {
      expect(
        diffViews(
          createElementVNode("div", {}, []),
          createElementVNode("div", { id: "a" }, []),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { id: "a" }, remove: [] },
      ]);
    });

    it("D18 속성이 사라지면 remove에 담고 set은 비웁니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { id: "a" }, []),
          createElementVNode("div", {}, []),
        ),
      ).toStrictEqual([{ type: "PROPS", path: [], set: {}, remove: ["id"] }]);
    });

    it("D19 속성 없음과 빈 값을 구별합니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { a: "", b: "x" }, []),
          createElementVNode("div", { b: "", c: "" }, []),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { b: "", c: "" }, remove: ["a"] },
      ]);
    });

    it("D20 빈 값 속성이 그대로면 Patch가 없습니다", () => {
      expect(
        diffViews(
          createElementVNode("input", { disabled: "" }, []),
          createElementVNode("input", { disabled: "" }, []),
        ),
      ).toStrictEqual([]);
    });

    it("D21 바뀐 속성만 담고 그대로인 속성은 담지 않습니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { id: "a", class: "x", title: "t" }, []),
          createElementVNode("div", { id: "a", class: "y", title: "t" }, []),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { class: "y" }, remove: [] },
      ]);
    });

    it("D22 추가와 변경과 삭제를 PROPS 하나에 함께 담습니다", () => {
      expect(
        diffViews(
          createElementVNode("div", { id: "a", class: "x" }, []),
          createElementVNode("div", { class: "y", title: "t" }, []),
        ),
      ).toStrictEqual([
        {
          type: "PROPS",
          path: [],
          set: { class: "y", title: "t" },
          remove: ["id"],
        },
      ]);
    });

    it("D23 입력칸의 value가 빈 값이 되면 remove가 아니라 set으로 담습니다", () => {
      expect(
        diffViews(
          createElementVNode("input", { value: "typed" }, []),
          createElementVNode("input", { value: "" }, []),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { value: "" }, remove: [] },
      ]);
    });
  });

  describe("자식의 개수와 위치", () => {
    it("D24 자식이 늘면 그 번호에 INSERT를 돌려줍니다", () => {
      expect(
        diffViews(createListVNode(["a"]), createListVNode(["a", "b"])),
      ).toStrictEqual([
        {
          type: "INSERT",
          path: [1],
          node: createElementVNode("li", {}, ["b"]),
        },
      ]);
    });

    it("D25 자식이 줄면 뒤 번호부터 REMOVE를 돌려줍니다", () => {
      expect(
        diffViews(createListVNode(["a", "b", "c"]), createListVNode(["a"])),
      ).toStrictEqual([
        { type: "REMOVE", path: [2] },
        { type: "REMOVE", path: [1] },
      ]);
    });

    it("D26 가운데에 끼워 넣으면 같은 번호끼리 비교한 뒤 끝에 INSERT합니다", () => {
      expect(
        diffViews(
          createListVNode(["a", "c"]),
          createListVNode(["a", "b", "c"]),
        ),
      ).toStrictEqual([
        { type: "TEXT", path: [1, 0], text: "b" },
        {
          type: "INSERT",
          path: [2],
          node: createElementVNode("li", {}, ["c"]),
        },
      ]);
    });

    it("D27 맨 앞에 끼워 넣어도 같은 번호끼리 비교합니다", () => {
      expect(
        diffViews(createListVNode(["b"]), createListVNode(["a", "b"])),
      ).toStrictEqual([
        { type: "TEXT", path: [0, 0], text: "a" },
        {
          type: "INSERT",
          path: [1],
          node: createElementVNode("li", {}, ["b"]),
        },
      ]);
    });

    it("D28 맨 앞이나 가운데를 지워도 남은 번호를 바꾼 뒤 끝을 REMOVE합니다", () => {
      expect(
        diffViews(
          createListVNode(["a", "b", "c"]),
          createListVNode(["b", "c"]),
        ),
      ).toStrictEqual([
        { type: "TEXT", path: [0, 0], text: "b" },
        { type: "TEXT", path: [1, 0], text: "c" },
        { type: "REMOVE", path: [2] },
      ]);
      expect(
        diffViews(
          createListVNode(["a", "b", "c"]),
          createListVNode(["a", "c"]),
        ),
      ).toStrictEqual([
        { type: "TEXT", path: [1, 0], text: "c" },
        { type: "REMOVE", path: [2] },
      ]);
    });

    it("D29 자식을 모두 지우면 뒤 번호부터 REMOVE합니다", () => {
      expect(
        diffViews(createListVNode(["a", "b", "c"]), createListVNode([])),
      ).toStrictEqual([
        { type: "REMOVE", path: [2] },
        { type: "REMOVE", path: [1] },
        { type: "REMOVE", path: [0] },
      ]);
    });

    it("D30 빈 자식에 자식이 생기면 앞 번호부터 INSERT합니다", () => {
      expect(
        diffViews(createListVNode([]), createListVNode(["a", "b", "c"])),
      ).toStrictEqual(
        ["a", "b", "c"].map((item, index) => ({
          type: "INSERT",
          path: [index],
          node: createElementVNode("li", {}, [item]),
        })),
      );
    });

    it("D31 글자와 요소가 섞인 자식도 번호대로 비교합니다", () => {
      const bold = createElementVNode("b", {}, ["y"]);
      expect(
        diffViews(
          createElementVNode("p", {}, [
            "a",
            createElementVNode("b", {}, ["x"]),
          ]),
          createElementVNode("p", {}, [bold, "a", "z"]),
        ),
      ).toStrictEqual([
        { type: "REPLACE", path: [0], node: bold },
        { type: "REPLACE", path: [1], node: "a" },
        { type: "INSERT", path: [2], node: "z" },
      ]);
    });
  });

  describe("중첩 위치와 변경 조합", () => {
    it("D32 깊은 곳의 글자 하나가 바뀌면 그 path의 TEXT 하나만 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("div", {}, [
            createElementVNode("section", {}, [
              createElementVNode("p", {}, ["a"]),
              createElementVNode("p", {}, ["b"]),
            ]),
          ]),
          createElementVNode("div", {}, [
            createElementVNode("section", {}, [
              createElementVNode("p", {}, ["a"]),
              createElementVNode("p", {}, ["c"]),
            ]),
          ]),
        ),
      ).toStrictEqual([{ type: "TEXT", path: [0, 1, 0], text: "c" }]);
    });

    it("D33 서로 다른 곳의 글자와 속성이 바뀌면 그 두 Patch만 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("div", {}, [
            createElementVNode("p", {}, ["a"]),
            createElementVNode("p", { class: "x" }, ["b"]),
          ]),
          createElementVNode("div", {}, [
            createElementVNode("p", {}, ["c"]),
            createElementVNode("p", { class: "y" }, ["b"]),
          ]),
        ),
      ).toStrictEqual([
        { type: "TEXT", path: [0, 0], text: "c" },
        { type: "PROPS", path: [1], set: { class: "y" }, remove: [] },
      ]);
    });

    it("D34 부모의 속성과 자식의 글자가 함께 바뀌면 부모의 PROPS를 먼저 돌려줍니다", () => {
      expect(
        diffViews(
          createElementVNode("p", { class: "x" }, ["a"]),
          createElementVNode("p", { class: "y" }, ["b"]),
        ),
      ).toStrictEqual([
        { type: "PROPS", path: [], set: { class: "y" }, remove: [] },
        { type: "TEXT", path: [0], text: "b" },
      ]);
    });

    it("D35 한 가지의 자식 삭제와 다른 가지의 변경을 각자의 path로 돌려줍니다", () => {
      const newSection = createElementVNode("section", {}, ["s"]);
      expect(
        diffViews(
          createElementVNode("div", {}, [
            createListVNode(["a", "b"]),
            createElementVNode("p", {}, ["x"]),
            createElementVNode("article", {}, ["s"]),
          ]),
          createElementVNode("div", {}, [
            createListVNode(["a"]),
            createElementVNode("p", {}, ["y"]),
            newSection,
          ]),
        ),
      ).toStrictEqual([
        { type: "REMOVE", path: [0, 1] },
        { type: "TEXT", path: [1, 0], text: "y" },
        { type: "REPLACE", path: [2], node: newSection },
      ]);
    });

    it("D39 속성 추가, 글자 변경, 깊은 INSERT, 끝 REMOVE가 섞여도 바뀐 곳만 순서대로 돌려줍니다", () => {
      // old: <div><section id="left"><p>a</p><p>b</p><p>c</p></section><aside>s</aside></div>
      // new: <div><section id="left" class="active"><p>A<b>new</b></p><p>b</p></section><aside>s</aside></div>
      const currentView = createElementVNode("div", {}, [
        createElementVNode("section", { id: "left" }, [
          createElementVNode("p", {}, ["a"]),
          createElementVNode("p", {}, ["b"]),
          createElementVNode("p", {}, ["c"]),
        ]),
        createElementVNode("aside", {}, ["s"]),
      ]);
      const newBold = createElementVNode("b", {}, ["new"]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("section", { id: "left", class: "active" }, [
          createElementVNode("p", {}, ["A", newBold]),
          createElementVNode("p", {}, ["b"]),
        ]),
        createElementVNode("aside", {}, ["s"]),
      ]);
      expect(diffViews(currentView, newView)).toStrictEqual([
        { type: "PROPS", path: [0], set: { class: "active" }, remove: [] },
        { type: "TEXT", path: [0, 0, 0], text: "A" },
        { type: "INSERT", path: [0, 0, 1], node: newBold },
        { type: "REMOVE", path: [0, 2] },
      ]);
    });
  });

  describe("입력", () => {
    it("D36 두 View의 내용과 안쪽 객체의 참조를 바꾸지 않습니다", () => {
      const sharedParagraph = createElementVNode("p", {}, ["x"]);
      const currentList: ElementVNode = {
        type: "ul",
        props: {},
        children: ["a", "b", "c"].map((item) =>
          createElementVNode("li", {}, [item]),
        ),
      };
      const currentView: ElementVNode = {
        type: "div",
        props: { id: "a" },
        children: [currentList, sharedParagraph],
      };
      const newList: ElementVNode = {
        type: "ul",
        props: {},
        children: [createElementVNode("li", {}, ["a"])],
      };
      const newView: ElementVNode = {
        type: "div",
        props: { class: "b" },
        children: [
          newList,
          sharedParagraph,
          createElementVNode("span", {}, ["y"]),
          "z",
        ],
      };
      const currentProps = currentView.props;
      const currentChildren = currentView.children;
      const currentListChildren = currentList.children;
      const currentFirstItem = currentList.children[0];
      const newProps = newView.props;
      const newChildren = newView.children;
      const newListChildren = newList.children;
      const newFirstItem = newList.children[0];
      const currentCopy = structuredClone(currentView);
      const newCopy = structuredClone(newView);
      // 얼린 입력에 쓰면 엄격 모드에서 TypeError가 나므로, 호출 중의 변경도 드러납니다.
      freezeVNodeDeeply(currentView);
      freezeVNodeDeeply(newView);

      diffViews(currentView, newView);

      expect(currentView).toStrictEqual(currentCopy);
      expect(newView).toStrictEqual(newCopy);
      expect(currentView.props).toBe(currentProps);
      expect(currentView.children).toBe(currentChildren);
      expect(currentView.children[0]).toBe(currentList);
      expect(currentView.children[1]).toBe(sharedParagraph);
      expect(currentList.children).toBe(currentListChildren);
      expect(currentList.children[0]).toBe(currentFirstItem);
      expect(newView.props).toBe(newProps);
      expect(newView.children).toBe(newChildren);
      expect(newView.children[0]).toBe(newList);
      expect(newView.children[1]).toBe(sharedParagraph);
      expect(newList.children).toBe(newListChildren);
      expect(newList.children[0]).toBe(newFirstItem);
    });

    it("D37 앞의 호출이 돌려준 Patch는 다음 호출로 바뀌거나 쌓이지 않습니다", () => {
      const view = createListVNode(["a"]);
      const firstPatches = diffViews(view, createListVNode(["b"]));
      const firstCopy = structuredClone(firstPatches);
      const secondPatches = diffViews(view, createListVNode(["a", "c"]));
      expect(firstPatches).toStrictEqual(firstCopy);
      expect(secondPatches).toStrictEqual([
        {
          type: "INSERT",
          path: [1],
          node: createElementVNode("li", {}, ["c"]),
        },
      ]);
    });

    it("D38 인자가 null이나 undefined이면 TypeError를 던집니다", () => {
      const view = createElementVNode("div", {}, []);
      for (const invalid of [null, undefined]) {
        expect(() => diffViews(invalid as unknown as VNode, view)).toThrow(
          TypeError,
        );
        expect(() => diffViews(view, invalid as unknown as VNode)).toThrow(
          TypeError,
        );
        expect(() => diffViews("a", invalid as unknown as VNode)).toThrow(
          TypeError,
        );
      }
    });
  });
});
