import type { VNode } from "./vnode";

// 저장하는 View와 돌려주는 View는 모두 복사본입니다.
// 밖에서 View를 고쳐도 저장된 이력이 바뀌지 않게 하기 위해서입니다.
export class StateHistory {
  #views: VNode[] = [];
  #currentIndex = -1;

  push(view: VNode): void {
    this.#views.splice(this.#currentIndex + 1);
    this.#views.push(structuredClone(view));
    this.#currentIndex = this.#views.length - 1;
  }

  current(): VNode | null {
    const view = this.#views[this.#currentIndex];
    return view === undefined ? null : structuredClone(view);
  }

  back(): VNode | null {
    if (!this.canBack()) {
      return null;
    }
    this.#currentIndex -= 1;
    return this.current();
  }

  forward(): VNode | null {
    if (!this.canForward()) {
      return null;
    }
    this.#currentIndex += 1;
    return this.current();
  }

  canBack(): boolean {
    return this.#currentIndex > 0;
  }

  canForward(): boolean {
    return this.#currentIndex < this.#views.length - 1;
  }

  get size(): number {
    return this.#views.length;
  }
}
