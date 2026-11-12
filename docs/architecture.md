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
