export type PropValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ((event: Event) => void);

export type Props = Record<string, PropValue>;

export type VNode = string | { type: string; props: Props; children: VNode[] };

export function createDomFromVNode(vnode: VNode): Node {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const element = document.createElement(vnode.type);
  for (const [name, value] of Object.entries(vnode.props)) {
    applyPropToElement(element, name, value);
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

export function createVNode(
  type: string,
  props: Props,
  ...children: VNode[]
): VNode {
  return { type, props, children };
}

export function isOmittedProp(value: PropValue): boolean {
  return value === false || value === null || value === undefined;
}

const handlersByElement = new WeakMap<Element, Map<string, EventListener>>();

export function applyPropToElement(
  element: Element,
  name: string,
  value: PropValue,
): void {
  if (typeof value === "function") {
    applyHandlerToElement(element, name, value);
  } else if (isOmittedProp(value)) {
    removePropFromElement(element, name);
  } else {
    element.setAttribute(name, value === true ? "" : String(value));
  }
}

export function removePropFromElement(element: Element, name: string): void {
  if (handlersByElement.get(element)?.has(name)) {
    removeHandlerFromElement(element, name);
  } else {
    element.removeAttribute(name);
  }
}

function applyHandlerToElement(
  element: Element,
  name: string,
  handler: EventListener,
): void {
  if (!name.startsWith("on")) {
    throw new TypeError(`Function prop "${name}" must start with "on"`);
  }
  removeHandlerFromElement(element, name);
  element.addEventListener(createEventNameFromProp(name), handler);
  const handlers = handlersByElement.get(element) ?? new Map();
  handlers.set(name, handler);
  handlersByElement.set(element, handlers);
}

function removeHandlerFromElement(element: Element, name: string): void {
  const handlers = handlersByElement.get(element);
  const handler = handlers?.get(name);
  if (handlers === undefined || handler === undefined) {
    return;
  }
  element.removeEventListener(createEventNameFromProp(name), handler);
  handlers.delete(name);
}

function createEventNameFromProp(name: string): string {
  return name.slice(2).toLowerCase();
}

export function isTextInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    element.type !== "checkbox" &&
    element.type !== "radio" &&
    element.type !== "file"
  );
}
