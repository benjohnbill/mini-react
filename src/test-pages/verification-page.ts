/*
 * [verification-page.ts]
 * 검증 페이지. 테스트 영역의 HTML을 Patch로 실제 영역에 반영하고, 뒤로가기/앞으로가기로 이력을 오간다.
 *  - 공개 : startVerificationPage
 *  - 흐름
 *    시작        : startVerificationPage -> applyHtmlShapeToNode -> getViewElement -> push
 *    Patch       : applyTestAreaToPage -> findViewInHtml -> applyViewToReal -> (이력과 다르면) push
 *    뒤로/앞으로 : applyMovedViewToPage -> applyViewToReal -> 테스트 영역 다시 쓰기
 *    공통        : applyViewToReal = 실제 영역 다시 읽기 -> diffViews -> applyPatchesToDom -> 로그
 *                  (실패하면 fallbackView로 실제 영역을 새로 만든다)
 */
import { diffViews } from "../diff";
import { StateHistory } from "../history";
import { applyPatchesToDom, type Patch } from "../patch";
import { createDomFromVNode, createVNodeFromDom, type VNode } from "../vnode";

const ROOT_REQUIRED_MESSAGE = "최상위 노드가 하나 필요합니다";

// 실제 영역에 넣으면 코드를 실행하거나(script), 다른 문서를 불러오거나(iframe, object, embed, link),
// 페이지를 옮기거나 모든 상대 URL을 바꾸는(meta, base) 태그.
const UNSAFE_TAG_NAMES = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "meta",
  "base",
  "link",
]);

// HTML이 공백으로 보는 글자만. trim()은 &nbsp;까지 지워서 쓰지 않는다.
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

/*
 * ROLE : 검증 페이지의 처음 상태를 만들고 세 버튼에 이벤트를 연결한다.
 * PARAM : page(페이지 요소를 찾을 곳, 보통 document) -> 반환값 없음
 *
 * 참고 :
 *  - 처음 실제 영역도 HTML로 오간 모양(주석 없음, 붙은 글자 하나)으로 맞춘 뒤 저장한다.
 *    맞추지 않으면 고치지 않고 Patch해도 차이가 생겨 이력이 늘어난다.
 *  - container에는 View 하나만 둔다. 앞뒤 공백 글자가 있으면 path []가 그 글자를 가리키기 때문.
 *  - 버튼 상태는 어떤 동작 뒤에든 이력에서 다시 계산한다.
 */
export function startVerificationPage(page: ParentNode): void {
  const elements = getPageElements(page);
  const stateHistory = new StateHistory();

  applyHtmlShapeToNode(elements.real);
  const initialViewElement = getViewElement(elements.real);
  elements.real.replaceChildren(initialViewElement);
  const initialView = createVNodeFromDom(initialViewElement);
  stateHistory.push(initialView);
  elements.test.value = createHtmlFromView(initialView);
  applyHistoryToButtons(elements, stateHistory);

  elements.patchButton.addEventListener("click", () => {
    applyTestAreaToPage(elements, stateHistory);
    applyHistoryToButtons(elements, stateHistory);
  });
  elements.backButton.addEventListener("click", () => {
    applyMovedViewToPage(elements, stateHistory.back());
    applyHistoryToButtons(elements, stateHistory);
  });
  elements.forwardButton.addEventListener("click", () => {
    applyMovedViewToPage(elements, stateHistory.forward());
    applyHistoryToButtons(elements, stateHistory);
  });
}

/*
 * ROLE : Patch 버튼. 테스트 영역의 HTML을 실제 영역에 반영하고, 이력과 다르면 저장한다.
 * PARAM : elements, stateHistory -> 반환값 없음
 *
 * 참고 :
 *  - 비교 대상은 이력이 아니라 실제 영역이다. (DEC-15)
 *    실제 영역의 입력칸에 친 값처럼 이력에 없는 변경도 테스트 영역 기준으로 되돌리기 위해서.
 *  - 그래서 "화면에 적용할 Patch"와 "이력을 늘릴지"는 따로 판단한다.
 *    입력칸만 되돌린 경우는 Patch는 있지만 이력은 그대로다.
 *  - 실패하면 이력의 현재 View로 실제 영역을 되돌리고 이력은 늘리지 않는다.
 */
