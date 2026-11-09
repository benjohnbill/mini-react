import type { VNode } from "./vnode";

export class StateHistory {
  private views: VNode[] = [];
  private position = -1;

  push(view: VNode): void {
    this.views.length = this.position + 1;
    this.views.push(structuredClone(view));
    this.position = this.views.length - 1;
  }

  current(): VNode | null {
    const view = this.views[this.position];
    if (view === undefined) {
      return null;
    }
    return structuredClone(view);
  }

  back(): VNode | null {
    if (!this.canBack()) {
      return null;
    }
    this.position -= 1;
    return this.current();
  }

  forward(): VNode | null {
    if (!this.canForward()) {
      return null;
    }
    this.position += 1;
    return this.current();
  }

  canBack(): boolean {
    return this.position > 0;
  }

  canForward(): boolean {
    return this.position < this.views.length - 1;
  }

  get size(): number {
    return this.views.length;
  }
}
