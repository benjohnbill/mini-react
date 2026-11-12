# LMS L3의 두 결정: 테스트와 코드

[README의 "LMS 문장 하나가 코드까지 내려가는 길"](../README.md#lms-문장-하나가-코드까지-내려가는-길)에서 이어집니다. LMS L3 "각각의 Component 는 자신만의 로직과 렌더링을 담당합니다."에서 나온 결정 두 개가 어느 테스트와 어느 코드로 내려가는지 적습니다. 코드와 테스트는 2026-11-12 기준 발췌입니다.

## 렌더링

> [`update()`는 Root Component 본문을 처음부터 다시 실행해 새 View를 만듭니다](adr/render/update-reruns-root-component-and-makes-new-view.md)

### 이 결정이 정한 테스트

| 테스트 | 확인하는 것 | ADR의 줄 |
| ------ | ----------- | -------- |
| F8 | 클릭으로 상태를 바꾸면 버튼 글자가 1이 되고 Root Component는 모두 두 번 불린다 | 결정 |
| F145 | 본문의 지역 변수는 `update()`마다 처음 값으로 돌아가, 클릭 함수가 바꿔도 화면은 그대로다 | CAUTION |

```ts
// src/function-component.test.ts
it("F8 클릭으로 상태를 바꾸면 버튼 글자가 1이 되고 Root Component는 모두 두 번 불린다", () => {
  const container = createContainer();
  let renderCount = 0;
  const rootComponent: RootComponent = ({ on }) => {
    renderCount++;
    const [count, setCount] = useState(0);
    return createIncrementButton(on, count, setCount);
  };
  new FunctionComponent(rootComponent).mount(container);

  clickButton(container);

  expect(container.querySelector("button")?.textContent).toBe("1");
  expect(renderCount).toBe(2);
});
```

### 이 테스트를 통과시키는 코드

```ts
// src/function-component.ts
update(): void {
  if (this.container === undefined || this.currentView === undefined) {
    throw new Error("update() needs mount() first");
  }
  const newView = this.renderedView(); // Root Component 본문을 처음부터 다시 실행합니다
  const patches = diffViews(this.currentView, newView);
  applyPatchesToDom(this.container, patches);
  this.currentView = newView;
  this.runPendingEffects();
}
```

`update()`가 `renderedView()`를 부르지 않고 `currentView`를 그대로 쓰도록 고치면 F8이 실패합니다.

## Component의 로직

> [`update()`는 Root Component 본문을 다시 실행하면서 클릭 함수도 새로 만들어, 이전 렌더링의 클릭 함수를 모두 바꿉니다](adr/render/update-makes-new-click-functions.md)

### 이 결정이 정한 테스트

| 테스트 | 확인하는 것 | ADR의 줄 |
| ------ | ----------- | -------- |
| F59 | 클릭 함수는 매번 최신 렌더링의 count를 본다 | 결정 |
| F60 | 첫 렌더링에서만 등록한 이름은 다시 그린 뒤 불리지 않는다 | 결정 |
| F116 | 렌더링이 `Error`로 끝난 뒤에도 직전 렌더링의 클릭 함수가 남아 클릭하면 다시 그린다 | CAUTION |

```ts
// src/function-component.test.ts
it("F59 클릭 함수는 매번 최신 렌더링의 count를 본다", () => {
  const seenCounts: number[] = [];
  const container = createContainer();
  new FunctionComponent(({ on }) => {
    const [count, setCount] = useState(0);
    on("inc", () => {
      seenCounts.push(count);
      setCount(count + 1);
    });
    return createActionButton("inc");
  }).mount(container);

  clickButton(container);
  clickButton(container);
  clickButton(container);

  expect(seenCounts).toEqual([0, 1, 2]);
});
```

### 이 테스트를 통과시키는 코드

```ts
// src/function-component.ts
private renderedView(): VNode {
  const actions = new Map<string, ActionHandler>(); // 렌더링마다 빈 표에서 시작합니다
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
        actions.set(name, handler); // 본문이 on()을 부를 때마다 새 클릭 함수를 적습니다
      },
    });
    this.actions = actions; // 이전 렌더링의 표를 통째로 바꿉니다
    return view;
  } finally {
    currentComponent = undefined;
  }
}
```

`this.actions = actions`를 첫 렌더링에서만 실행하도록 고치면 F59와 F60이 실패합니다.

## L3의 다른 근거

[요구사항 표](requirements/phase-2.md)의 L3 행은 위의 두 결정과 함께 다음 두 결정을 근거로 적습니다.

| 결정 (ADR) | 테스트 |
| ---------- | ------ |
| [Component는 View를 돌려주기까지만 하고, DOM에 그리는 일은 `FunctionComponent`의 `mount()`와 `update()`가 합니다](adr/instance/component-returns-view-and-function-component-draws.md) | F1, F8, F144 |
| [Root Component만 `FunctionComponent`로 감싸고, 자식 Component는 props를 받아 `VNode`를 돌려주는 함수로 둡니다](adr/render/root-only-function-component.md) | F70 |
