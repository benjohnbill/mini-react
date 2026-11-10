import { diffViews } from "./diff";
import { applyPatchesToDom } from "./patch";
import { createDomFromVNode, type VNode } from "./vnode";

export type ActionHandler = () => void;

export type RootComponentProps = {
  on: (name: string, handler: ActionHandler) => void;
};

export type RootComponent = (props: RootComponentProps) => VNode;

export type StateSetter<T> = (nextValue: T | ((currentValue: T) => T)) => void;

type HookCell = { value: unknown };

// 렌더링하는 동안만 그 Root Instance를 가리킵니다. 렌더링이 끝나면 비웁니다.
let currentComponent: FunctionComponent | undefined;
let hookIndex = 0;

export class FunctionComponent {
  hooks: HookCell[] = [];
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
  }

  update(): void {
    if (this.container === undefined || this.currentView === undefined) {
      throw new Error("update() needs mount() first");
    }
    const newView = this.renderedView();
    const patches = diffViews(this.currentView, newView);
    applyPatchesToDom(this.container, patches);
    this.currentView = newView;
  }

  // Root Component가 Error를 던져도 렌더링 중인 인스턴스를 비웁니다.
  private renderedView(): VNode {
    this.actions.clear();
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
  const cell = component.hooks[hookIndex] ?? {
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
