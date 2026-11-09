/// <reference types="vite/client" />
// I-HR 통합 테스트입니다. 검증 페이지를 실제로 시작해 Patch와 이동을 거친 뒤, StateHistory의 현재 View와 두 영역이 같은지 봅니다.
// StateHistory는 페이지 밖으로 나오지 않으므로, 현재 View는 "고치지 않고 Patch를 누르면 아무것도 바뀌지 않는다"로 확인합니다.
import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import { createVNodeFromDom, type VNode } from "../vnode";
import { startVerificationPage } from "./verification-page";

type Page = {
  real: HTMLElement;
  test: HTMLTextAreaElement;
  patchButton: HTMLButtonElement;
  backButton: HTMLButtonElement;
  forwardButton: HTMLButtonElement;
  message: HTMLElement;
};

const A_HTML = '<div id="box"><p class="a">가</p><ul><li>하나</li></ul></div>';
const B_HTML =
  '<div id="box"><p class="b">나</p><ul><li>하나</li><li>둘</li></ul></div>';
const C_HTML =
  '<div id="box" title="c"><p class="b">다</p><ul><li>하나<em>!</em></li></ul></div>';
const D_HTML = '<div id="box"><p class="d">라</p><ul><li>하나</li></ul></div>';

const A_VIEW: VNode = {
  type: "div",
  props: { id: "box" },
  children: [
    { type: "p", props: { class: "a" }, children: ["가"] },
    {
      type: "ul",
      props: {},
      children: [{ type: "li", props: {}, children: ["하나"] }],
    },
  ],
};
const B_VIEW: VNode = {
  type: "div",
  props: { id: "box" },
  children: [
    { type: "p", props: { class: "b" }, children: ["나"] },
    {
      type: "ul",
      props: {},
      children: [
        { type: "li", props: {}, children: ["하나"] },
        { type: "li", props: {}, children: ["둘"] },
      ],
    },
  ],
};
const C_VIEW: VNode = {
  type: "div",
  props: { id: "box", title: "c" },
  children: [
    { type: "p", props: { class: "b" }, children: ["다"] },
    {
      type: "ul",
      props: {},
      children: [
        {
          type: "li",
          props: {},
          children: ["하나", { type: "em", props: {}, children: ["!"] }],
        },
      ],
    },
  ],
};

const D_VIEW: VNode = {
  type: "div",
  props: { id: "box" },
  children: [
    { type: "p", props: { class: "d" }, children: ["라"] },
    {
      type: "ul",
      props: {},
      children: [{ type: "li", props: {}, children: ["하나"] }],
    },
  ],
};

// index.html의 샘플 View입니다. verification-page.test.ts의 INITIAL_VIEW와 같습니다.
const INITIAL_VIEW: VNode = {
  type: "section",
  props: { class: "sample" },
  children: [
    "\n",
    { type: "h3", props: {}, children: ["할 일"] },
    "\n",
    {
      type: "p",
      props: {},
      children: [
        "오늘 할 일을 ",
        { type: "strong", props: {}, children: ["세 개"] },
        " 적었습니다.",
      ],
    },
    "\n",
    {
      type: "ul",
      props: {},
      children: [
        "\n",
        { type: "li", props: {}, children: ["장보기"] },
        "\n",
        { type: "li", props: {}, children: ["운동"] },
        "\n",
        { type: "li", props: {}, children: ["책 읽기"] },
        "\n",
      ],
    },
    "\n",
    {
      type: "label",
      props: {},
      children: [
        "메모 ",
        {
          type: "input",
          props: { type: "text", value: "첫 메모" },
          children: [],
        },
      ],
    },
    "\n",
  ],
};

function createPageFromIndexHtml(): Page {
  applyIndexHtmlToBody();
  startVerificationPage(document);
  return createPageFromBody();
}

function applyIndexHtmlToBody(): void {
  const indexDocument = new DOMParser().parseFromString(indexHtml, "text/html");
  // innerHTML로 넣은 script는 실행되지 않으므로, main.ts가 함께 돌지 않습니다.
  document.body.innerHTML = indexDocument.body.innerHTML;
}