function applyTestAreaToPage(
  elements: PageElements,
  stateHistory: StateHistory,
): void {
  const newView = findViewInHtml(elements.test.value);
  if (newView === undefined) {
    elements.message.textContent = ROOT_REQUIRED_MESSAGE;
    return;
  }
  const currentView = getCurrentView(stateHistory);
  const isApplied = applyViewToReal(elements, newView, currentView);
  if (isApplied && diffViews(currentView, newView).length > 0) {
    stateHistory.push(newView);
  }
}

/*
 * ROLE : 뒤로가기/앞으로가기. 옮겨 간 View를 실제 영역과 테스트 영역에 보여 준다.
 * PARAM : elements, movedView(back/forward의 결과, 옮길 수 없었으면 null) -> 반환값 없음
 *
 * 참고 :
 *  - null이면 아무것도 바꾸지 않는다. (끝에서 더 누른 경우)
 *  - 테스트 영역에서 Patch하지 않은 편집은 버린다. (DEC-10)
 *  - 실패해도 이미 옮겨 간 위치의 View로 실제 영역을 새로 만든다.
 */
function applyMovedViewToPage(
  elements: PageElements,
  movedView: VNode | null,
): void {
  if (movedView === null) {
    return;
  }
  applyViewToReal(elements, movedView, movedView);
  elements.test.value = createHtmlFromView(movedView);
}

/*
 * ROLE : 실제 영역을 view로 맞춘다. 실패하면 fallbackView로 실제 영역을 새로 만든다.
 * PARAM : elements, view(보여 줄 View), fallbackView(실패했을 때 보여 줄 View) -> 성공하면 true
 *
 * 참고 :
 *  - 성공 : 적용한 Patch를 로그에 쓰고 안내를 지운다.
 *  - 실패 : 로그를 비우고 오류를 안내에 쓴다.
 *    applyPatchesToDom은 실패 전에 적용한 Patch를 되돌리지 않으므로, 반쯤 바뀐 화면을 남기지 않으려고 새로 만든다.
 *  - 오류는 String(error)로 쓴다. jsdom의 DOMException은 instanceof Error를 통과하지 않아서 종류를 가리지 않는다.
 *  - Patch, 뒤로가기, 앞으로가기가 모두 이 함수 하나로 실제 영역을 바꾼다.
 */
function applyViewToReal(
  elements: PageElements,
  view: VNode,
  fallbackView: VNode,
): boolean {
  try {
    const realView = createVNodeFromDom(getViewElement(elements.real));
    const patches = diffViews(realView, view);
    applyPatchesToDom(elements.real, patches);
    applyPatchesToLog(elements.patchLog, patches);
    elements.message.textContent = "";
    return true;
  } catch (error) {
    elements.real.replaceChildren(createDomFromVNode(fallbackView));
    elements.patchLog.replaceChildren();
    elements.message.textContent = String(error);
    return false;
  }
}

/*
 * ROLE : 사용자가 친 HTML에서 View를 찾는다.
 * PARAM : html -> VNode (최상위가 요소 하나가 아니면 undefined)
 *
 * 참고 :
 *  - <template>로 읽으면 스크립트가 실행되지 않고 이미지도 불러오지 않는다.
 *  - 순서가 중요하다 : 위험한 것 지우기 -> 주석 지우고 글자 합치기 -> View 요소 찾기
 *    script를 지운 자리의 양옆 글자도 합쳐야 하므로 지우기가 먼저다.
 */
function findViewInHtml(html: string): VNode | undefined {
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  applySafetyToNode(fragment);
  applyHtmlShapeToNode(fragment);
  const viewElement = findViewElement(fragment);
  return viewElement === undefined
    ? undefined
    : createVNodeFromDom(viewElement);
}

/*
 * ROLE : 실제 영역에 넣으면 안 되는 태그와 속성을 지운다.
 * PARAM : root(검사할 조각) -> 반환값 없음 (root를 직접 수정)
 *
 * 참고 :
 *  - 요소마다 한 번만 보고, 위험한 태그면 통째로 지우고, 아니면 속성만 검사한다.
 */
