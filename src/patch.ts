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
    case "TEXT": {
      const node = findNode(container, patch.path);
      if (node === undefined) {
        throw new Error(`Node not found: ${createPathLabel(patch.path)}`);
      }
      if (!(node instanceof Text)) {
        throw new Error(
          `TEXT patch path is not a text node: ${createPathLabel(patch.path)}`,
        );
      }
      node.data = patch.text;
      return;
    }

    case "REPLACE": {
      const node = findNode(container, patch.path);
      if (node === undefined) {
        throw new Error(`Node not found: ${createPathLabel(patch.path)}`);
      }
      node.parentNode?.replaceChild(createDomFromVNode(patch.node), node);
      return;
    }

    case "PROPS": {
      const node = findNode(container, patch.path);
      if (node === undefined) {
        throw new Error(`Node not found: ${createPathLabel(patch.path)}`);
      }
      if (!(node instanceof Element)) {
        throw new Error(
          `PROPS patch path is not an element: ${createPathLabel(patch.path)}`,
        );
      }
      applyPropsToElement(node, patch.set, patch.remove);
      return;
    }

    case "INSERT": {
      if (patch.path.length === 0) {
        throw new Error(
          `INSERT patch has no insertion index: ${createPathLabel(patch.path)}`,
        );
      }
      const index = patch.path[patch.path.length - 1];
      if (index === undefined) {
        return;
      }
      const parent = findNode(container, patch.path.slice(0, -1));
      if (parent === undefined) {
        throw new Error(
          `Parent node not found: ${createPathLabel(patch.path)}`,
        );
      }
      if (!(parent instanceof Element)) {
        throw new Error(
          `INSERT patch parent is not an element: ${createPathLabel(patch.path)}`,
        );
      }
      if (index > countCountableChildren(parent)) {
        throw new Error(
          `INSERT patch index is out of range: ${createPathLabel(patch.path)}`,
        );
      }
      parent.insertBefore(
        createDomFromVNode(patch.node),
        findCountableChild(parent, index) ?? null,
      );
      return;
    }

    case "REMOVE": {
      const node = findNode(container, patch.path);
      if (node === undefined) {
        throw new Error(`Node not found: ${createPathLabel(patch.path)}`);
      }
      node.parentNode?.removeChild(node);
      return;
    }
  }
}

function applyPropsToElement(
  element: Element,
  set: Record<string, string>,
  remove: string[],
): void {
  for (const name of remove) {
    element.removeAttribute(name);
  }
  for (const [name, value] of Object.entries(set)) {
    if (name !== "value") {
      element.setAttribute(name, value);
    }
  }
  const value = set.value;
  if (value === undefined) {
    return;
  }
  if (isTextInput(element)) {
    element.value = value;
  } else {
    element.setAttribute("value", value);
  }
}

function findNode(container: Element, path: number[]): Node | undefined {
  let node: Node | undefined = findCountableChild(container, 0);
  for (const index of path) {
    if (!(node instanceof Element)) {
      return undefined;
    }
    node = findCountableChild(node, index);
  }
  return node;
}

function findCountableChild(parent: Element, index: number): Node | undefined {
  let count = 0;
  for (const child of parent.childNodes) {
    if (!(child instanceof Text || child instanceof Element)) {
      continue;
    }
    if (count === index) {
      return child;
    }
    count += 1;
  }
  return undefined;
}

function countCountableChildren(parent: Element): number {
  let count = 0;
  for (const child of parent.childNodes) {
    if (child instanceof Text || child instanceof Element) {
      count += 1;
    }
  }
  return count;
}

function createPathLabel(path: number[]): string {
  return `[${path.join(", ")}]`;
}
