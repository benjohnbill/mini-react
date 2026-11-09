// Patch의 형식과 path의 기준은 ADR 0006에 있습니다.
import { createDomFromVNode, isTextInput, type VNode } from "./vnode";

export type Patch =
  | { type: "TEXT"; path: number[]; text: string }
  | { type: "REPLACE"; path: number[]; node: VNode }
  | {
      type: "PROPS";
      path: number[];
      set: Record<string, string>;
      remove: string[];
    }
  | { type: "INSERT"; path: number[]; node: VNode }
  | { type: "REMOVE"; path: number[] };

export function applyPatchesToDom(container: Element, patches: Patch[]): void {
  for (const patch of patches) {
    applyPatchToDom(container, patch);
  }
}

function applyPatchToDom(container: Element, patch: Patch): void {
  switch (patch.type) {
    case "TEXT":
      applyTextToNode(getNodeByPath(container, patch.path), patch);
      return;
    case "REPLACE":
      getNodeByPath(container, patch.path).replaceWith(
        createDomFromVNode(patch.node),
      );
      return;
    case "PROPS":
      applyPropsToNode(getNodeByPath(container, patch.path), patch);
      return;
    case "INSERT":
      applyInsertToContainer(container, patch);
      return;
    case "REMOVE":
      getNodeByPath(container, patch.path).remove();
      return;
  }
}

function applyTextToNode(
  node: ChildNode,
  patch: Extract<Patch, { type: "TEXT" }>,
): void {
  if (!(node instanceof Text)) {
    throw new Error(
      `TEXT path ${createPathText(patch.path)} is not a text node`,
    );
  }
  node.data = patch.text;
}

function applyPropsToNode(
  node: ChildNode,
  patch: Extract<Patch, { type: "PROPS" }>,
): void {
  if (!(node instanceof Element)) {
    throw new Error(
      `PROPS path ${createPathText(patch.path)} is not an element`,
    );
  }
  for (const [name, value] of Object.entries(patch.set)) {
    // ADR 0005: 입력칸의 props.value는 value 속성이 아니라 .value입니다.
    if (name === "value" && isTextInput(node)) {
      node.value = value;
    } else {
      node.setAttribute(name, value);
    }
  }
  for (const name of patch.remove) {
    node.removeAttribute(name);
  }
}

function applyInsertToContainer(
  container: Element,
  patch: Extract<Patch, { type: "INSERT" }>,
): void {
  const parentPath = patch.path.slice(0, -1);
  const index = patch.path.at(-1);
  if (index === undefined) {
    throw new Error("INSERT path [] has no position");
  }
  const parent = getNodeByPath(container, parentPath);
  const children = createChildListFromNode(parent);
  if (index > children.length) {
    throw new Error(
      `INSERT path ${createPathText(patch.path)} is out of range`,
    );
  }
  // 주석은 세지 않으므로, 기준은 childNodes가 아니라 번호가 맞는 자식입니다.
  parent.insertBefore(createDomFromVNode(patch.node), children[index] ?? null);
}

// container의 자식 목록에서 View는 0번이므로, 0번부터 내려갑니다.
function getNodeByPath(container: Element, path: number[]): ChildNode {
  let node = getChildByIndex(container, 0, path);
  for (const index of path) {
    node = getChildByIndex(node, index, path);
  }
  return node;
}

function getChildByIndex(
  parent: Node,
  index: number,
  path: number[],
): ChildNode {
  const child = createChildListFromNode(parent)[index];
  if (child === undefined) {
    throw new Error(`Patch path ${createPathText(path)} has no node`);
  }
  return child;
}

// ADR 0005: VNode의 children은 글자와 요소만 담으므로, 번호도 그 둘로만 셉니다.
function createChildListFromNode(node: Node): ChildNode[] {
  return [...node.childNodes].filter(
    (child) => child instanceof Text || child instanceof Element,
  );
}

function createPathText(path: number[]): string {
  return `[${path.join(", ")}]`;
}
