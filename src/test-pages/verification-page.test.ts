/// <reference types="vite/client" />
// 검증 페이지(Lark 70~92행)를 jsdom에서 확인합니다. 실제 브라우저 확인은 따로 합니다.
// 페이지는 index.html과 같은 마크업에서 startVerificationPage로 시작하고, 버튼은 click 이벤트로 누릅니다.
import { afterEach, describe, expect, it, vi } from "vitest";
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
  patchLog: HTMLElement;
};

const INITIAL_HTML =
  '<section class="sample">\n' +
  "<h3>할 일</h3>\n" +
  "<p>오늘 할 일을 <strong>세 개</strong> 적었습니다.</p>\n" +
  "<ul>\n<li>장보기</li>\n<li>운동</li>\n<li>책 읽기</li>\n</ul>\n" +
  '<label>메모 <input type="text" value="첫 메모"></label>\n' +
  "</section>";

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

// 처음 샘플에서 한 곳씩만 다른 HTML입니다.
const B_HTML = INITIAL_HTML.replace("<li>운동</li>", "<li>산책</li>");
const C_HTML = B_HTML.replace("<p>", '<p class="done">');
const D_HTML = INITIAL_HTML.replace("<li>책 읽기</li>", "<li>청소</li>");

function createPageFromIndexHtml(): Page {
  const indexDocument = new DOMParser().parseFromString(indexHtml, "text/html");
  // innerHTML로 넣은 script는 실행되지 않으므로, main.ts가 함께 돌지 않습니다.
  document.body.innerHTML = indexDocument.body.innerHTML;
  startVerificationPage(document);
  return {
    real: getPageElement("#real", HTMLElement),
    test: getPageElement("#test", HTMLTextAreaElement),
    patchButton: getPageElement("#patch", HTMLButtonElement),
    backButton: getPageElement("#back", HTMLButtonElement),
    forwardButton: getPageElement("#forward", HTMLButtonElement),
    message: getPageElement("#message", HTMLElement),
    patchLog: getPageElement("#patch-log", HTMLElement),
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

function applyHtmlToTestArea(page: Page, html: string): void {
  page.test.value = html;
  page.test.dispatchEvent(new Event("input", { bubbles: true }));
}

function applyHtmlWithPatchButton(page: Page, html: string): void {
  applyHtmlToTestArea(page, html);
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

function expectAreasToShow(page: Page, html: string): void {
  expect(page.real.innerHTML).toBe(html);
  expect(page.test.value).toBe(html);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("검증 페이지", () => {
  describe("F-INIT 처음 표시", () => {
    it("V70 verify-layout 실제 영역, 테스트 영역, 세 버튼, 안내, Patch 목록이 있습니다", () => {
      const page = createPageFromIndexHtml();
      expect(page.real.tagName).toBe("DIV");
      expect(page.test.tagName).toBe("TEXTAREA");
      expect(page.patchButton.textContent).toBe("Patch");
      expect(page.backButton.textContent).toBe("뒤로가기");
      expect(page.forwardButton.textContent).toBe("앞으로가기");
      expect(page.message.textContent).toBe("");
      expect(page.patchLog.children).toHaveLength(0);
    });

    it("V71 verify-load 처음 두 영역은 같은 샘플 View를 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      expect(page.test.value).toBe(INITIAL_HTML);
      expect(createViewFromHtml(page.test.value)).toEqual(INITIAL_VIEW);
      expect(createVNodeFromDom(getRealViewElement(page))).toEqual(
        INITIAL_VIEW,
      );
    });

    it("V71a 실제 영역에는 View 요소 하나만 남고 앞뒤 공백은 지워집니다", () => {
      const page = createPageFromIndexHtml();
      expect(page.real.childNodes).toHaveLength(1);
      expect(page.real.firstChild).toBe(getRealViewElement(page));
      expect(page.real.innerHTML).toBe(INITIAL_HTML);
    });

    it("V72 verify-load-buttons 처음에는 뒤로가기와 앞으로가기가 꺼져 있습니다", () => {
      const page = createPageFromIndexHtml();
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });
    });

    it("V73 PAGE-N01 verify-edit-no-apply 테스트 영역만 고치면 실제 영역은 바뀌지 않습니다", () => {
      const page = createPageFromIndexHtml();
      const records = createMutationRecordsWhile(page, () => {
        applyHtmlToTestArea(page, B_HTML);
      });
      expect(records).toHaveLength(0);
      expect(page.real.innerHTML).toBe(INITIAL_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });
    });

    it("V73a PAGE-N01 실제 영역을 직접 바꿔도 테스트 영역은 바뀌지 않습니다", () => {
      const page = createPageFromIndexHtml();
      const heading = getRealViewElement(page).querySelector("h3");
      if (heading === null) {
        throw new Error("Sample has no h3");
      }
      heading.textContent = "바뀐 제목";
      expect(page.test.value).toBe(INITIAL_HTML);
    });
  });

  describe("F-PATCH Patch 버튼", () => {
    it("V74 verify-patch-apply 글자를 고치고 Patch를 누르면 실제 영역에 보입니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      expect(page.real.innerHTML).toBe(B_HTML);
      expect(page.real.querySelectorAll("li")[1]?.textContent).toBe("산책");
      expect(page.message.textContent).toBe("");
    });

    it("V75 verify-patch-partial 한 곳만 고치면 그 글자 노드만 바뀌고 요소는 같은 요소로 남습니다", () => {
      const page = createPageFromIndexHtml();
      const elementsBefore = [...page.real.querySelectorAll("*")];
      const changedText = page.real.querySelectorAll("li")[1]?.firstChild;
      const records = createMutationRecordsWhile(page, () => {
        applyHtmlWithPatchButton(page, B_HTML);
      });
      expect(records).toHaveLength(1);
      expect(records[0]?.type).toBe("characterData");
      expect(records[0]?.target).toBe(changedText);
      const elementsAfter = [...page.real.querySelectorAll("*")];
      expect(elementsAfter).toHaveLength(elementsBefore.length);
      elementsBefore.forEach((element, index) => {
        expect(elementsAfter[index]).toBe(element);
      });
    });

    it("V76 verify-patch-history Patch 뒤에는 뒤로가기만 켜집니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });
    });

    it("V77 verify-attr-edit class를 바꾸고 style을 더하면 그 요소에만 적용됩니다", () => {
      const page = createPageFromIndexHtml();
      const paragraph = page.real.querySelector("p");
      applyHtmlWithPatchButton(
        page,
        INITIAL_HTML.replace("<p>", '<p class="note" style="color: red;">'),
      );
      expect(page.real.querySelector("p")).toBe(paragraph);
      expect(paragraph?.getAttribute("class")).toBe("note");
      expect(paragraph?.getAttribute("style")).toBe("color: red;");
      // 샘플의 section은 처음부터 class="sample"을 가집니다.
      const styledElements = [
        ...page.real.querySelectorAll("[class], [style]"),
      ];
      expect(styledElements).toEqual([getRealViewElement(page), paragraph]);
    });

    it("V78 verify-delete-node 마지막 항목을 지우면 그 항목만 사라집니다", () => {
      const page = createPageFromIndexHtml();
      const [first, second, third] = [...page.real.querySelectorAll("li")];
      applyHtmlWithPatchButton(
        page,
        INITIAL_HTML.replace("<li>책 읽기</li>\n", ""),
      );
      expect(page.real.querySelector("ul")?.innerHTML).toBe(
        "\n<li>장보기</li>\n<li>운동</li>\n",
      );
      const items = [...page.real.querySelectorAll("li")];
      expect(items).toHaveLength(2);
      expect(items[0]).toBe(first);
      expect(items[1]).toBe(second);
      expect(third?.parentNode).toBeNull();
    });

    it("V79 PAGE-N04 verify-many-tags 표, 목록, 입력칸, 링크, 이미지, 겹친 div가 같은 구조로 나타납니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(
        page,
        '<div class="tags">' +
          "<table><tr><td>1</td><td>2</td></tr></table>" +
          "<ul><li>가</li><li>나</li></ul>" +
          '<input type="text" value="입력">' +
          '<a href="https://example.com/">링크</a>' +
          '<img src="image.png" alt="그림">' +
          "<div><div><div>깊은 글자</div></div></div>" +
          "</div>",
      );
      // 표 안의 tbody는 HTML 파서가 넣은 것입니다.
      expect(page.real.innerHTML).toBe(
        '<div class="tags">' +
          "<table><tbody><tr><td>1</td><td>2</td></tr></tbody></table>" +
          "<ul><li>가</li><li>나</li></ul>" +
          '<input type="text" value="입력">' +
          '<a href="https://example.com/">링크</a>' +
          '<img src="image.png" alt="그림">' +
          "<div><div><div>깊은 글자</div></div></div>" +
          "</div>",
      );
      expect(page.real.querySelector("input")?.value).toBe("입력");
    });

    it("V80 PAGE-N02 verify-patch-nochange 그대로 Patch하면 DOM 변경이 없고 이력도 쌓이지 않습니다", () => {
      const page = createPageFromIndexHtml();
      const records = createMutationRecordsWhile(page, () => {
        page.patchButton.click();
        page.patchButton.click();
        page.patchButton.click();
      });
      expect(records).toHaveLength(0);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });

      applyHtmlWithPatchButton(page, B_HTML);
      page.backButton.click();
      expectAreasToShow(page, INITIAL_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: false,
      });
    });

    it("V85 verify-empty-input 빈 입력은 반영하지 않고 안내를 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      for (const html of ["", " \n\t"]) {
        const records = createMutationRecordsWhile(page, () => {
          applyHtmlWithPatchButton(page, html);
        });
        expect(records).toHaveLength(0);
        expect(page.message.textContent).toBe("최상위 노드가 하나 필요합니다");
        expect(page.real.innerHTML).toBe(B_HTML);
        expect(createDisabledStatesFromButtons(page)).toEqual({
          backDisabled: false,
          forwardDisabled: true,
        });
      }
      page.backButton.click();
      expectAreasToShow(page, INITIAL_HTML);
    });

    it("V86 verify-multi-top 최상위 요소가 둘이면 반영하지 않고 안내를 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      const records = createMutationRecordsWhile(page, () => {
        applyHtmlWithPatchButton(page, "<p>a</p><p>b</p>");
      });
      expect(records).toHaveLength(0);
      expect(page.message.textContent).toBe("최상위 노드가 하나 필요합니다");
      expect(page.real.innerHTML).toBe(INITIAL_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });
    });

    it("V86a 최상위가 글자뿐이거나 요소 옆에 글자가 있으면 거절합니다", () => {
      const page = createPageFromIndexHtml();
      for (const html of ["글자만", "글자<p>a</p>"]) {
        applyHtmlWithPatchButton(page, html);
        expect(page.message.textContent).toBe("최상위 노드가 하나 필요합니다");
        expect(page.real.innerHTML).toBe(INITIAL_HTML);
      }
    });

    it("V86b 최상위의 공백과 주석은 세지 않습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, "\n<!-- 메모 -->\n<p>a</p>\n");
      expect(page.message.textContent).toBe("");
      expect(page.real.innerHTML).toBe("<p>a</p>");
    });

    it("V86c 거절 뒤에 올바른 입력을 Patch하면 안내가 지워집니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, "");
      applyHtmlWithPatchButton(page, B_HTML);
      expect(page.message.textContent).toBe("");
      expect(page.real.innerHTML).toBe(B_HTML);
    });

    it("V87 verify-invalid-html 닫히지 않은 태그는 브라우저가 고친 구조대로 반영됩니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, "<div><p>abc</div>");
      expect(page.message.textContent).toBe("");
      expect(page.real.innerHTML).toBe("<div><p>abc</p></div>");
    });

    it("V88 verify-no-script-exec 입력의 스크립트는 실행되지 않고 실제 영역에 script와 on 속성이 없습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(
        page,
        "<div>" +
          "<script>document.body.dataset.scriptRan = 'script';</script>" +
          '<img src="x" onerror="document.body.dataset.scriptRan = \'onerror\'">' +
          "<p onclick=\"document.body.dataset.scriptRan = 'onclick'\">글자</p>" +
          "</div>",
      );
      expect(page.real.innerHTML).toBe('<div><img src="x"><p>글자</p></div>');
      expect(page.real.querySelector("script")).toBeNull();
      expect(page.real.querySelector("[onerror]")).toBeNull();
      page.real.querySelector("p")?.click();
      expect(document.body.dataset.scriptRan).toBeUndefined();

      // 대조: 이 jsdom은 문서에 넣은 script를 실행합니다. 위 검사가 늘 통과하는 검사가 아님을 보입니다.
      // script는 jsdom의 window에서 돌고 Vitest의 globalThis와 다르므로, 표식은 문서에 남깁니다.
      const controlScript = document.createElement("script");
      controlScript.textContent =
        "document.body.dataset.scriptRan = 'control';";
      document.body.append(controlScript);
      expect(document.body.dataset.scriptRan).toBe("control");
      delete document.body.dataset.scriptRan;
    });

    it("V88a 다른 문서를 열거나 페이지를 옮기는 요소와 javascript: URL과 srcdoc을 지웁니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(
        page,
        "<div>" +
          '<a href=" java\tscript:alert(1)">링크</a>' +
          '<a href="/safe">안전</a>' +
          '<iframe srcdoc="<script>parent.alert(1)</script>"></iframe>' +
          '<object data="x"></object><embed src="x">' +
          '<form action="JavaScript:alert(1)"><button>전송</button></form>' +
          '<meta http-equiv="refresh" content="0;url=https://example.com/">' +
          '<base href="https://example.com/">' +
          '<link rel="stylesheet" href="https://example.com/x.css">' +
          "</div>",
      );
      expect(page.real.innerHTML).toBe(
        '<div><a>링크</a><a href="/safe">안전</a><form><button>전송</button></form></div>',
      );
    });

    it("V88b 값 중간에 든 javascript: URL도 지웁니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(
        page,
        '<div><svg><a><animate attributeName="href" values="x;javascript:alert(1)"></animate><text>t</text></a></svg></div>',
      );
      expect(page.real.querySelector("animate")?.hasAttribute("values")).toBe(
        false,
      );
    });

    it("V89 FLOW-N05 verify-rapid-click 정해진 빠른 조작 뒤에 오류가 없고 두 영역이 D로 끝납니다", () => {
      const page = createPageFromIndexHtml();
      const consoleError = vi.spyOn(console, "error");
      const pageErrors: unknown[] = [];
      const recordError = (event: ErrorEvent) => {
        pageErrors.push(event.error);
      };
      window.addEventListener("error", recordError);

      applyHtmlWithPatchButton(page, B_HTML);
      page.backButton.click();
      page.forwardButton.click();
      page.backButton.click();
      applyHtmlWithPatchButton(page, D_HTML);
      page.forwardButton.click();

      window.removeEventListener("error", recordError);
      expect(consoleError).not.toHaveBeenCalled();
      expect(pageErrors).toEqual([]);
      expectAreasToShow(page, D_HTML);
      expect(createVNodeFromDom(getRealViewElement(page))).toEqual(
        createViewFromHtml(page.test.value),
      );
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });
    });

    it("V91 verify-patch-log 이번에 적용한 Patch의 종류와 path를 목록에 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["TEXT [5, 3, 0]"]);
      applyHtmlWithPatchButton(page, C_HTML);
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["PROPS [3]"]);
    });

    it("V91a 뒤로가기와 앞으로가기도 적용한 Patch를 목록에 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      expect(page.patchLog.previousElementSibling?.textContent).toBe(
        "마지막으로 적용한 Patch",
      );
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["PROPS [3]"]);
      page.backButton.click();
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["TEXT [5, 3, 0]"]);
      page.forwardButton.click();
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["TEXT [5, 3, 0]"]);

      // 고치지 않고 Patch하면 적용한 Patch가 없으므로 목록이 빕니다.
      page.patchButton.click();
      expect(page.patchLog.children).toHaveLength(0);
    });

    it("V93 Patch를 적용하다 실패하면 실제 영역을 현재 View로 다시 만들고 오류를 보여 주며 이력을 늘리지 않습니다", () => {
      const page = createPageFromIndexHtml();
      // HTML 파서는 =a라는 속성 이름을 받지만 setAttribute는 거절합니다.
      // h3의 TEXT를 적용한 뒤 p의 PROPS에서 실패하므로, 실제 영역은 반쯤 바뀐 채로 남습니다.
      const failingHtml = INITIAL_HTML.replace(
        "<h3>할 일</h3>",
        "<h3>새 일</h3>",
      ).replace("<p>", '<p =a="1">');
      applyHtmlWithPatchButton(page, failingHtml);

      expect(page.real.innerHTML).toBe(INITIAL_HTML);
      expect(page.message.textContent).toContain("=a");
      expect(page.test.value).toBe(failingHtml);
      expect(page.patchLog.children).toHaveLength(0);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: true,
      });

      applyHtmlWithPatchButton(page, B_HTML);
      expect(page.message.textContent).toBe("");
      expect(page.real.innerHTML).toBe(B_HTML);
      page.backButton.click();
      expectAreasToShow(page, INITIAL_HTML);
    });

    it.todo(
      "V92 verify-highlight 바뀐 요소를 잠시 강조합니다. 선택 사례이며 구현하지 않았습니다. 강조 속성이 실제 영역을 바꾸면 V75의 MutationObserver 검사에서 뺄 규칙도 함께 정해야 합니다",
    );
  });

  describe("F-NAV 뒤로가기와 앞으로가기", () => {
    it("V81 verify-back Patch 두 번 뒤 뒤로가기는 두 영역을 첫 Patch 직후로 돌립니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      expectAreasToShow(page, B_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: false,
      });
    });

    it("V82 verify-forward 앞으로가기는 두 영역을 두 번째 Patch 직후로 돌리고 앞으로가기를 끕니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      page.forwardButton.click();
      expectAreasToShow(page, C_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });
    });

    it("V83 verify-back-to-start 끝까지 뒤로 가면 처음 상태가 되고 뒤로가기가 꺼집니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      applyHtmlWithPatchButton(page, D_HTML);
      page.backButton.click();
      page.backButton.click();
      page.backButton.click();
      expectAreasToShow(page, INITIAL_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: false,
      });

      const records = createMutationRecordsWhile(page, () => {
        page.backButton.click();
      });
      expect(records).toHaveLength(0);
      expectAreasToShow(page, INITIAL_HTML);
    });

    it("V84 verify-back-then-patch 뒤로 간 뒤 새로 Patch하면 앞쪽 기록이 사라집니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      applyHtmlWithPatchButton(page, C_HTML);
      page.backButton.click();
      applyHtmlWithPatchButton(page, D_HTML);
      expect(page.real.innerHTML).toBe(D_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });
    });

    it("V90 verify-back-partial 뒤로가기도 다른 글자 노드만 바꿉니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      const elementsBefore = [...page.real.querySelectorAll("*")];
      const changedText = page.real.querySelectorAll("li")[1]?.firstChild;
      const records = createMutationRecordsWhile(page, () => {
        page.backButton.click();
      });
      expect(records).toHaveLength(1);
      expect(records[0]?.target).toBe(changedText);
      const elementsAfter = [...page.real.querySelectorAll("*")];
      elementsBefore.forEach((element, index) => {
        expect(elementsAfter[index]).toBe(element);
      });
      expect(page.real.innerHTML).toBe(INITIAL_HTML);
    });

    it("V94 이동 중 Patch가 실패하면 실제 영역을 옮겨 간 View로 다시 만들고 오류를 보여 줍니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);

      // 개발자 도구로 실제 영역을 고친 경우입니다. View 앞에 글자가 생기면 path []가 그 글자를 가리킵니다(ADR 0006).
      page.real.prepend(" ");
      page.backButton.click();
      expect(page.real.childNodes).toHaveLength(1);
      expectAreasToShow(page, INITIAL_HTML);
      expect(page.message.textContent).toBe(
        "Error: Patch path [5, 3, 0] has no node",
      );
      expect(page.patchLog.children).toHaveLength(0);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: false,
      });

      // View 요소가 없으면 읽는 단계에서 실패합니다.
      page.real.replaceChildren();
      page.forwardButton.click();
      expect(page.real.childNodes).toHaveLength(1);
      expectAreasToShow(page, B_HTML);
      expect(page.message.textContent).toBe(
        "Error: #real needs exactly one View element",
      );
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });

      const records = createMutationRecordsWhile(page, () => {
        page.patchButton.click();
      });
      expect(records).toHaveLength(0);
      expect(page.message.textContent).toBe("");
    });
  });

  describe("DEC-15 Patch는 실제 영역을 다시 읽어 비교합니다", () => {
    it("V95 실제 영역의 입력칸에 친 값은 다음 Patch에서 테스트 영역의 값으로 바뀝니다", () => {
      const page = createPageFromIndexHtml();
      const input = page.real.querySelector("input");
      if (input === null) {
        throw new Error("Sample has no input");
      }
      input.value = "직접 친 값";

      applyHtmlWithPatchButton(page, B_HTML);
      expect(page.real.querySelector("input")).toBe(input);
      expect(input.value).toBe("첫 메모");
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["TEXT [5, 3, 0]", "PROPS [7, 1]"]);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: false,
        forwardDisabled: true,
      });

      page.backButton.click();
      expectAreasToShow(page, INITIAL_HTML);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: false,
      });
    });

    it("V95a 실제 영역의 입력칸만 다르면 입력칸을 되돌리고 이력은 늘리지 않습니다", () => {
      const page = createPageFromIndexHtml();
      applyHtmlWithPatchButton(page, B_HTML);
      page.backButton.click();
      const input = page.real.querySelector("input");
      if (input === null) {
        throw new Error("Sample has no input");
      }
      input.value = "직접 친 값";

      page.patchButton.click();
      expect(input.value).toBe("첫 메모");
      expect(
        [...page.patchLog.children].map((item) => item.textContent),
      ).toEqual(["PROPS [7, 1]"]);
      expect(createDisabledStatesFromButtons(page)).toEqual({
        backDisabled: true,
        forwardDisabled: false,
      });
      page.forwardButton.click();
      expectAreasToShow(page, B_HTML);
    });
  });

  describe("FLOW-N01 섞인 변경의 전체 흐름", () => {
    const MixedBHtml =
      '<section class="sample">\n' +
      "<h3>할 일</h3>\n" +
      '<p class="note">오늘 할 일을 <em>두 개</em> 적었습니다.</p>\n' +
      "<ul>\n<li>장보기</li>\n<li>산책</li>\n</ul>\n" +
      '<label>메모 <input type="text" value="첫 메모"></label>\n' +
      "<footer>끝</footer>\n" +
      "</section>";
    const MixedCHtml =
      '<section class="sample">\n' +
      "<h3>할 일</h3>\n" +
      '<p class="note done">오늘 할 일을 <em>한 개</em> 적었습니다.</p>\n' +
      "<ul>\n<li>장보기</li>\n<li>수영</li>\n</ul>\n" +
      '<label>메모 <input type="text" value="첫 메모"></label>\n' +
      "<footer>정말 끝</footer>\n" +
      "</section>";

    it("FLOW-N01 글자, 속성, 추가, 삭제, 태그 교체를 한 번에 Patch하고 다시 고친 뒤 앞뒤로 이동합니다", () => {
      const page = createPageFromIndexHtml();
      const heading = page.real.querySelector("h3");

      applyHtmlWithPatchButton(page, MixedBHtml);
      expect(page.real.innerHTML).toBe(MixedBHtml);
      expect(page.real.querySelector("h3")).toBe(heading);

      applyHtmlWithPatchButton(page, MixedCHtml);
      expect(page.real.innerHTML).toBe(MixedCHtml);
      expect(page.real.querySelector("h3")).toBe(heading);

      page.backButton.click();
      expectAreasToShow(page, MixedBHtml);
      page.forwardButton.click();
      expectAreasToShow(page, MixedCHtml);
      expect(page.real.querySelector("h3")).toBe(heading);
    });
  });
});
