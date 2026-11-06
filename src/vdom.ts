export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

export function createDom(vnode: VNode): Node {
  console.log("createDom", vnode);
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }
  const el = document.createElement(vnode.type);
  for (const [key, value] of Object.entries(vnode.props)) {
    el.setAttribute(key, value);
  }
  for (const child of vnode.children) {
    el.append(createDom(child));
  }
  return el;
}
