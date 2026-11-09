import type { VNode } from "./vnode";

export class StateHistory {
  push(view: VNode): void {
    throw new Error("아직 구현하지 않았습니다");
  }

  current(): VNode | null {
    throw new Error("아직 구현하지 않았습니다");
  }

  back(): VNode | null {
    throw new Error("아직 구현하지 않았습니다");
  }

  forward(): VNode | null {
    throw new Error("아직 구현하지 않았습니다");
  }

  canBack(): boolean {
    throw new Error("아직 구현하지 않았습니다");
  }

  canForward(): boolean {
    throw new Error("아직 구현하지 않았습니다");
  }

  get size(): number {
    throw new Error("아직 구현하지 않았습니다");
  }
}