function createPageFromBody(): Page {
  return {
    real: getPageElement("#real", HTMLElement),
    test: getPageElement("#test", HTMLTextAreaElement),
    patchButton: getPageElement("#patch", HTMLButtonElement),
    backButton: getPageElement("#back", HTMLButtonElement),
    forwardButton: getPageElement("#forward", HTMLButtonElement),
    message: getPageElement("#message", HTMLElement),
  };
}

function getPageElement<T extends Element>(
  selector: string,
  elementType: new () => T,
): T {
  const element = document.querySelector(selector);
  if (!(element instanceof elementType)) {
    throw new Error(`Page has no ${selector}`);
  }
  return element;
}

function applyHtmlWithPatchButton(page: Page, html: string): void {
  page.test.value = html;
  page.test.dispatchEvent(new Event("input", { bubbles: true }));
  page.patchButton.click();
}

function getRealViewElement(page: Page): Element {
  const viewElement = page.real.firstElementChild;
  if (viewElement === null) {
    throw new Error("#real has no View element");
  }
  return viewElement;
}

function createViewFromHtml(html: string): VNode {
  const template = document.createElement("template");
  template.innerHTML = html;
  const viewElement = template.content.firstElementChild;
  if (viewElement === null) {
    throw new Error(`HTML has no element: ${html}`);
  }
  return createVNodeFromDom(viewElement);
}

