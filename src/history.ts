/*
 * [history.ts]
 * View를 저장하고 뒤로/앞으로 옮겨 다니는 이력 파일.
 *  - 공개 : StateHistory
 *  - 브라우저 History처럼 뒤로 간 뒤 새 View를 저장하면 앞쪽 View를 지운다.
 *  - vnode의 타입만 가져온다. (DOM을 모른다)
 */
import type { VNode } from "./vnode";

// 저장된 View가 하나도 없을 때의 현재 위치.
const NO_VIEW_INDEX = -1;
// 한 번에 옮기는 칸 수. back과 forward가 같은 #moveBy를 방향만 바꿔 쓴다.
const BACK_STEP = -1;
const FORWARD_STEP = 1;

/*
 * ROLE : 저장한 View의 목록과 현재 위치를 가진다.
 *
 * 참고 :
 *  - 저장할 때와 돌려줄 때 모두 structuredClone으로 복사한다.
 *    밖에서 View를 고쳐도 저장된 이력이 바뀌지 않게 하기 위해서다.
 *  - 현재와 같은 내용도 저장한다. (같은지 비교하지 않는다)
 *  - "옮길 수 있는가"는 #hasViewAt 한 곳에서만 판단한다.
 *    canBack/canForward와 back/forward가 서로 다른 경계 계산을 갖지 않게 하기 위해서다.
 */
export class StateHistory {
  #views: VNode[] = [];
  #currentIndex = NO_VIEW_INDEX;

  // 현재 위치 뒤쪽 View를 지우고 view를 끝에 저장해서 현재로 만든다.
  push(view: VNode): void {
    this.#views.splice(this.#currentIndex + 1);
    this.#views.push(structuredClone(view));
    this.#currentIndex = this.#views.length - 1;
  }

  // 현재 View의 복사본. 저장된 View가 없으면 null.
  current(): VNode | null {
    const view = this.#views[this.#currentIndex];
    return view === undefined ? null : structuredClone(view);
  }

  back(): VNode | null {
    return this.#moveBy(BACK_STEP);
  }

  forward(): VNode | null {
    return this.#moveBy(FORWARD_STEP);
  }

  canBack(): boolean {
    return this.#hasViewAt(this.#currentIndex + BACK_STEP);
  }

  canForward(): boolean {
    return this.#hasViewAt(this.#currentIndex + FORWARD_STEP);
  }

  // 저장된 View의 개수.
  get size(): number {
    return this.#views.length;
  }

  // step만큼 옮기고 그 자리의 View를 돌려준다. 그 자리에 View가 없으면 옮기지 않고 null.
  #moveBy(step: number): VNode | null {
    const nextIndex = this.#currentIndex + step;
    if (!this.#hasViewAt(nextIndex)) {
      return null;
    }
    this.#currentIndex = nextIndex;
    return this.current();
  }

  #hasViewAt(index: number): boolean {
    return index >= 0 && index < this.#views.length;
  }
}
