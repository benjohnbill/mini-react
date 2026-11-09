// diffViews와 applyPatchesToDom을 함께 쓰는 통합 테스트입니다. 근거는 ADR 0005와 ADR 0006입니다.
// 다시 읽은 View가 같아도 노드의 참조와 입력칸의 .value는 보장되지 않으므로, 각각 따로 확인합니다.
import { describe, expect, it } from "vitest";
import { diffViews } from "./diff";
import { applyPatchesToDom } from "./patch";
import { createDomFromVNode, createVNodeFromDom, type VNode } from "./vnode";

type ElementVNode = Exclude<VNode, string>;

function createElementVNode(
  type: string,
  props: Record<string, string>,
  children: VNode[],
): ElementVNode {
  return { type, props, children };
}

function createContainerFromView(view: VNode): Element {
  const container = document.createElement("div");
  container.append(createDomFromVNode(view));
  return container;
}

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

function getInputElement(node: Node | null | undefined): HTMLInputElement {
  if (!(node instanceof HTMLInputElement)) {
    throw new Error("Node is not an input");
  }
  return node;
}

function createViewFromContainer(container: Element): VNode {
  return createVNodeFromDom(getViewElement(container));
}

describe.skip("diffViews → applyPatchesToDom", () => {
  describe("새 View에 도달", () => {
    it("I1 글자만 다른 두 View로 고치면 다시 읽은 결과가 새 View와 같습니다", () => {
      const currentView = createElementVNode("div", {}, [
        createElementVNode("p", {}, ["a"]),
        createElementVNode("p", {}, ["b"]),
      ]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("p", {}, ["a"]),
        createElementVNode("p", {}, ["c"]),
      ]);
      const container = createContainerFromView(currentView);

      applyPatchesToDom(container, diffViews(currentView, newView));

      expect(container.innerHTML).toBe("<div><p>a</p><p>c</p></div>");
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I2 속성의 추가, 변경, 삭제가 섞여도 다시 읽은 결과가 새 View와 같습니다", () => {
      const currentView = createElementVNode("div", { id: "a", class: "x" }, [
        createElementVNode("p", { title: "t" }, ["a"]),
        createElementVNode("p", {}, ["b"]),
      ]);
      const newView = createElementVNode("div", { class: "y", lang: "ko" }, [
        createElementVNode("p", {}, ["a"]),
        createElementVNode("p", { title: "" }, ["b"]),
      ]);
      const container = createContainerFromView(currentView);
      const view = getViewElement(container);

      applyPatchesToDom(container, diffViews(currentView, newView));

      expect(getViewElement(container)).toBe(view);
      expect(view.hasAttribute("id")).toBe(false);
      expect(view.getAttribute("class")).toBe("y");
      expect(view.getAttribute("lang")).toBe("ko");
      expect(view.children[0]?.hasAttribute("title")).toBe(false);
      expect(view.children[1]?.getAttribute("title")).toBe("");
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I3 자식의 추가, 삭제, 가운데 끼워 넣기가 섞여도 다시 읽은 결과가 새 View와 같습니다", () => {
      const currentView = createElementVNode("div", {}, [
        createElementVNode("ul", {}, [
          createElementVNode("li", {}, ["a"]),
          createElementVNode("li", {}, ["c"]),
        ]),
        createElementVNode("ol", {}, [
          createElementVNode("li", {}, ["1"]),
          createElementVNode("li", {}, ["2"]),
          createElementVNode("li", {}, ["3"]),
        ]),
        createElementVNode("p", {}, []),
      ]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("ul", {}, [
          createElementVNode("li", {}, ["a"]),
          createElementVNode("li", {}, ["b"]),
          createElementVNode("li", {}, ["c"]),
        ]),
        createElementVNode("ol", {}, [createElementVNode("li", {}, ["1"])]),
        createElementVNode("p", {}, ["x", createElementVNode("b", {}, ["y"])]),
      ]);
      const container = createContainerFromView(currentView);

      applyPatchesToDom(container, diffViews(currentView, newView));

      expect(container.innerHTML).toBe(
        "<div><ul><li>a</li><li>b</li><li>c</li></ul><ol><li>1</li></ol><p>x<b>y</b></p></div>",
      );
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I4 중간 깊이의 태그와 그 아래 구조가 바뀌면 그 노드만 새로 만들고 바깥 노드는 남깁니다", () => {
      const currentView = createElementVNode("div", {}, [
        createElementVNode("h1", {}, ["title"]),
        createElementVNode("section", { id: "s" }, [
          createElementVNode("p", {}, ["a"]),
        ]),
        createElementVNode("footer", {}, ["f"]),
      ]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("h1", {}, ["title"]),
        createElementVNode("article", { id: "s" }, [
          createElementVNode("ul", {}, [createElementVNode("li", {}, ["b"])]),
          "c",
        ]),
        createElementVNode("footer", {}, ["f"]),
      ]);
      const container = createContainerFromView(currentView);
      const view = getViewElement(container);
      const [heading, section, footer] = view.children;
      const headingText = heading?.firstChild;
      const footerText = footer?.firstChild;

      applyPatchesToDom(container, diffViews(currentView, newView));

      expect(container.innerHTML).toBe(
        '<div><h1>title</h1><article id="s"><ul><li>b</li></ul>c</article><footer>f</footer></div>',
      );
      expect(getViewElement(container)).toBe(view);
      expect(view.children[0]).toBe(heading);
      expect(view.children[0]?.firstChild).toBe(headingText);
      expect(view.children[1]).not.toBe(section);
      expect(section?.parentNode).toBeNull();
      expect(view.children[2]).toBe(footer);
      expect(view.children[2]?.firstChild).toBe(footerText);
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I5 최상위 태그가 바뀌면 View를 바꾸고 container와 자식 수는 그대로 둡니다", () => {
      const currentView = createElementVNode("div", { id: "app" }, ["a"]);
      const newView = createElementVNode("section", { id: "app" }, [
        createElementVNode("p", {}, ["b"]),
      ]);
      const container = createContainerFromView(currentView);
      const parent = document.createElement("main");
      parent.append(container);
      const oldView = getViewElement(container);

      applyPatchesToDom(container, diffViews(currentView, newView));

      expect(parent.firstChild).toBe(container);
      expect(container.childNodes).toHaveLength(1);
      expect(container.firstChild).not.toBe(oldView);
      expect(container.innerHTML).toBe('<section id="app"><p>b</p></section>');
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I6 A → B → C → A로 이어서 고치면 단계마다 그 View가 되고, 남는 노드와 .value가 맞습니다", () => {
      const viewA = createElementVNode("div", {}, [
        createElementVNode("p", {}, ["hello"]),
        createElementVNode("input", { value: "a" }, []),
      ]);
      const viewB = createElementVNode("div", { class: "b" }, [
        createElementVNode("p", {}, [""]),
        createElementVNode("input", { value: "" }, []),
        createElementVNode("ul", {}, [createElementVNode("li", {}, ["x"])]),
      ]);
      const viewC = createElementVNode("div", {}, [
        createElementVNode("p", {}, [" c "]),
        createElementVNode("input", { value: "typed" }, []),
        createElementVNode("ul", {}, [
          createElementVNode("li", {}, ["x"]),
          createElementVNode("li", {}, ["y"]),
        ]),
      ]);
      const container = createContainerFromView(viewA);
      const view = getViewElement(container);
      const paragraph = view.children[0];
      const paragraphText = paragraph?.firstChild;
      const input = getInputElement(view.children[1]);
      const steps = [
        { currentView: viewA, newView: viewB, value: "", text: "" },
        { currentView: viewB, newView: viewC, value: "typed", text: " c " },
        { currentView: viewC, newView: viewA, value: "a", text: "hello" },
      ];

      for (const step of steps) {
        applyPatchesToDom(container, diffViews(step.currentView, step.newView));
        expect(createViewFromContainer(container)).toStrictEqual(step.newView);
        expect(getViewElement(container)).toBe(view);
        expect(view.children[0]).toBe(paragraph);
        expect(paragraph?.firstChild).toBe(paragraphText);
        expect(paragraphText?.textContent).toBe(step.text);
        expect(view.children[1]).toBe(input);
        expect(input.value).toBe(step.value);
      }
      expect(view.children).toHaveLength(2);
    });
  });

  describe("바꾸지 않을 노드", () => {
    it("I7 한 곳만 다르면 바뀌지 않은 요소와 글자 노드가 모두 같은 객체로 남습니다", () => {
      const currentView = createElementVNode("div", {}, [
        createElementVNode("header", {}, [createElementVNode("h1", {}, ["t"])]),
        createElementVNode("ul", {}, [
          createElementVNode("li", {}, ["a"]),
          createElementVNode("li", {}, ["b"]),
        ]),
        createElementVNode("p", {}, ["x"]),
      ]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("header", {}, [createElementVNode("h1", {}, ["t"])]),
        createElementVNode("ul", {}, [
          createElementVNode("li", {}, ["a"]),
          createElementVNode("li", {}, ["c"]),
        ]),
        createElementVNode("p", {}, ["x"]),
      ]);
      const container = createContainerFromView(currentView);
      const elementsBefore = [...container.querySelectorAll("*")];
      const textsBefore = elementsBefore.flatMap((element) =>
        [...element.childNodes].filter((child) => child instanceof Text),
      );

      applyPatchesToDom(container, diffViews(currentView, newView));

      const elementsAfter = [...container.querySelectorAll("*")];
      expect(elementsAfter).toHaveLength(elementsBefore.length);
      for (const [index, element] of elementsBefore.entries()) {
        expect(elementsAfter[index]).toBe(element);
      }
      const textsAfter = elementsAfter.flatMap((element) =>
        [...element.childNodes].filter((child) => child instanceof Text),
      );
      expect(textsAfter).toHaveLength(textsBefore.length);
      for (const [index, text] of textsBefore.entries()) {
        expect(textsAfter[index]).toBe(text);
      }
      expect(container.innerHTML).toBe(
        "<div><header><h1>t</h1></header><ul><li>a</li><li>c</li></ul><p>x</p></div>",
      );
    });

    it("I8 내용이 같은 다른 객체의 두 View로 고치면 DOM을 바꾸지 않습니다", () => {
      const createView = (): ElementVNode =>
        createElementVNode("div", { id: "a" }, [
          createElementVNode("p", { class: "x" }, ["a", ""]),
          createElementVNode("input", { value: "v" }, []),
        ]);
      const currentView = createView();
      const newView = createView();
      const container = createContainerFromView(currentView);
      const nodesBefore = [...createNodeListFromTree(container)];
      const observer = new MutationObserver(() => {});
      observer.observe(container, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });

      applyPatchesToDom(container, diffViews(currentView, newView));

      const records = observer.takeRecords();
      observer.disconnect();
      expect(records).toHaveLength(0);
      const nodesAfter = [...createNodeListFromTree(container)];
      expect(nodesAfter).toHaveLength(nodesBefore.length);
      for (const [index, node] of nodesBefore.entries()) {
        expect(nodesAfter[index]).toBe(node);
      }
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });

    it("I9 속성 추가, 글자 변경, 깊은 INSERT, 끝 REMOVE가 섞여도 같은 자리의 노드는 같은 객체로 남습니다", () => {
      // DIFF-N05의 fixture입니다. 이전 DOM은 createDomFromVNode가 아니라 HTML로 따로 만듭니다.
      const currentView = createElementVNode("div", {}, [
        createElementVNode("section", { id: "left" }, [
          createElementVNode("p", {}, ["a"]),
          createElementVNode("p", {}, ["b"]),
          createElementVNode("p", {}, ["c"]),
        ]),
        createElementVNode("aside", {}, ["s"]),
      ]);
      const newView = createElementVNode("div", {}, [
        createElementVNode("section", { id: "left", class: "active" }, [
          createElementVNode("p", {}, [
            "A",
            createElementVNode("b", {}, ["new"]),
          ]),
          createElementVNode("p", {}, ["b"]),
        ]),
        createElementVNode("aside", {}, ["s"]),
      ]);
      const container = createContainerFromHtml(
        '<div><section id="left"><p>a</p><p>b</p><p>c</p></section><aside>s</aside></div>',
      );
      const root = getViewElement(container);
      const section = root.children[0];
      const aside = root.children[1];
      const [firstParagraph, secondParagraph, thirdParagraph] =
        section?.children ?? [];
      const firstText = firstParagraph?.firstChild;
      const asideText = aside?.firstChild;
      if (
        section === undefined ||
        aside === undefined ||
        firstParagraph === undefined ||
        secondParagraph === undefined ||
        thirdParagraph === undefined
      ) {
        throw new Error("Fixture is not the DIFF-N05 DOM");
      }

      applyPatchesToDom(container, diffViews(currentView, newView));

      // 구조
      expect(container.innerHTML).toBe(
        '<div><section id="left" class="active"><p>A<b>new</b></p><p>b</p></section><aside>s</aside></div>',
      );
      expect(createViewFromContainer(container)).toStrictEqual(newView);
      expect(
        getViewElement(container).isEqualNode(createDomFromVNode(newView)),
      ).toBe(true);
      // 참조
      expect(container.childNodes).toHaveLength(1);
      expect(getViewElement(container)).toBe(root);
      expect(root.children[0]).toBe(section);
      expect(root.children[1]).toBe(aside);
      expect(aside.firstChild).toBe(asideText);
      expect(section.children).toHaveLength(2);
      expect(section.children[0]).toBe(firstParagraph);
      expect(section.children[1]).toBe(secondParagraph);
      expect(firstParagraph.firstChild).toBe(firstText);
      expect(thirdParagraph.parentNode).toBeNull();
      const bold = firstParagraph.childNodes[1];
      expect(bold).toBeInstanceOf(HTMLElement);
      expect(bold?.parentNode).toBe(firstParagraph);
      expect(createViewFromContainer(container)).toStrictEqual(newView);
    });
  });

  describe("무작위 View 쌍", () => {
    it("I10 고정한 시드로 만든 View 쌍 500개 모두 새 View에 도달합니다", () => {
      for (let pairIndex = 0; pairIndex < FUZZ_PAIR_COUNT; pairIndex++) {
        const seed = FUZZ_BASE_SEED + pairIndex;
        const random = createRandomNumberGenerator(seed);
        const currentView = createRandomView(random);
        const newView = createChangedView(random, currentView);
        const failureMessage = `seed ${seed}\ncurrentView ${JSON.stringify(currentView)}\nnewView ${JSON.stringify(newView)}`;
        const container = createContainerFromView(currentView);

        applyPatchesToDom(container, diffViews(currentView, newView));

        expect(container.childNodes, failureMessage).toHaveLength(1);
        expect(
          createViewFromContainer(container),
          failureMessage,
        ).toStrictEqual(newView);
      }
    });
  });
});

