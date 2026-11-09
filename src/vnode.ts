/*
 * [vnode.ts]
 * DOM(브라우저 화면 요소)과 VNode(화면을 설명하는 값)를 서로 바꿔 주는 파일.
 *  - DOM -> VNode : createVNodeFromDom
 *  - VNode -> DOM : createDomFromVNode
 * 다른 파일을 import하지 않는다. (patch, diff 등이 이 파일을 가져다 씀)
 */

/*
 * ROLE : 화면 한 조각을 나타내는 값. 글자면 문자열, 태그면 {type, props, children} 객체.
 * PARAM : type = 태그 이름("div"), props = 속성 모음({class:"a"}), children = 자식 VNode 목록
 *
 * 참고 :
 *  - 문자열 VNode = 텍스트 노드, 객체 VNode = 요소(태그)
 *  - View = 화면 전체를 나타내는 가장 바깥 VNode
 */
export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

/*
 * ROLE : 글자 입력 input이나 textarea처럼, value를 "속성"이 아닌 "프로퍼티"로 다뤄야 하는 요소인지 확인한다.
 * PARAM : 요소(Element) -> true / false
 *
 * 참고 :
 *  - 사용자가 입력한 값은 속성(attribute)에 반영되지 않아서 따로 처리해야 함
 *  - createPropsFromElement, applyPropsToElement에서 호출
 *  - patch.ts의 applyPatchesToDom도 사용 ("PROPS" Patch를 반영할 때)
 */
export function hasValueProperty(element: Element): boolean {
  return isTextInput(element) || element instanceof HTMLTextAreaElement;
}

/*
 * ROLE : 글자를 직접 입력하는 <input>인지 확인한다.
 * PARAM : 요소(Element) -> true / false (true이면 HTMLInputElement로 좁혀진다)
 *
 * 참고 :
 *  - checkbox, radio, file은 .value가 입력한 글자가 아니라서 제외한다.
 *  - textarea와 select는 input이 아니므로 false. 그 둘의 value는 hasValueProperty가 다룬다.
 *  - createPropsFromElement에서 호출
 */
export function isTextInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    element.type !== "checkbox" &&
    element.type !== "radio" &&
    element.type !== "file"
  );
}

/*
 * ROLE : 요소의 속성들을 {이름: 값} 객체(props)로 모은다.
 * PARAM : 요소(Element) -> props 객체
 *
 * 참고 :
 *  - input/textarea면 현재 입력된 value도 props.value에 넣음
 *  - createVNodeFromDom에서 호출
 */
function createPropsFromElement(element: Element): Record<string, string> {
  const props: Record<string, string> = {};
  for (const attribute of element.attributes) {
    props[attribute.name] = attribute.value;
  }
  if (hasValueProperty(element)) {
    props.value = (element as HTMLInputElement | HTMLTextAreaElement).value;
  }
  return props;
}

/*
 * ROLE : 자식 노드들을 VNode 목록으로 바꾼다.
 * PARAM : childNodes(자식 노드 목록) -> VNode[]
 *
 * 참고 :
 *  - 텍스트 노드 -> 문자열, 요소 노드 -> createVNodeFromDom 재귀 호출
 *  - 주석 노드 등 그 외는 무시
 *  - createVNodeFromDom에서 호출
 */
function createChildrenFromNodes(childNodes: NodeListOf<ChildNode>): VNode[] {
  const children: VNode[] = [];
  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      children.push(node.textContent ?? "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      children.push(createVNodeFromDom(node as Element));
    }
  }
  return children;
}

/*
 * ROLE : DOM 요소 하나를 VNode로 바꾼다. (DOM -> VNode)
 * PARAM : 요소(Element) -> VNode 객체 {type, props, children}
 *
 * 참고 :
 *  - type = 태그 이름, props = createPropsFromElement, children = createChildrenFromNodes
 *  - 쓰이는 곳: 처음 화면 읽기 등 (patch/diff/function-component/test-pages)
 */
export function createVNodeFromDom(element: Element): VNode {
  return {
    type: element.localName,
    props: createPropsFromElement(element),
    children: createChildrenFromNodes(element.childNodes),
  };
}

/*
 * ROLE : props를 DOM 요소에 실제로 적용한다.
 * PARAM : 요소(Element), props 객체 -> 반환값 없음 (요소를 직접 수정)
 *
 * 참고 :
 *  - value는 input/textarea면 프로퍼티로(지금 보이는 값), 그 외는 setAttribute로 설정
 *  - value는 다른 속성을 모두 적은 뒤 마지막에 쓴다.
 *    type="file"을 type="text"로 바꾸는 경우처럼, type이 먼저 바뀌어야 value를 쓸 수 있기 때문.
 *  - createDomFromVNode에서 호출
 *  - patch.ts의 applyPatchesToDom도 사용 ("PROPS" Patch를 반영할 때)
 */
export function applyPropsToElement(
  element: Element,
  props: Record<string, string>,
): void {
  const usesValueProperty = hasValueProperty(element);
  for (const [name, value] of Object.entries(props)) {
    if (name !== "value" || !usesValueProperty) {
      element.setAttribute(name, value);
    }
  }
  const value = props.value;
  if (value !== undefined && usesValueProperty) {
    (element as HTMLInputElement | HTMLTextAreaElement).value = value;
  }
}

/*
 * ROLE : VNode 하나를 새 DOM 노드로 만든다. (VNode -> DOM)
 * PARAM : VNode -> Node (문자열이면 텍스트 노드, 객체면 요소)
 *
 * 참고 :
 *  - 자식을 먼저 붙이고 props를 나중에 적용 (select 등의 value가 자식 option이 있어야 반영되기 때문)
 *  - 자식은 재귀로 만든다
 *  - 쓰이는 곳: 화면 그리기, patch 적용 (patch/diff/function-component/test-pages)
 *  - 새로 만든 글자 입력칸은 value를 처음 값(속성)으로도 적는다. (defaultValue = value 속성)
 *    새 요소는 "처음부터 그 값이었던 것"이 맞기 때문. 이미 있는 요소를 고치는 PROPS는 지금 값만 바꾼다.
 */
export function createDomFromVNode(vnode: VNode): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const element = document.createElement(vnode.type);
  for (const child of vnode.children) {
    element.append(createDomFromVNode(child));
  }
  applyPropsToElement(element, vnode.props);
  if (isTextInput(element) && vnode.props.value !== undefined) {
    element.defaultValue = vnode.props.value;
  }
  return element;
}
