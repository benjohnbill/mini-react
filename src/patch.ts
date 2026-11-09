// Patch의 형식과 path의 기준은 ADR 0006에 있습니다.
import type { VNode } from "./vnode";

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
  throw new Error("아직 구현하지 않았습니다");
}
