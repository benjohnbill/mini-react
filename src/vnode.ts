export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

export function createDomFromVNode(vnode: VNode): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const element = document.createElement(vnode.type);
  for (const [key, value] of Object.entries(vnode.props)) {
    element.setAttribute(key, value);
  }
  for (const child of vnode.children) {
    element.append(createDomFromVNode(child));
  }

  return element;
}

export function createVNodeFromDom(element: Element): VNode {
  const children: VNode[] = [];
  for (const child of element.childNodes) {
    if (child instanceof Text) {
      children.push(child.data);
    } else if (child instanceof Element) {
      children.push(createVNodeFromDom(child));
    }
  }

  const vnode: VNode = {
    type: element.localName,
    props: createPropsFromElement(element),
    children,
  };

  return vnode;
}

function createPropsFromElement(element: Element): Record<string, string> {
  const props: Record<string, string> = {};
  for (const attribute of element.attributes) {
    props[attribute.name] = attribute.value;
  }
  if (isTextInput(element)) {
    props.value = element.value;
  }
  return props;
}

export function isTextInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    element.type !== "checkbox" &&
    element.type !== "radio" &&
    element.type !== "file"
  );
}