describe.skip("createVNodeFromDom → diffViews → applyPatchesToDom", () => {
  it("I11 DOM에서 읽은 두 View로 고치면 빈 글자 노드, 공백, 주석 옆의 대상만 바뀌고 친 글자는 빈 값이 됩니다", () => {
    // 이전 DOM: <div>""," "<!--x-->"a"<span>world</span><input value="initial">(.value "typed")</div>
    const container = document.createElement("div");
    const view = document.createElement("div");
    const emptyText = document.createTextNode("");
    const spaceText = document.createTextNode(" ");
    const comment = document.createComment("x");
    const letterText = document.createTextNode("a");
    const span = document.createElement("span");
    const spanText = document.createTextNode("world");
    span.append(spanText);
    const input = document.createElement("input");
    input.setAttribute("value", "initial");
    view.append(emptyText, spaceText, comment, letterText, span, input);
    container.append(view);
    input.value = "typed";

    // 새 DOM: 같은 구조에서 span의 글자만 다르고 사용자가 입력칸을 비웠습니다.
    const newDom = document.createElement("div");
    const newSpan = document.createElement("span");
    newSpan.append("earth");
    const newInput = document.createElement("input");
    newInput.setAttribute("value", "initial");
    newDom.append(
      document.createTextNode(""),
      document.createTextNode(" "),
      document.createComment("x"),
      document.createTextNode("a"),
      newSpan,
      newInput,
    );
    newInput.value = "";

    const currentView = createVNodeFromDom(view);
    const newView = createVNodeFromDom(newDom);
    const expectedNewView = createElementVNode("div", {}, [
      "",
      " ",
      "a",
      createElementVNode("span", {}, ["earth"]),
      createElementVNode("input", { value: "" }, []),
    ]);
    expect(newView).toStrictEqual(expectedNewView);

    applyPatchesToDom(container, diffViews(currentView, newView));

    // 구조
    expect(span.textContent).toBe("earth");
    expect(emptyText.data).toBe("");
    expect(spaceText.data).toBe(" ");
    expect(letterText.data).toBe("a");
    expect(createVNodeFromDom(view)).toStrictEqual(expectedNewView);
    // 입력칸의 현재 값
    expect(input.value).toBe("");
    // 참조와 위치
    expect(container.firstChild).toBe(view);
    expect(view.childNodes).toHaveLength(6);
    expect(view.childNodes[0]).toBe(emptyText);
    expect(view.childNodes[1]).toBe(spaceText);
    expect(view.childNodes[2]).toBe(comment);
    expect(view.childNodes[3]).toBe(letterText);
    expect(view.childNodes[4]).toBe(span);
    expect(view.childNodes[5]).toBe(input);
    expect(span.firstChild).toBe(spanText);
  });

  it("I12 DOM에서 읽은 두 View로 고치면 주석이 있어도 그 자리의 노드를 바꾸고, 새 입력칸에 친 글자를 넣습니다", () => {
    const container = createContainerFromHtml(
      "<ul><li>a</li><!-- 설명 --><li>b</li></ul>",
    );
    const list = getViewElement(container);
    const [firstItem, comment, secondItem] = list.childNodes;
    const secondText = secondItem?.firstChild;

    const newDom = document.createElement("ul");
    newDom.innerHTML = "<li>a</li><!-- 설명 --><li>B</li><li><input></li>";
    newDom.setAttribute("class", "x");
    getInputElement(newDom.querySelector("input")).value = "hello";

    const currentView = createVNodeFromDom(list);
    const newView = createVNodeFromDom(newDom);
    const expectedNewView = createElementVNode("ul", { class: "x" }, [
      createElementVNode("li", {}, ["a"]),
      createElementVNode("li", {}, ["B"]),
      createElementVNode("li", {}, [
        createElementVNode("input", { value: "hello" }, []),
      ]),
    ]);
    expect(newView).toStrictEqual(expectedNewView);

    applyPatchesToDom(container, diffViews(currentView, newView));

    // 구조
    expect(container.innerHTML).toBe(
      '<ul class="x"><li>a</li><!-- 설명 --><li>B</li><li><input value="hello"></li></ul>',
    );
    expect(createVNodeFromDom(list)).toStrictEqual(expectedNewView);
    // 입력칸의 현재 값
    expect(getInputElement(list.querySelector("input")).value).toBe("hello");
    // 참조와 위치
    expect(getViewElement(container)).toBe(list);
    expect(list.childNodes).toHaveLength(4);
    expect(list.childNodes[0]).toBe(firstItem);
    expect(list.childNodes[1]).toBe(comment);
    expect(list.childNodes[2]).toBe(secondItem);
    expect(secondItem?.firstChild).toBe(secondText);
  });
});

