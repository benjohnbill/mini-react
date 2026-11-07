export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

export function createDomFromVnode(vnode: VNode): Node {
  console.log("createDom", vnode);
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const element = document.createElement(vnode.type);
  for (const [key, value] of Object.entries(vnode.props)) {
    element.setAttribute(key, value);
  }
  for (const child of vnode.children) {
    element.append(createDomFromVnode(child));
  }
  return element;
}
