import type { Patch } from "./patch";
import type { VNode } from "./vnode";

export function diffViews(currentView: VNode, newView: VNode): Patch[] {
  if (
    currentView === null ||
    currentView === undefined ||
    newView === null ||
    newView === undefined
  ) {
    throw new TypeError("View must not be null or undefined");
  }

  const patches: Patch[] = [];
  diffVNode(currentView, newView, [], patches);
  return patches;
}

function diffVNode(
  currentVNode: VNode,
  newVNode: VNode,
  path: number[],
  patches: Patch[],
): void {
  if (typeof currentVNode === "string" && typeof newVNode === "string") {
    if (currentVNode !== newVNode) {
      patches.push({ type: "TEXT", path, text: newVNode });
    }
    return;
  }

  if (typeof currentVNode === "string" || typeof newVNode === "string") {
    patches.push({ type: "REPLACE", path, node: newVNode });
    return;
  }

  if (currentVNode.type !== newVNode.type) {
    patches.push({ type: "REPLACE", path, node: newVNode });
    return;
  }

  const propsPatch = diffProps(currentVNode.props, newVNode.props, path);
  if (propsPatch !== undefined) {
    patches.push(propsPatch);
  }
  diffChildren(currentVNode.children, newVNode.children, path, patches);
}

function diffProps(
  currentProps: Record<string, string>,
  newProps: Record<string, string>,
  path: number[],
): Patch | undefined {
  const set: Record<string, string> = {};
  for (const [name, value] of Object.entries(newProps)) {
    if (currentProps[name] !== value) {
      set[name] = value;
    }
  }

  const remove = Object.keys(currentProps).filter(
    (name) => !(name in newProps),
  );

  if (Object.keys(set).length === 0 && remove.length === 0) {
    return undefined;
  }
  return { type: "PROPS", path, set, remove };
}

function diffChildren(
  currentChildren: VNode[],
  newChildren: VNode[],
  path: number[],
  patches: Patch[],
): void {
  const sharedCount = Math.min(currentChildren.length, newChildren.length);

  for (let index = 0; index < sharedCount; index += 1) {
    const currentChild = currentChildren[index];
    const newChild = newChildren[index];
    if (currentChild === undefined || newChild === undefined) {
      break;
    }
    diffVNode(currentChild, newChild, [...path, index], patches);
  }

  for (let index = sharedCount; index < newChildren.length; index += 1) {
    const newChild = newChildren[index];
    if (newChild === undefined) {
      break;
    }
    patches.push({ type: "INSERT", path: [...path, index], node: newChild });
  }

  for (
    let index = currentChildren.length - 1;
    index >= sharedCount;
    index -= 1
  ) {
    patches.push({ type: "REMOVE", path: [...path, index] });
  }
}