function applySafetyToNode(root: DocumentFragment): void {
  for (const element of root.querySelectorAll("*")) {
    if (UNSAFE_TAG_NAMES.has(element.localName)) {
      element.remove();
      continue;
    }
    for (const attribute of [...element.attributes]) {
      if (isUnsafeAttribute(attribute)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}

/*
 * ROLE : 코드를 실행할 수 있는 속성인지 확인한다.
 * PARAM : attribute -> true / false
 *
 * 참고 :
 *  - on으로 시작하는 이벤트 속성, 문서를 통째로 넣는 srcdoc
 *  - 값에 javascript:가 들어 있는 속성. 브라우저는 URL의 공백·탭·줄바꿈을 무시하므로 지운 뒤 찾는다.
 *    값의 중간에 있어도 찾는다. (svg animate의 values="x;javascript:...")
 */
function isUnsafeAttribute(attribute: Attr): boolean {
  const name = attribute.name.toLowerCase();
  const compactValue = attribute.value.replace(/\s/g, "").toLowerCase();
  return (
    name.startsWith("on") ||
    name === "srcdoc" ||
    compactValue.includes("javascript:")
  );
}

/*
 * ROLE : DOM을 "HTML로 썼다가 다시 읽은 모양"으로 맞춘다. 주석을 지우고 붙은 글자를 하나로 합친다.
 * PARAM : root -> 반환값 없음 (root를 직접 수정)
 *
 * 참고 :
 *  - 저장한 View는 테스트 영역에 HTML로 쓰였다가 Patch할 때 다시 읽힌다.
 *    그때 HTML 파서는 주석을 VNode로 읽지 않고, 붙은 글자를 하나로 읽는다.
 *    미리 같은 모양으로 맞춰야 고치지 않은 Patch가 정말 "차이 없음"이 된다.
 */
function applyHtmlShapeToNode(root: Node): void {
  for (const comment of createCommentListFromNode(root)) {
    comment.remove();
  }
  root.normalize();
}

// root 아래의 모든 주석 노드. 다 모은 뒤에 지워야 순회 중에 목록이 바뀌지 않는다.
function createCommentListFromNode(root: Node): Comment[] {
  return [...root.childNodes].flatMap((child) =>
    child instanceof Comment ? [child] : createCommentListFromNode(child),
  );
}

/*
 * ROLE : parent의 자식 중 View가 될 요소 하나를 찾는다.
 * PARAM : parent -> 요소 (요소 하나만 있는 게 아니면 undefined)
 *
 * 참고 :
 *  - 공백뿐인 글자와 주석은 세지 않는다. HTML을 줄 바꿈해 쓴 결과일 뿐이라서.
 *  - 공백이 아닌 글자는 센다. "글자<p>a</p>"는 최상위가 둘이다.
 */
function findViewElement(parent: Node): Element | undefined {
  const contentNodes = [...parent.childNodes].filter(isContentNode);
  const [viewElement] = contentNodes;
  return contentNodes.length === 1 && viewElement instanceof Element
    ? viewElement
    : undefined;
}

function isContentNode(node: ChildNode): boolean {
  return (
    node instanceof Element ||
    (node instanceof Text && !HTML_WHITESPACE_ONLY.test(node.data))
  );
}

// 실제 영역의 View 요소. 없으면 사용자가 개발자 도구로 실제 영역을 망가뜨린 경우라 에러.
function getViewElement(real: HTMLElement): Element {
  const viewElement = findViewElement(real);
  if (viewElement === undefined) {
    throw new Error("#real needs exactly one View element");
  }
  return viewElement;
}

// 시작할 때 처음 View를 저장하므로 현재 View가 없으면 코드가 잘못된 것이라 에러.
function getCurrentView(stateHistory: StateHistory): VNode {
  const currentView = stateHistory.current();
  if (currentView === null) {
    throw new Error("StateHistory has no View");
  }
  return currentView;
}

/*
 * ROLE : View를 테스트 영역에 쓸 HTML로 만든다.
 * PARAM : view -> HTML 문자열
 *
 * 참고 :
 *  - createDomFromVNode가 글자 입력칸의 value를 처음 값(속성)으로도 적으므로,
 *    입력칸에 친 값도 HTML의 value="..."로 나온다.
 */
function createHtmlFromView(view: VNode): string {
  const node = createDomFromVNode(view);
  return node instanceof Element ? node.outerHTML : (node.textContent ?? "");
}

// 이번에 적용한 Patch를 "종류 [path]"로 보여 준다. 적용한 게 없으면 목록이 빈다.
function applyPatchesToLog(patchLog: HTMLElement, patches: Patch[]): void {
  const items = patches.map((patch) => {
    const item = document.createElement("li");
    item.textContent = `${patch.type} [${patch.path.join(", ")}]`;
    return item;
  });
  patchLog.replaceChildren(...items);
}

function applyHistoryToButtons(
  elements: PageElements,
  stateHistory: StateHistory,
): void {
  elements.backButton.disabled = !stateHistory.canBack();
  elements.forwardButton.disabled = !stateHistory.canForward();
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
