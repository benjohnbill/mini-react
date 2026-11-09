// 사용자가 친 HTML은 실제 영역에 넣기 전에 정제하고, 실제 영역과 이력이 어긋나면 실제 영역을 다시 만듭니다.
import { diffViews } from "../diff";
import { StateHistory } from "../history";
import { applyPatchesToDom, type Patch } from "../patch";
import { createDomFromVNode, createVNodeFromDom, type VNode } from "../vnode";

const ROOT_REQUIRED_MESSAGE = "최상위 노드가 하나 필요합니다";

// HTML의 공백 문자입니다. trim()은 &nbsp;도 지우므로 쓰지 않습니다.
const HTML_WHITESPACE_ONLY = /^[\t\n\f\r ]*$/;

type PageElements = {
  real: HTMLElement;
  test: HTMLTextAreaElement;
  patchButton: HTMLButtonElement;
  backButton: HTMLButtonElement;
  forwardButton: HTMLButtonElement;
  message: HTMLElement;
  patchLog: HTMLElement;
};

export function startVerificationPage(page: ParentNode): void {
  const elements = getPageElements(page);
  const pageDocument = elements.real.ownerDocument;

  applyHtmlRoundTripToNode(elements.real);
  const realViewElement = getViewElement(elements.real);
  // ADR 0006: container에는 View 하나만 둡니다. View 앞뒤의 공백 글자를 지웁니다.
  elements.real.replaceChildren(realViewElement);

  const stateHistory = new StateHistory();
  const initialView = createVNodeFromDom(realViewElement);
  stateHistory.push(initialView);
  elements.test.value = createHtmlFromView(initialView, pageDocument);
  applyHistoryToButtons(elements, stateHistory);

  elements.patchButton.addEventListener("click", () => {
    const fragment = createSafeFragmentFromHtml(
      elements.test.value,
      pageDocument,
    );
    const newViewElement = findViewElement(fragment);
    if (newViewElement === undefined) {
      elements.message.textContent = ROOT_REQUIRED_MESSAGE;
      return;
    }
    const newView = createVNodeFromDom(newViewElement);
    const currentView = getCurrentView(stateHistory);
    try {
      const patches = applyViewToReal(elements.real, newView);
      // DEC-15: 실제 영역의 입력칸에 친 값만 다르면 이력과 같은 View이므로 저장하지 않습니다(테스트 시트 80행).
      if (diffViews(currentView, newView).length > 0) {
        stateHistory.push(newView);
      }
      applyPatchesToLog(elements.patchLog, patches);
      elements.message.textContent = "";
    } catch (error) {
      applyErrorToPage(elements, error, currentView);
    }
    applyHistoryToButtons(elements, stateHistory);
  });
  elements.backButton.addEventListener("click", () => {
    const savedView = stateHistory.back();
    if (savedView === null) {
      return;
    }
    applySavedViewToPage(elements, savedView);
    applyHistoryToButtons(elements, stateHistory);
  });
  elements.forwardButton.addEventListener("click", () => {
    const savedView = stateHistory.forward();
    if (savedView === null) {
      return;
    }
    applySavedViewToPage(elements, savedView);
    applyHistoryToButtons(elements, stateHistory);
  });
}

function getPageElements(page: ParentNode): PageElements {
  return {
    real: getPageElement(page, "#real", HTMLElement),
    test: getPageElement(page, "#test", HTMLTextAreaElement),
    patchButton: getPageElement(page, "#patch", HTMLButtonElement),
    backButton: getPageElement(page, "#back", HTMLButtonElement),
    forwardButton: getPageElement(page, "#forward", HTMLButtonElement),
    message: getPageElement(page, "#message", HTMLElement),
    patchLog: getPageElement(page, "#patch-log", HTMLElement),
  };
}

function getPageElement<T extends Element>(
  page: ParentNode,
  selector: string,
  elementType: new () => T,
): T {
  const element = page.querySelector(selector);
  if (!(element instanceof elementType)) {
    throw new Error(`Verification page has no ${selector}`);
  }
  return element;
}

function getCurrentView(stateHistory: StateHistory): VNode {
  const currentView = stateHistory.current();
  if (currentView === null) {
    throw new Error("StateHistory has no View");
  }
  return currentView;
}

// 이력의 View가 아니라 실제 영역을 다시 읽어 비교합니다(DEC-15).
// 사용자가 실제 영역의 입력칸에 친 값처럼 이력에 없는 변경도 view로 되돌리기 위해서입니다.
function applyViewToReal(real: HTMLElement, view: VNode): Patch[] {
  const realView = createVNodeFromDom(getViewElement(real));
  const patches = diffViews(realView, view);
  applyPatchesToDom(real, patches);
  return patches;
}

