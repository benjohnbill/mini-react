/*
 * [vnode.ts]
 * DOM(브라우저 화면 요소)과 VNode(화면을 설명하는 값)를 서로 바꿔 주는 파일.
 *  - DOM -> VNode : createVNodeFromDom
 *  - VNode -> DOM : createDomFromVNode
 * 다른 파일을 import하지 않는다. (patch, diff 등이 이 파일을 가져다 씀)
 */
export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

/* input/textarea처럼 value를 "속성"이 아닌 "프로퍼티"로 다뤄야 하는 요소인지 확인한다 */
export function hasValueProperty(element: Element): boolean {
  return element.localName === "input" || element.localName === "textarea";
}

/* 요소의 속성들을 {이름: 값} Props로 모은다 */
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

/* 자식 노드들을 VNode 목록으로 바꾼다 */
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

/* DOM 요소 하나를 VNode로 바꾼다 (DOM -> VNode) */
export function createVNodeFromDom(element: Element): VNode {
  return {
    type: element.localName,
    props: createPropsFromElement(element),
    children: createChildrenFromNodes(element.childNodes),
  };
}

/* props를 DOM 요소에 실제로 적용한다 */
export function applyPropsToElement(
  element: Element,
  props: Record<string, string>,
): void {
  for (const [name, value] of Object.entries(props)) {
    if (name === "value" && hasValueProperty(element)) {
      (element as HTMLInputElement | HTMLTextAreaElement).value = value;
    } else {
      element.setAttribute(name, value);
    }
  }
}

/* VNode 하나를 새 DOM 노드로 만든다 (VNode -> DOM) */
export function createDomFromVNode(vnode: VNode): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const element = document.createElement(vnode.type);
  for (const child of vnode.children) {
    element.append(createDomFromVNode(child));
  }
  applyPropsToElement(element, vnode.props);
  return element;
}
