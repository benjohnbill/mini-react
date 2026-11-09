export type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

export function createDomFromVNode(vnode: VNode): Node {
  throw new Error("아직 구현하지 않았습니다");
}

export function createVNodeFromDom(element: Element): VNode {
  throw new Error("아직 구현하지 않았습니다");
}

export function isTextInput(element: Element): element is HTMLInputElement {
  throw new Error("아직 구현하지 않았습니다");
}