function* createNodeListFromTree(root: Node): Generator<Node> {
  for (const child of root.childNodes) {
    yield child;
    yield* createNodeListFromTree(child);
  }
}

// 무작위 View 쌍을 만드는 도구입니다. 실패하면 시드로 같은 쌍을 다시 만들 수 있습니다.
const FUZZ_PAIR_COUNT = 500;
const FUZZ_BASE_SEED = 20261109;
const FUZZ_MAX_DEPTH = 3;
const FUZZ_MAX_CHILDREN = 4;
const FUZZ_TAGS = ["div", "p", "span", "ul", "li"];
const FUZZ_TEXTS = ["", " ", "a", "b", "가 나", "<b>x</b>"];
const FUZZ_PROP_NAMES = ["id", "class", "title"];
const FUZZ_PROP_VALUES = ["", "x", "y"];

// mulberry32: 시드가 같으면 같은 수열을 돌려줍니다.
function createRandomNumberGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function getRandomItem<T>(random: () => number, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("Cannot pick from an empty list");
  }
  return item;
}

function createRandomProps(random: () => number): Record<string, string> {
  const props: Record<string, string> = {};
  for (const name of FUZZ_PROP_NAMES) {
    if (random() < 0.3) {
      props[name] = getRandomItem(random, FUZZ_PROP_VALUES);
    }
  }
  return props;
}

