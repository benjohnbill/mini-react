// 검증 페이지입니다. 테스트 영역의 HTML을 실제 영역에 Patch로 반영하고, StateHistory로 앞뒤로 이동합니다.
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
  const realViewElement = findViewElement(elements.real);
  if (realViewElement === undefined) {
    throw new Error("#real needs exactly one View element");
  }
  // applyPatchesToDom은 container의 첫 글자 또는 요소를 View로 읽으므로, View 요소 앞뒤의 공백을 지웁니다.
  elements.real.replaceChildren(realViewElement);

  const stateHistory = new StateHistory();
  const initialView = createVNodeFromDom(realViewElement);
  stateHistory.push(initialView);
  elements.test.value = createHtmlFromView(initialView);
  applyHistoryToButtons(elements, stateHistory);

  elements.patchButton.addEventListener("click", () => {
    applyTestAreaToReal(elements, stateHistory);
  });
  elements.backButton.addEventListener("click", () => {
    applySavedViewToAreas(elements, stateHistory, stateHistory.back());
  });
  elements.forwardButton.addEventListener("click", () => {
    applySavedViewToAreas(elements, stateHistory, stateHistory.forward());
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

function applyTestAreaToReal(
  elements: PageElements,
  stateHistory: StateHistory,
): void {
  const fragment = createSafeFragmentFromHtml(
    elements.test.value,
    elements.real.ownerDocument,
  );
  const newViewElement = findViewElement(fragment);
  if (newViewElement === undefined) {
    elements.message.textContent = ROOT_REQUIRED_MESSAGE;
    return;
  }
  elements.message.textContent = "";

  const currentView = stateHistory.current();
  if (currentView === null) {
    throw new Error("StateHistory has no View");
  }
  const newView = createVNodeFromDom(newViewElement);
  const patches = diffViews(currentView, newView);
  // 테스트 시트 80행: 바뀐 것이 없으면 DOM도 이력도 그대로 둡니다.
  if (patches.length === 0) {
    return;
  }
  applyPatchesToDom(elements.real, patches);
  stateHistory.push(newView);
  applyHistoryToButtons(elements, stateHistory);
  elements.patchLog.replaceChildren(...createLogItemsFromPatches(patches));
}

// 테스트 영역에 쓰지 않은 편집은 버리고, 두 영역을 저장된 View로 바꿉니다.
function applySavedViewToAreas(
  elements: PageElements,
  stateHistory: StateHistory,
  savedView: VNode | null,
): void {
  if (savedView === null) {
    return;
  }
  const realViewElement = findViewElement(elements.real);
  if (realViewElement === undefined) {
    throw new Error("#real lost its View element");
  }
  const realView = createVNodeFromDom(realViewElement);
  applyPatchesToDom(elements.real, diffViews(realView, savedView));
  elements.test.value = createHtmlFromView(savedView);
  elements.message.textContent = "";
  applyHistoryToButtons(elements, stateHistory);
}

function applyHistoryToButtons(
  elements: PageElements,
  stateHistory: StateHistory,
): void {
  elements.backButton.disabled = !stateHistory.canBack();
  elements.forwardButton.disabled = !stateHistory.canForward();
}

// <template>로 읽으면 스크립트가 실행되지 않고 이미지도 불러오지 않습니다.
// 실제 영역에 넣기 전에 코드를 실행할 수 있는 요소와 속성을 지웁니다(DEC-12).
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
  return fragment;
}

// iframe, object, embed는 다른 문서를 불러와 그 안에서 스크립트를 실행할 수 있습니다.
const UNSAFE_ELEMENT_SELECTOR = "script, iframe, object, embed";

// 브라우저는 URL 앞뒤의 공백과 중간의 탭, 줄바꿈을 무시하므로 지운 뒤 비교합니다.
function isUnsafeAttribute(attribute: Attr): boolean {
  const compactValue = [...attribute.value]
    .filter((character) => character > " ")
    .join("")
    .toLowerCase();
  return (
    attribute.name.startsWith("on") ||
    attribute.name === "srcdoc" ||
    compactValue.startsWith("javascript:")
  );
}

// 공백뿐인 글자와 주석을 빼고 남은 노드가 요소 하나일 때만 그 요소를 돌려줍니다.
function findViewElement(parent: ParentNode): Element | undefined {
  const nodes = [...parent.childNodes].filter(
    (node) => !isWhitespaceOrComment(node),
  );
  const [viewElement] = nodes;
  return nodes.length === 1 && viewElement instanceof Element
    ? viewElement
    : undefined;
}

function isWhitespaceOrComment(node: Node): boolean {
  return (
    node instanceof Comment ||
    (node instanceof Text && HTML_WHITESPACE_ONLY.test(node.data))
  );
}

function createHtmlFromView(view: VNode): string {
  const holder = document.createElement("div");
  holder.append(createDomFromVNode(view));
  return holder.innerHTML;
}

function createLogItemsFromPatches(patches: Patch[]): HTMLLIElement[] {
  return patches.map((patch) => {
    const item = document.createElement("li");
    item.textContent = `${patch.type} [${patch.path.join(", ")}]`;
    return item;
  });
}
