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

type StateCell = { value: unknown; setter: StateSetter<unknown> };
type EffectCell = {
  deps: Deps | undefined;
  cleanup: Cleanup | undefined;
  version: number;
};
type MemoCell = { deps: Deps | undefined; value: unknown };
type HookCell = StateCell | EffectCell | MemoCell;
type PendingEffect = {
  cell: EffectCell;
  effect: Effect;
  deps: Deps | undefined;
  version: number;
};

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
    if (this.container !== undefined) {
      throw new Error("mount() can be called only once");
    }
    // 렌더링을 먼저 하고, 실패하면 칸도 비워 첫 mount가 흔적을 남기지 않게 합니다.
    // 그래야 같은 인스턴스로 mount()를 다시 부를 수 있고, update()의 Error 메시지도 맞습니다.
    try {
      this.currentView = this.renderedView();
    } catch (error) {
      this.hooks = [];
      throw error;
    }
    this.container = container;
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

  // 렌더링이 끝까지 간 effect만 deps를 기록한 뒤, 정리 함수를 모두 먼저 부르고 effect를 선언 순서대로 부릅니다.
  // effect 안의 setter가 시작한 update()는 자기 렌더링의 effect를 그 안에서 따로 부릅니다.
  private runPendingEffects(): void {
    const pendingEffects = this.pendingEffects;
    this.pendingEffects = [];
    for (const { cell, deps } of pendingEffects) {
      cell.deps = deps;
    }
    for (const { cell } of pendingEffects) {
      cell.cleanup?.();
      cell.cleanup = undefined;
    }
    for (const { cell, effect, version } of pendingEffects) {
      // effect 안의 setter가 시작한 update()가 이 effect를 다시 예약했으면, 낡은 것은 건너뜁니다.
      if (version !== cell.version) {
        continue;
      }
      const result = effect();
      cell.cleanup = typeof result === "function" ? result : undefined;
    }
  }

  // Root Component가 Error를 던지면 렌더링 중인 인스턴스를 비우고, 클릭 함수와 effect는 직전 렌더링의 것을 남깁니다.
  private renderedView(): VNode {
    const actions = new Map<string, ActionHandler>();
    this.pendingEffects = [];
    currentComponent = this;
    hookIndex = 0;
    try {
      const view = this.rootComponent({
        on: (name, handler) => {
          if (currentComponent !== this) {
            throw new Error(
              "on() can only be called while Root Component renders",
            );
          }
          actions.set(name, handler);
        },
      });
      this.actions = actions;
      return view;
    } finally {
      currentComponent = undefined;
    }
  }
}

export function useState<T>(initialValue: T | (() => T)): [T, StateSetter<T>] {
  const component = getCurrentComponent();
  const cell =
    (component.hooks[hookIndex] as StateCell | undefined) ??
    createStateCell(component, createValueFromInitialValue(initialValue));
  component.hooks[hookIndex] = cell;
  hookIndex++;
  return [cell.value as T, cell.setter as StateSetter<T>];
}

// 칸과 그 칸의 setter를 한 번 만들어, 렌더링마다 같은 setter를 돌려줍니다.
function createStateCell(
  component: FunctionComponent,
  initialValue: unknown,
): StateCell {
  const cell: StateCell = {
    value: initialValue,
    setter: (nextValue) => {
      if (currentComponent !== undefined) {
        throw new Error(
          "setters cannot be called while Root Component renders",
        );
      }
      const newValue = createValueFromNextValue(nextValue, cell.value);
      if (Object.is(cell.value, newValue)) {
        return;
      }
      cell.value = newValue;
      component.update();
    },
  };
  return cell;
}

export function useEffect(effect: Effect, deps?: Deps): void {
  const component = getCurrentComponent();
  const previousCell = component.hooks[hookIndex] as EffectCell | undefined;
  const cell = previousCell ?? {
    deps: undefined,
    cleanup: undefined,
    version: 0,
  };
  component.hooks[hookIndex] = cell;
  hookIndex++;
  if (previousCell !== undefined && !hasChangedDeps(previousCell.deps, deps)) {
    return;
  }
  cell.version++;
  component.pendingEffects.push({ cell, effect, deps, version: cell.version });
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
