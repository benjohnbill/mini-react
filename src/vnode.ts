export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

export function createDomFromVNode(vnode: VNode): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }

  const element: HTMLElement = document.createElement(vnode.type);
  for (const [name, value] of Object.entries(vnode.props)) {
    element.setAttribute(name, value);
  }
  for (const child of vnode.children) {
    element.append(createDomFromVNode(child));
  }

  return element;
}

export function createVNodeFromDom(element: Text | Element): VNode {
  if (element instanceof Text) {
    return element.data;
  }

  return {
    type: element.localName,
    props: createPropsFromElement(element),
    children: Array.from(element.childNodes)
      .filter(
        (child): child is Text | Element =>
          child instanceof Text || child instanceof Element,
      )
      .map(createVNodeFromDom),
  };
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

const NON_TEXT_INPUT_TYPES = ["checkbox", "radio", "file"];

export function isTextInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    !NON_TEXT_INPUT_TYPES.includes(element.type)
  );
}
