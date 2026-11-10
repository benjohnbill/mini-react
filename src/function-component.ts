import { diffViews } from "./diff";
import { applyPatchesToDom } from "./patch";
import { createDomFromVNode, type VNode } from "./vnode";

export type ActionHandler = () => void;

export type RootComponentProps = {
  on: (name: string, handler: ActionHandler) => void;
};

export type RootComponent = (props: RootComponentProps) => VNode;

export type StateSetter<T> = (nextValue: T | ((currentValue: T) => T)) => void;

export type Deps = readonly unknown[];
export type Cleanup = () => void;
export type Effect = () => undefined | Cleanup;

type StateCell = { value: unknown };
type EffectCell = { deps: Deps | undefined; cleanup: Cleanup | undefined };
type MemoCell = { deps: Deps | undefined; value: unknown };
type HookCell = StateCell | EffectCell | MemoCell;
type PendingEffect = { cell: EffectCell; effect: Effect };

// 렌더링하는 동안만 그 Root Instance를 가리킵니다. 렌더링이 끝나면 비웁니다.
let currentComponent: FunctionComponent | undefined;
let hookIndex = 0;

export class FunctionComponent {
  hooks: HookCell[] = [];
  pendingEffects: PendingEffect[] = [];
  container: Element | undefined;
  currentView: VNode | undefined;
  actions = new Map<string, ActionHandler>();

  constructor(private readonly rootComponent: RootComponent) {}

  mount(container: Element): void {
    this.container = container;
    this.currentView = this.renderedView();
    container.replaceChildren(createDomFromVNode(this.currentView));
    container.addEventListener("click", (event) => {
      const actionName = findActionName(container, event);
      if (actionName !== undefined) {
        this.actions.get(actionName)?.();
      }
    });
    this.runPendingEffects();
  }

  update(): void {
    if (this.container === undefined || this.currentView === undefined) {
      throw new Error("update() needs mount() first");
    }
    const newView = this.renderedView();
    const patches = diffViews(this.currentView, newView);
    applyPatchesToDom(this.container, patches);
    this.currentView = newView;
    this.runPendingEffects();
  }

  // 정리 함수를 모두 먼저 부른 뒤 effect를 선언 순서대로 부릅니다.
  // effect 안의 setter가 시작한 update()는 자기 렌더링의 effect를 그 안에서 따로 부릅니다.
  private runPendingEffects(): void {
    const pendingEffects = this.pendingEffects;
    this.pendingEffects = [];
    for (const { cell } of pendingEffects) {
      cell.cleanup?.();
      cell.cleanup = undefined;
    }
    for (const { cell, effect } of pendingEffects) {
      const result = effect();
      cell.cleanup = typeof result === "function" ? result : undefined;
    }
  }

  // Root Component가 Error를 던져도 렌더링 중인 인스턴스를 비웁니다.
  private renderedView(): VNode {
    this.actions.clear();
    this.pendingEffects = [];
    currentComponent = this;
    hookIndex = 0;
    try {
      return this.rootComponent({
        on: (name, handler) => this.actions.set(name, handler),
      });
    } finally {
      currentComponent = undefined;
    }
  }
}

export function useState<T>(initialValue: T | (() => T)): [T, StateSetter<T>] {
  const component = getCurrentComponent();
  const cell = (component.hooks[hookIndex] as StateCell | undefined) ?? {
    value: createValueFromInitialValue(initialValue),
  };
  component.hooks[hookIndex] = cell;
  hookIndex++;
  const setValue: StateSetter<T> = (nextValue) => {
    const newValue = createValueFromNextValue(nextValue, cell.value as T);
    if (Object.is(cell.value, newValue)) {
      return;
    }
    cell.value = newValue;
    component.update();
  };
  return [cell.value as T, setValue];
}

export function useEffect(effect: Effect, deps?: Deps): void {
  const component = getCurrentComponent();
  const previousCell = component.hooks[hookIndex] as EffectCell | undefined;
  const cell = previousCell ?? { deps: undefined, cleanup: undefined };
  component.hooks[hookIndex] = cell;
  hookIndex++;
  if (previousCell !== undefined && !hasChangedDeps(previousCell.deps, deps)) {
    return;
  }
  cell.deps = deps;
  component.pendingEffects.push({ cell, effect });
}

export function useMemo<T>(compute: () => T, deps?: Deps): T {
  const component = getCurrentComponent();
  const cellIndex = hookIndex;
  hookIndex++;
  const previousCell = component.hooks[cellIndex] as MemoCell | undefined;
  if (previousCell !== undefined && !hasChangedDeps(previousCell.deps, deps)) {
    return previousCell.value as T;
  }
  const cell: MemoCell = { deps, value: compute() };
  component.hooks[cellIndex] = cell;
  return cell.value as T;
}

// deps를 생략했거나 길이가 바뀌었으면 바뀐 것으로 봅니다.
function hasChangedDeps(
  previousDeps: Deps | undefined,
  nextDeps: Deps | undefined,
): boolean {
  if (previousDeps === undefined || nextDeps === undefined) {
    return true;
  }
  if (previousDeps.length !== nextDeps.length) {
    return true;
  }
  return nextDeps.some((dep, index) => !Object.is(dep, previousDeps[index]));
}

// 초깃값이 함수이면 한 번 불러 그 결과를 씁니다.
function createValueFromInitialValue<T>(initialValue: T | (() => T)): T {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

// setter에 함수가 오면 칸의 현재 값으로 불러 그 결과를 씁니다.
function createValueFromNextValue<T>(
  nextValue: T | ((currentValue: T) => T),
  currentValue: T,
): T {
  return typeof nextValue === "function"
    ? (nextValue as (currentValue: T) => T)(currentValue)
    : nextValue;
}

function getCurrentComponent(): FunctionComponent {
  if (currentComponent === undefined) {
    throw new Error("Hooks can only be called while Root Component renders");
  }
  return currentComponent;
}

// 클릭한 요소에서 container 안쪽으로 올라가며 가장 가까운 data-action의 이름을 찾습니다.
function findActionName(container: Element, event: Event): string | undefined {
  if (!(event.target instanceof Element)) {
    return undefined;
  }
  const actionElement = event.target.closest("[data-action]");
  if (actionElement === null || actionElement === container) {
    return undefined;
  }
  if (!container.contains(actionElement)) {
    return undefined;
  }
  return actionElement.getAttribute("data-action") ?? undefined;
}
