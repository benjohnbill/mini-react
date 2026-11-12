# 단계와 값

`README.md`의 Architecture 절에서 덜어 낸 자세한 표입니다.

## 단계

단계는 데이터가 지나가는 구간이고, `docs/adr/`의 폴더 이름과 같습니다. 결정은 그 결정을 지키는 테스트가 부르는 모듈의 단계에 둡니다.

| Phase | 단계 | 하는 일 | 대표 LMS 문장 | 닿는 LMS 문장 | ADR |
| ----- | ---- | ------- | ------------- | ------------- | --- |
| 1 | [`vnode`](adr/vnode/README.md) | DOM과 `VNode`를 서로 바꿉니다 | S4 "브라우저의 DOM 정보를 읽어서 Virtual DOM 으로 변환하는 함수를 작성합니다." | 3 | 14 |
| 1 | [`diff`](adr/diff/README.md) | 두 `View`를 비교해 `Patch` 목록을 만듭니다 | S5 "두 Virtual DOM 을 비교하여 변경된 부분을 찾아내는 Diff 알고리즘을 작성합니다." | 3 | 8 |
| 1 | [`patch`](adr/patch/README.md) | `Patch` 목록을 DOM에 적용합니다 | S31 "Diff 알고리즘: 실제 DOM 에 반영 방법" | 9 | 9 |
| 1 | [`history`](adr/history/README.md) | 저장한 `View`의 목록과 현재 위치를 가집니다 | S16 "새로 변경된 Virtual DOM 은 State History 에 저장합니다." | 2 | 5 |
| 2 | [`click`](adr/click/README.md) | DOM 클릭을 `actions` 표의 함수 호출로 바꿉니다 | L26 "반드시 사용자의 입력/클릭 등에 따라 화면이 변경되어야 합니다." | 4 | 5 |
| 2 | [`setter`](adr/setter/README.md) | 함수가 칸을 바꾸고 `update()`를 부릅니다 | L14 "State 가 바뀌면 → 화면이 자동으로 다시 그려져야 합니다." | 9 | 8 |
| 2 | [`instance`](adr/instance/README.md) | Root Instance가 `mount`와 `update`로 한 번의 흐름을 지휘합니다 | L8 "update(): 상태 변경 후 다시 렌더링" | 10 | 6 |
| 2 | [`render`](adr/render/README.md) | 칸을 읽어 Root Component를 실행하고 새 `View`를 만듭니다 | L6 "hooks 배열 (상태 저장용)" | 16 | 9 |
| 2 | [`effect`](adr/effect/README.md) | DOM 반영 직후 effect와 정리 함수를 부릅니다 | L17 "최소 구현 대상: useEffect" | 4 | 8 |

- **닿는 LMS 문장:** 요구사항 표([Phase 1](requirements/phase-1.md), [Phase 2](requirements/phase-2.md))에서 그 단계의 ADR을 근거로 적은 문장의 수입니다.
- **ADR:** 대체된 ADR 2개를 뺀 수입니다. 흐름 밖의 폴더는 `verification-page` 16, `demo-page` 2, `team` 11입니다.

## LMS L16이 결정 다섯 개로 퍼지는 길

LMS L16은 "최소 구현 대상: useState" 한 줄입니다. 이 한 줄을 구현하려면 다섯 가지를 정해야 했고, 결정마다 ADR 하나와 테스트가 있습니다.

| 단계 | 결정 (ADR) | 모르고 쓰면 | 테스트 |
| ---- | ---------- | ----------- | ------ |
| `render` | [Hook의 칸은 렌더링마다 0부터 다시 세는 호출 순서로 찾습니다](adr/render/hook-cells-are-found-by-call-order.md) | 조건에 따라 Hook 호출을 건너뛰면, 뒤쪽 Hook이 앞쪽 Hook의 칸 값을 받습니다 | F8, F17, F20, F21, F101, F102, F139, F42, F70 |
| `render` | [초깃값이 함수이면 첫 렌더링에서 한 번 불러 그 결과를 씁니다](adr/render/initial-value-function-is-called-once.md) | `useState(myFn)`은 `myFn()`의 반환값을 저장합니다 | F17, F19 |
| `setter` | [setter에 함수를 넘기면 칸의 현재 값으로 불러 그 결과를 새 값으로 씁니다](adr/setter/setter-accepts-updater-function.md) | `setFn(myFn)`은 `myFn(현재 값)`의 반환값을 저장합니다 | F23, F35, F38, F25 |
| `setter` | [새 값이 칸의 값과 같으면(`Object.is`) `update()`를 부르지 않습니다](adr/setter/setter-skips-same-value.md) | 배열을 `push`로 고친 뒤 같은 배열을 넘기면 화면이 바뀌지 않습니다 | F18, F24, F27~F31, F33, F36, F32, F34 |
| `setter` | [칸에 새 값을 쓴 뒤 바로 `update()`를 부르고, 여러 호출을 모으지 않습니다 (범위)](adr/setter/setter-updates-without-batching.md) | 클릭 한 번에 setter를 두 번 부르면 렌더링도 두 번 일어납니다 | F37, F35 |

코드는 `src/function-component.ts`의 `useState`와 `createStateCell`입니다. 네 번째 결정은 [Demo](../README.md#demo)의 순위 페이지에서 5점인 사람의 `+`를 누르면 볼 수 있습니다.

## Core Data Structures

| 값 | 뜻 | 만드는 단계 → 쓰는 단계 |
| --- | --- | --- |
| `VNode` | 화면의 한 부분을 설명하는 값. 맨 위의 `VNode`가 `View`입니다 | `render`, `vnode` → `diff` |
| `Patch` | DOM에 반영할 지시 하나. `path`는 `View`에서 노드까지 내려가는 `children` 번호의 목록입니다 | `diff` → `patch` |
| `HookCell` | Hook 호출 하나의 값을 담는 칸. `hooks` 배열에 호출 순서대로 들어 있습니다 | `setter`, `render` → 다음 `render` |

```ts
type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

type Patch =
  | { type: "TEXT"; path: number[]; text: string }
  | { type: "REPLACE"; path: number[]; node: VNode }
  | { type: "PROPS"; path: number[]; set: Record<string, string>; remove: string[] }
  | { type: "INSERT"; path: number[]; node: VNode }
  | { type: "REMOVE"; path: number[] };

type StateCell = { value: unknown; setter: StateSetter<unknown> };
type EffectCell = { deps: Deps | undefined; cleanup: Cleanup | undefined; version: number };
type MemoCell = { deps: Deps | undefined; value: unknown };
type HookCell = StateCell | EffectCell | MemoCell;
```

순위 페이지에서 6위인 사람의 `+`를 한 번 누른 뒤의 값입니다.

```text
hooks[0]  StateCell   value: { …, p06: 2 }                  1 → 2
hooks[3]  MemoCell    deps: [scores, track]                 scores가 바뀌어 다시 계산
hooks[4]  EffectCell  deps: ["p02"]                         1위가 그대로라 건너뜀

patches   { type: "TEXT", path: [0, 1, 5, 3, 0], text: "2" }   동료 평가의 점수
          { type: "TEXT", path: [1, 3, 5, 2, 0], text: "2" }   순위표의 점수
```