function createMutationRecordsWhile(
  page: Page,
  action: () => void,
): MutationRecord[] {
  const observer = new MutationObserver(() => {});
  observer.observe(page.real, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
  action();
  const records = observer.takeRecords();
  observer.disconnect();
  return records;
}

function createDisabledStatesFromButtons(page: Page): {
  backDisabled: boolean;
  forwardDisabled: boolean;
} {
  return {
    backDisabled: page.backButton.disabled,
    forwardDisabled: page.forwardButton.disabled,
  };
}

// 두 영역이 view를 보여 주고, StateHistory의 현재 View도 view인지 확인합니다.
// 현재 View가 다르면 고치지 않은 테스트 영역으로 Patch를 눌렀을 때 실제 영역이 바뀌거나 이력이 늘어납니다.
function expectPageToShowView(page: Page, view: VNode): void {
  expect(page.real.childNodes).toHaveLength(1);
  expect(createVNodeFromDom(getRealViewElement(page))).toEqual(view);
  expect(createViewFromHtml(page.test.value)).toEqual(view);

  const buttonStates = createDisabledStatesFromButtons(page);
  const records = createMutationRecordsWhile(page, () => {
    page.patchButton.click();
  });
  expect(records).toHaveLength(0);
  expect(createDisabledStatesFromButtons(page)).toEqual(buttonStates);
}

function countBackStepsToStart(page: Page): number {
  let steps = 0;
  while (!page.backButton.disabled) {
    page.backButton.click();
    steps += 1;
  }
  return steps;
}

describe("I-HR History와 화면 복원", () => {
  it("HR-N01 처음 View를 한 번 저장하고, 첫 Patch 뒤 한 번 뒤로 가면 처음 View로 돌아옵니다", () => {
    const page = createPageFromIndexHtml();
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: true,
      forwardDisabled: true,
    });

    applyHtmlWithPatchButton(page, A_HTML);
    expectPageToShowView(page, A_VIEW);
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: false,
      forwardDisabled: true,
    });

    page.backButton.click();
    expectPageToShowView(page, INITIAL_VIEW);
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: true,
      forwardDisabled: false,
    });

    page.forwardButton.click();
    expectPageToShowView(page, A_VIEW);
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: false,
      forwardDisabled: true,
    });
  });

  it("HR-N02 A, B, C 사이를 두 번 오가도 두 영역과 현재 View가 같고 이력이 늘지 않습니다", () => {
    const page = createPageFromIndexHtml();
    applyHtmlWithPatchButton(page, A_HTML);
    applyHtmlWithPatchButton(page, B_HTML);
    applyHtmlWithPatchButton(page, C_HTML);
    expectPageToShowView(page, C_VIEW);

    for (let round = 0; round < 2; round++) {
      page.backButton.click();
      expectPageToShowView(page, B_VIEW);
      page.backButton.click();
      expectPageToShowView(page, A_VIEW);
      page.forwardButton.click();
      expectPageToShowView(page, B_VIEW);
      page.forwardButton.click();
      expectPageToShowView(page, C_VIEW);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });
    }

    // 처음 샘플, A, B, C의 네 View이므로 처음까지 세 번 뒤로 갑니다.
    expect(countBackStepsToStart(page)).toBe(3);
    expectPageToShowView(page, INITIAL_VIEW);
  });

  it("HR-N03 입력칸의 현재 값은 value 속성이 아니라 .value로 저장되고 복원됩니다", () => {
    const page = createPageFromIndexHtml();
    applyHtmlWithPatchButton(
      page,
      '<form><input type="text" value="typed"></form>',
    );
    applyHtmlWithPatchButton(page, '<form><input type="text" value=""></form>');
    const input = getRealViewElement(page).querySelector("input");
    if (input === null) {
      throw new Error("#real has no input");
    }
    // Patch는 .value만 바꾸므로 value 속성은 처음 값으로 남습니다.
    expect(input.getAttribute("value")).toBe("typed");
    expect(input.value).toBe("");

    page.backButton.click();
    expect(getRealViewElement(page).querySelector("input")).toBe(input);
    expect(input.value).toBe("typed");
    expectPageToShowView(page, {
      type: "form",
      props: {},
      children: [
        {
          type: "input",
          props: { type: "text", value: "typed" },
          children: [],
        },
      ],
    });

    page.forwardButton.click();
    expect(input.value).toBe("");
    expectPageToShowView(page, {
      type: "form",
      props: {},
      children: [
        { type: "input", props: { type: "text", value: "" }, children: [] },
      ],
    });
  });

  it("HR-N04 FLOW-N03 B로 돌아가 D를 Patch하면 이력은 처음, A, B, D이고 C로 갈 수 없습니다", () => {
    const page = createPageFromIndexHtml();
    applyHtmlWithPatchButton(page, A_HTML);
    applyHtmlWithPatchButton(page, B_HTML);
    applyHtmlWithPatchButton(page, C_HTML);
    page.backButton.click();
    applyHtmlWithPatchButton(page, D_HTML);
    expectPageToShowView(page, D_VIEW);
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: false,
      forwardDisabled: true,
    });

    page.forwardButton.click();
    expectPageToShowView(page, D_VIEW);

    page.backButton.click();
    expectPageToShowView(page, B_VIEW);
    page.backButton.click();
    expectPageToShowView(page, A_VIEW);
    page.forwardButton.click();
    expectPageToShowView(page, B_VIEW);
    page.forwardButton.click();
    expectPageToShowView(page, D_VIEW);
    expect(createDisabledStatesFromButtons(page)).toEqual({
      backDisabled: false,
      forwardDisabled: true,
    });
    expect(countBackStepsToStart(page)).toBe(3);
  });

  describe("HR-N05 바뀌지 않거나 거절된 입력은 이력을 바꾸지 않습니다", () => {
    it("HR-N05a 처음 상태에서 고치지 않고 Patch하면 이력이 늘지 않습니다", () => {
      const page = createPageFromIndexHtml();
      page.patchButton.click();
      page.patchButton.click();
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });
    });

    it("HR-N05b 과거 위치에서 빈 입력과 최상위 둘을 거절하면 현재 View, 앞쪽 기록, 실제 영역이 모두 남습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();

      for (const rejectedHtml of ["", "<p>a</p><p>b</p>"]) {
        const records = createMutationRecordsWhile(page, () => {
          applyHtmlWithPatchButton(page, rejectedHtml);
        });
        expect(records).toHaveLength(0);
        expect(page.message.textContent).toBe("최상위 노드가 하나 필요합니다");
        expect(createVNodeFromDom(getRealViewElement(page))).toEqual(B_VIEW);
        expect(createDisabledStatesFromButtons(page)).toEqual({
          backDisabled: false,
          forwardDisabled: false,
        });
      }

      page.forwardButton.click();
      expectPageToShowView(page, C_VIEW);
      page.backButton.click();
      expectPageToShowView(page, B_VIEW);
      page.backButton.click();
      expectPageToShowView(page, A_VIEW);
      expect(page.message.textContent).toBe("");
    });
  });

  describe("DEC-09 과거 위치에서 바뀐 것이 없는 Patch는 앞쪽 기록을 남깁니다", () => {
    it("DEC-09a 그대로 Patch하면 실제 영역이 바뀌지 않고 앞으로 C에 갈 수 있습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();

      const records = createMutationRecordsWhile(page, () => {
        page.patchButton.click();
      });
      expect(records).toHaveLength(0);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: false,
      });
      page.forwardButton.click();
      expectPageToShowView(page, C_VIEW);
    });

    it("DEC-09b 주석만 더해 View가 같으면 바뀐 것이 없는 Patch로 봅니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();

      const records = createMutationRecordsWhile(page, () => {
        applyHtmlWithPatchButton(
          page,
          B_HTML.replace("<ul>", "<!-- 메모 --><ul>"),
        );
      });
      expect(records).toHaveLength(0);
      page.forwardButton.click();
      expectPageToShowView(page, C_VIEW);
    });
  });

  describe("DEC-10 HR-N06 FLOW-N02 Patch하지 않은 편집은 이동할 때 버립니다", () => {
    it("HR-N06a 뒤로가기는 편집 X를 버리고 두 영역을 A로 바꿉니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      page.test.value = '<div id="x">X</div>';

      page.backButton.click();
      expectPageToShowView(page, A_VIEW);
      page.forwardButton.click();
      expectPageToShowView(page, B_VIEW);
    });

    it("HR-N06b 앞으로가기는 편집 X를 버리고 두 영역을 C로 바꿉니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      page.test.value = '<div id="x">X</div>';

      page.forwardButton.click();
      expectPageToShowView(page, C_VIEW);
      expect(page.real.querySelector("#x")).toBeNull();
    });

    it("FLOW-N02 저장한 B는 뒤의 편집과 새 Patch로 바뀌지 않습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, A_HTML);
      applyHtmlWithPatchButton(page, B_HTML);
      page.test.value = C_HTML;
      page.backButton.click();
      expectPageToShowView(page, A_VIEW);
      page.forwardButton.click();
      expectPageToShowView(page, B_VIEW);

      applyHtmlWithPatchButton(page, D_HTML);
      page.backButton.click();
      expectPageToShowView(page, B_VIEW);
    });
  });

  // 저장한 View를 테스트 영역의 HTML로 바꿨다가 다시 읽으면 주석은 사라지고 붙은 글자는 하나로 합쳐집니다.
  describe("HR-N07 HTML로 오가도 모양이 같은 View를 저장합니다", () => {
    for (const between of [
      "<!--x-->",
      "<script>1</script>",
      "<iframe></iframe>",
    ]) {
      it(`HR-N07 글자 사이의 ${between}를 지운 View로 돌아가 그대로 Patch하면 이력이 늘지 않습니다`, () => {
        const page = createPageFromIndexHtml();
        applyHtmlWithPatchButton(page, "<p>x</p>");
        applyHtmlWithPatchButton(page, `<p>a${between}b</p>`);
        applyHtmlWithPatchButton(page, "<p>z</p>");
        page.backButton.click();

        expect(page.real.innerHTML).toBe("<p>ab</p>");
        expectPageToShowView(page, { type: "p", props: {}, children: ["ab"] });
        expect(createDisabledStatesFromButtons(page)).toEqual({
          backDisabled: false,
          forwardDisabled: false,
        });
      });
    }

    it("HR-N08 처음 실제 영역의 주석도 지우고 글자를 합친 뒤 처음 View로 저장합니다", () => {
      applyIndexHtmlToBody();
      const heading = document.querySelector("#real h3");
      if (heading === null) {
        throw new Error("Sample has no h3");
      }
      heading.replaceChildren("할 ", document.createComment("x"), "일");
      startVerificationPage(document);
      const page = createPageFromBody();

      expect(page.real.querySelector("h3")?.childNodes).toHaveLength(1);
      expectPageToShowView(page, INITIAL_VIEW);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });
    });
  });
});
