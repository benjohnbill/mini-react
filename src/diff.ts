import type { Patch } from "./patch";
import type { VNode } from "./vnode";

export function diffViews(currentView: VNode, newView: VNode): Patch[] {
  throw new Error("아직 구현하지 않았습니다");
}