function createRandomView(random: () => number): ElementVNode {
  return createRandomElementVNode(random, FUZZ_MAX_DEPTH);
}

function createRandomElementVNode(
  random: () => number,
  depth: number,
): ElementVNode {
  const childCount =
    depth === 0 ? 0 : Math.floor(random() * (FUZZ_MAX_CHILDREN + 1));
  const children: VNode[] = [];
  for (let index = 0; index < childCount; index++) {
    children.push(createRandomVNode(random, depth - 1));
  }
  return createElementVNode(
    getRandomItem(random, FUZZ_TAGS),
    createRandomProps(random),
    children,
  );
}

function createRandomVNode(random: () => number, depth: number): VNode {
  return random() < 0.4
    ? getRandomItem(random, FUZZ_TEXTS)
    : createRandomElementVNode(random, depth);
}

// 새 View는 이전 View를 조금씩 바꿔 만듭니다. 서로 무관한 두 View는 대부분 REPLACE 하나로 끝나기 때문입니다.
function createChangedView(
  random: () => number,
  view: ElementVNode,
): ElementVNode {
  if (random() < 0.05) {
    return createRandomView(random);
  }
  return createChangedElementVNode(random, view, FUZZ_MAX_DEPTH);
}

function createChangedVNode(
  random: () => number,
  vnode: VNode,
  depth: number,
): VNode {
  const choice = random();
  if (choice < 0.5) {
    return vnode;
  }
  if (choice < 0.6) {
    return createRandomVNode(random, depth);
  }
  if (typeof vnode === "string") {
    return getRandomItem(random, FUZZ_TEXTS);
  }
  return createChangedElementVNode(random, vnode, depth);
}

function createChangedElementVNode(
  random: () => number,
  vnode: ElementVNode,
  depth: number,
): ElementVNode {
  const props = random() < 0.3 ? createRandomProps(random) : vnode.props;
  const children = vnode.children
    .filter(() => random() >= 0.15)
    .map((child) => createChangedVNode(random, child, Math.max(depth - 1, 0)));
  if (depth > 0) {
    while (children.length < FUZZ_MAX_CHILDREN && random() < 0.25) {
      const position = Math.floor(random() * (children.length + 1));
      children.splice(position, 0, createRandomVNode(random, depth - 1));
    }
  }
  return createElementVNode(vnode.type, props, children);
}
