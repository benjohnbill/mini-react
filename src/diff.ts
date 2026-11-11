// Patch의 순서는 ADR diff-compares-same-index-children-first와 diff-emits-props-before-child-patches를 따릅니다. 같은 번호끼리 비교한 Patch, INSERT(앞 번호부터), REMOVE(뒤 번호부터) 순서입니다.
import type { Patch } from "./patch";
import type { VNode } from "./vnode";

export function diffViews(currentView: VNode, newView: VNode): Patch[] {
  // TS 타입 밖에서 호출될 때를 위한 검사입니다. 문자열 View와 null을 비교하면 오류 없이 REPLACE가 나오기 때문입니다.
  if (currentView == null || newView == null) {
    throw new TypeError("diffViews needs two Views");
  }
  return diffNodes(currentView, newView, []);
}

function diffNodes(
  currentNode: VNode,
  newNode: VNode,
  path: number[],
): Patch[] {
  if (typeof currentNode === "string" && typeof newNode === "string") {
    return currentNode === newNode
      ? []
      : [{ type: "TEXT", path, text: newNode }];
  }
  if (
    typeof currentNode === "string" ||
    typeof newNode === "string" ||
    currentNode.type !== newNode.type
  ) {
    return [{ type: "REPLACE", path, node: newNode }];
  }
  return [
    ...diffProps(currentNode.props, newNode.props, path),
    ...diffChildren(currentNode.children, newNode.children, path),
  ];
}

function diffProps(
  currentProps: Record<string, string>,
  newProps: Record<string, string>,
  path: number[],
): Patch[] {
  const set: Record<string, string> = {};
  for (const [name, value] of Object.entries(newProps)) {
    if (currentProps[name] !== value) {
      set[name] = value;
    }
  }
  const remove = Object.keys(currentProps).filter(
    (name) => !Object.hasOwn(newProps, name),
  );
  if (Object.keys(set).length === 0 && remove.length === 0) {
    return [];
  }
  return [{ type: "PROPS", path, set, remove }];
}

function diffChildren(
  currentChildren: VNode[],
  newChildren: VNode[],
  path: number[],
): Patch[] {
  const patches: Patch[] = [];
  const sharedLength = Math.min(currentChildren.length, newChildren.length);
  for (let index = 0; index < sharedLength; index++) {
    patches.push(
      ...diffNodes(
        currentChildren[index] as VNode,
        newChildren[index] as VNode,
        [...path, index],
      ),
    );
  }
  for (let index = sharedLength; index < newChildren.length; index++) {
    patches.push({
      type: "INSERT",
      path: [...path, index],
      node: newChildren[index] as VNode,
    });
  }
  for (let index = currentChildren.length - 1; index >= sharedLength; index--) {
    patches.push({ type: "REMOVE", path: [...path, index] });
  }
  return patches;
}
