# LMS L3의 두 결정: 테스트와 코드

[README의 "Top-Down 작업과정"](../README.md#top-down-작업과정)에서 이어집니다. LMS L3 "각각의 Component 는 자신만의 로직과 렌더링을 담당합니다."의 두 단어에 답하는 결정 두 개가 어느 테스트와 어느 코드로 내려가는지 적습니다.

코드와 테스트는 2026-11-12 기준 발췌이고, 코드 발췌의 `//` 설명은 이 문서에서 붙였습니다. 두 ADR과 테스트 F1, F8, F67, F68, F70과 코드는 2026-11-11의 같은 커밋(`6527af3`)에 함께 들어왔고, F144는 그 뒤에 추가했습니다.

## 렌더링

> [Component는 View를 돌려주기까지만 하고, DOM에 그리는 일은 `FunctionComponent`의 `mount()`와 `update()`가 합니다](adr/instance/component-returns-view-and-function-component-draws.md)

Component가 맡는 렌더링은 `View`를 돌려주는 데까지입니다.

### 이 결정을 지키는 테스트

| 테스트 | 확인하는 것 | ADR의 줄 |
| ------ | ----------- | -------- |
| F1 | Root Component의 View를 컨테이너에 그리고 Root Component는 한 번만 부른다 | 결정 |
| F8 | 클릭으로 상태를 바꾸면 버튼 글자가 1이 되고 Root Component는 모두 두 번 불린다 | 결정 |
| F144 | Root Component 본문이 DOM을 직접 고치면, 다음 `update()`의 Patch는 그 변경을 모르고 바뀐 곳만 고쳐 화면이 View와 어긋난다 | CAUTION |

F144는 Component가 이 약속을 어기면 생기는 일을 보여 줍니다. View는 `title`인데 화면에는 `edited`가 남습니다.

```ts
// src/function-component.test.ts
it("F144 Root Component 본문이 DOM을 직접 고치면, 다음 update()의 Patch는 그 변경을 모르고 바뀐 곳만 고쳐 화면이 View와 어긋난다", () => {
  const container = createContainer();
  new FunctionComponent(({ on }) => {
    const [count, setCount] = useState(0);
    if (count === 1) {
      const title = container.querySelector("h1");
      if (title !== null) {
        title.textContent = "edited";
      }
    }
    return {
      type: "div",
      props: {},
      children: [
        { type: "h1", props: {}, children: ["title"] },
        createIncrementButton(on, count, setCount),
      ],
    };
  }).mount(container);

  clickButton(container);

  expect(readButtonText(container)).toBe("1");
  expect(container.querySelector("h1")?.textContent).toBe("edited");
});
```

### 이 테스트를 통과시키는 코드

`mount()`와 `update()`에서 DOM에 그리는 줄만 뽑았습니다. Root Component를 부르는 `renderedView()`는 `View`를 돌려줄 뿐 DOM을 건드리지 않습니다.

```ts
// src/function-component.ts

// mount(): 첫 View를 DOM으로 만들어 container에 넣습니다
this.currentView = this.renderedView();
container.replaceChildren(createDomFromVNode(this.currentView));

// update(): 새 View와 직전 View의 차이만 DOM에 반영합니다
const newView = this.renderedView();
const patches = diffViews(this.currentView, newView);
applyPatchesToDom(this.container, patches);
```

`mount()`의 `container.replaceChildren(...)` 줄을 지우면 F1, F8, F144가 실패하고, `update()`의 `applyPatchesToDom(...)` 줄을 지우면 F8과 F144가 실패합니다.

## Component의 로직

> [Root Component만 `FunctionComponent`로 감싸고, 자식 Component는 props를 받아 `VNode`를 돌려주는 함수로 둡니다](adr/render/root-only-function-component.md)

LMS는 "각각의 Component"라고 하지만, 로직(State와 클릭 함수)은 Root Component만 가지도록 범위를 정했습니다.

### 이 결정을 지키는 테스트

| 테스트 | 확인하는 것 | ADR의 줄 |
| ------ | ----------- | -------- |
| F67 | 자식 Component가 props로 받은 글자를 그리고 렌더링마다 한 번씩 불린다 | 결정 |
| F68 | 같은 자식을 다른 props로 두 번 부르면 상태가 바뀐 뒤에도 두 출력이 섞이지 않는다 | 결정 |
| F70 | 한계: 자식 Component의 `useState`는 `Error` 없이 Root Instance의 칸을 써서, 자식을 빼면 Root Component가 자식의 값을 받는다 | CAUTION |

F70은 자식이 이 약속을 어기고 `useState`를 부르면 생기는 일을 보여 줍니다. 자식을 빼자 Root Component의 `name`이 자식의 값 `child`를 받습니다.

```ts
// src/function-component.test.ts
it("F70 한계 — 자식 Component의 useState는 Error 없이 Root Instance의 칸을 써서, 자식을 빼면 Root Component가 자식의 값을 받는다", () => {
  const container = createContainer();
  const createChildWithState = (): VNode => {
    // biome-ignore lint/correctness/useHookAtTopLevel: 자식 Component 안의 Hook이 막히지 않는 한계를 보여 주는 테스트입니다
    const [childValue] = useState("child");
    return { type: "span", props: {}, children: [childValue] };
  };
  new FunctionComponent(({ on }) => {
    const [step, setStep] = useState(0);
    on("next", () => setStep(step + 1));
    const childView = step === 0 ? createChildWithState() : "";
    const [name] = useState("a");
    return {
      type: "div",
      props: {},
      children: [
        createActionButton("next"),
        childView,
        { type: "p", props: {}, children: [name] },
      ],
    };
  }).mount(container);
  expect(container.querySelector("p")?.textContent).toBe("a");

  clickButton(container);

  expect(container.querySelector("p")?.textContent).toBe("child");
});
```

### 이 테스트를 통과시키는 코드

자식 Component는 Root Component 본문에서 불리는 보통 함수입니다. 그래서 자식 안의 `useState`도 렌더링 중인 Root Instance 하나의 `hooks`에서 칸을 찾습니다.

```ts
// src/function-component.ts
export function useState<T>(initialValue: T | (() => T)): [T, StateSetter<T>] {
  const component = getCurrentComponent();
  const cell =
    (component.hooks[hookIndex] as StateCell | undefined) ??
    createStateCell(component, createValueFromInitialValue(initialValue));
  component.hooks[hookIndex] = cell;
  hookIndex++;
  return [cell.value as T, cell.setter as StateSetter<T>];
}
```

코드는 자식의 Hook 호출을 막지 않습니다([`hook-rule-kept-by-convention`](adr/render/hook-rule-kept-by-convention.md)). 그래서 이 결정은 코드 한 줄을 고장 내서 확인할 수 없고, F70이 약속을 어긴 결과를 대신 보여 줍니다.

## L3의 다른 근거

[요구사항 표](requirements/phase-2.md)의 L3 행은 위의 두 결정과 함께, `update()`가 다시 그릴 때의 동작을 정한 두 결정을 근거로 적습니다.

| 결정 (ADR) | 테스트 |
| ---------- | ------ |
| [`update()`는 Root Component 본문을 처음부터 다시 실행해 새 View를 만듭니다](adr/render/update-reruns-root-component-and-makes-new-view.md) | F8, F145 |
| [`update()`는 Root Component 본문을 다시 실행하면서 클릭 함수도 새로 만들어, 이전 렌더링의 클릭 함수를 모두 바꿉니다](adr/render/update-makes-new-click-functions.md) | F59, F60, F116 |