function applySavedViewToPage(elements: PageElements, savedView: VNode): void {
  try {
    const patches = applyViewToReal(elements.real, savedView);
    applyPatchesToLog(elements.patchLog, patches);
    elements.message.textContent = "";
  } catch (error) {
    applyErrorToPage(elements, error, savedView);
  }
  // DEC-10: 테스트 영역에서 Patch하지 않은 편집은 이동할 때 버립니다.
  elements.test.value = createHtmlFromView(
    savedView,
    elements.real.ownerDocument,
  );
}

// ADR 0006: applyPatchesToDom은 실패해도 앞서 적용한 Patch를 되돌리지 않습니다.
// 반쯤 바뀐 실제 영역을 남기지 않도록, 이력이 가리키는 View로 실제 영역을 다시 만듭니다.
// jsdom의 DOMException은 Error의 instanceof 검사를 통과하지 않으므로, 던져진 값의 종류는 가리지 않습니다.
function applyErrorToPage(
  elements: PageElements,
  error: unknown,
  shownView: VNode,
): void {
  elements.real.replaceChildren(createDomFromVNode(shownView));
  elements.patchLog.replaceChildren();
  elements.message.textContent = String(error);
}

function applyHistoryToButtons(
  elements: PageElements,
  stateHistory: StateHistory,
): void {
  elements.backButton.disabled = !stateHistory.canBack();
  elements.forwardButton.disabled = !stateHistory.canForward();
}

// <template>로 읽으면 스크립트가 실행되지 않고 이미지도 불러오지 않습니다.
// 실제 영역에 넣기 전에 코드를 실행하거나 페이지를 옮길 수 있는 요소와 속성을 지웁니다(DEC-12).
function createSafeFragmentFromHtml(
  html: string,
  ownerDocument: Document,
): DocumentFragment {
  const template = ownerDocument.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  for (const element of fragment.querySelectorAll(UNSAFE_ELEMENT_SELECTOR)) {
    element.remove();
  }
  for (const element of fragment.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (isUnsafeAttribute(attribute)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  applyHtmlRoundTripToNode(fragment);
  return fragment;
}

// iframe, object, embed는 다른 문서를 불러와 그 안에서 스크립트를 실행할 수 있습니다.
// meta는 refresh로 페이지를 옮기고, base는 페이지의 모든 상대 URL을 바꾸고, link는 다른 파일을 불러옵니다.
const UNSAFE_ELEMENT_SELECTOR =
  "script, iframe, object, embed, meta, base, link";

// 브라우저는 URL 앞뒤의 공백과 중간의 탭, 줄바꿈을 무시하므로 지운 뒤 비교합니다.
function isUnsafeAttribute(attribute: Attr): boolean {
  const compactValue = [...attribute.value]
    .filter((character) => character > " ")
    .join("")
    .toLowerCase();
  return (
    attribute.name.startsWith("on") ||
    attribute.name === "srcdoc" ||
    compactValue.includes("javascript:")
  );
}

// 저장한 View는 테스트 영역에 HTML로 쓰였다가 Patch할 때 다시 읽힙니다.
// HTML 파서는 주석을 VNode로 읽지 않고 붙은 글자를 하나로 읽으므로, 읽기 전에 DOM도 같은 모양으로 맞춥니다.
// 맞추지 않으면 고치지 않고 Patch해도 TEXT와 REMOVE가 생기고 이력이 늘어납니다.
function applyHtmlRoundTripToNode(root: Element | DocumentFragment): void {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT,
  );
  const comments: Node[] = [];
  while (walker.nextNode() !== null) {
    comments.push(walker.currentNode);
  }
  for (const comment of comments) {
    comment.parentNode?.removeChild(comment);
  }
  root.normalize();
}

// 앞뒤의 공백 글자는 HTML을 줄 바꿈해 쓴 결과이므로, View 요소를 고를 때 세지 않습니다.
function findViewElement(parent: ParentNode): Element | undefined {
  const nodes = [...parent.childNodes].filter(
    (node) => !(node instanceof Text && HTML_WHITESPACE_ONLY.test(node.data)),
  );
  const [viewElement] = nodes;
  return nodes.length === 1 && viewElement instanceof Element
    ? viewElement
    : undefined;
}

function getViewElement(real: HTMLElement): Element {
  const viewElement = findViewElement(real);
  if (viewElement === undefined) {
    throw new Error("#real needs exactly one View element");
  }
  return viewElement;
}

function createHtmlFromView(view: VNode, ownerDocument: Document): string {
  const holder = ownerDocument.createElement("div");
  holder.append(createDomFromVNode(view));
  return holder.innerHTML;
}

function applyPatchesToLog(patchLog: HTMLElement, patches: Patch[]): void {
  const items = patches.map((patch) => {
    const item = patchLog.ownerDocument.createElement("li");
    // patch.ts의 Error 메시지와 같은 path 표기입니다.
    item.textContent = `${patch.type} [${patch.path.join(", ")}]`;
    return item;
  });
  patchLog.replaceChildren(...items);
}
