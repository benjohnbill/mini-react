import { diffViews } from "./diff";
import { applyPatchesToDom } from "./patch";
import { createDomFromVNode, type VNode } from "./vnode";

export type ComponentProps = Record<string, unknown>;

export type Component = (props: ComponentProps) => VNode;

let currentComponent: FunctionComponent | null = null;

export class FunctionComponent {
  hooks: unknown[] = [];
  hookIndex = 0;
  pendingEffects: (() => void)[] = [];
  view: VNode | null = null;
  container: Element | null = null;

  readonly #component: Component;
  readonly #props: ComponentProps;

  constructor(component: Component, props: ComponentProps = {}) {
    this.#component = component;
    this.#props = props;
  }

  mount(container: Element): void {
    if (this.container !== null) {
      throw new Error("FunctionComponent is already mounted");
    }
    const view = this.#createView();
    container.replaceChildren(createDomFromVNode(view));
    this.view = view;
    this.container = container;
    this.#runPendingEffects();
  }

  update(): void {
    if (this.view === null || this.container === null) {
      throw new Error("FunctionComponent must be mounted before update");
    }
    const newView = this.#createView();
    const patches = diffViews(this.view, newView);
    applyPatchesToDom(this.container, patches);
    this.view = newView;
    this.#runPendingEffects();
  }

  #createView(): VNode {
    this.hookIndex = 0;
    currentComponent = this;
    try {
      return this.#component(this.#props);
    } finally {
      currentComponent = null;
    }
  }

  // effect 안에서 update가 다시 불려도 같은 effect를 두 번 돌리지 않도록, 목록을 먼저 비웁니다.
  #runPendingEffects(): void {
    const effects = this.pendingEffects;
    this.pendingEffects = [];
    for (const effect of effects) {
      effect();
    }
  }
}

type EffectHook = {
  deps: unknown[] | undefined;
  cleanup: (() => void) | undefined;
};

type MemoHook<T> = {
  deps: unknown[];
  value: T;
};

function getCurrentComponent(): FunctionComponent {
  if (currentComponent === null) {
    throw new Error("Hook은 컴포넌트 함수 안에서만 부를 수 있습니다");
  }
  return currentComponent;
}

function takeHookIndex(component: FunctionComponent): number {
  const index = component.hookIndex;
  component.hookIndex += 1;
  return index;
}

function hasDepsChanged(
  oldDeps: unknown[] | undefined,
  newDeps: unknown[] | undefined,
): boolean {
  if (oldDeps === undefined || newDeps === undefined) {
    return true;
  }
  if (oldDeps.length !== newDeps.length) {
    return true;
  }
  return newDeps.some((dep, i) => !Object.is(dep, oldDeps[i]));
}

export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
  const component = getCurrentComponent();
  const index = takeHookIndex(component);

  if (index >= component.hooks.length) {
    component.hooks[index] = initialValue;
  }
  const value = component.hooks[index] as T;

  function setState(newValue: T): void {
    if (Object.is(component.hooks[index], newValue)) {
      return;
    }
    component.hooks[index] = newValue;
    component.update();
  }

  return [value, setState];
}

export function useEffect(
  effect: () => undefined | (() => void),
  deps?: unknown[],
): void {
  const component = getCurrentComponent();
  const index = takeHookIndex(component);
  const previous = component.hooks[index] as EffectHook | undefined;

  if (previous !== undefined && !hasDepsChanged(previous.deps, deps)) {
    return;
  }

  const hook: EffectHook = { deps, cleanup: undefined };
  component.hooks[index] = hook;
  component.pendingEffects.push(() => {
    previous?.cleanup?.();
    const cleanup = effect();
    hook.cleanup = typeof cleanup === "function" ? cleanup : undefined;
  });
}

export function useMemo<T>(compute: () => T, deps: unknown[]): T {
  const component = getCurrentComponent();
  const index = takeHookIndex(component);
  const previous = component.hooks[index] as MemoHook<T> | undefined;

  if (previous !== undefined && !hasDepsChanged(previous.deps, deps)) {
    return previous.value;
  }

  const value = compute();
  const hook: MemoHook<T> = { deps, value };
  component.hooks[index] = hook;
  return value;
}
