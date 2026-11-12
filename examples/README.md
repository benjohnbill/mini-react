# Examples

이 예제들은 mini-react의 주요 기능을 사용하는 방법을 설명합니다. 각 이미지를 누르면 설명과 실행 코드로 이동합니다.

저장소 루트에서 Node.js 26으로 실행합니다.

```bash
npm ci
npm run dev
```

아래 실행 주소는 기본 포트 `5173` 기준입니다. 포트가 사용 중이면 터미널에 표시된 주소에 `/examples/<예제 이름>/`을 붙이세요.
개발 서버로 실행하는 예제이며, 기존 `npm run build`의 빌드 대상에는 포함되지 않습니다.

## Hook 사용 규칙

`useState`, `useEffect`, `useMemo`는 Root Component 본문의 최상위에서 렌더링마다 같은 순서로 호출하세요. 조건문·반복문·중첩 함수나 자식 Component 안에서 호출하지 마세요. mini-react는 호출 순서로 Hook의 칸을 찾습니다. 이 규칙은 코드가 모두 검사하지 않으므로 작성할 때 지켜야 합니다.

근거: [Hook 사용 범위](../docs/adr/render/hook-rule-kept-by-convention.md), [호출 순서와 Hook의 칸](../docs/adr/render/hook-cells-are-found-by-call-order.md).


## Root Component를 쓸 때

Root Component 본문은 렌더링마다 처음부터 다시 실행됩니다. 그래서 아래 규칙을 지켜야 칸과 화면이 어긋나지 않습니다.

| 규칙 | 어기면 | 알려 주는 곳 |
| ---- | ------ | ------------ |
| Hook은 Root Component 본문 맨 위에서, 매번 같은 순서로 부릅니다 | 뒤쪽 Hook이 앞쪽 칸의 값을 받습니다 | Biome `useHookAtTopLevel` |
| 클릭 함수 안에서는 Hook을 부르지 않고, 렌더링 때 받은 값과 setter를 씁니다 | `Error` | 실행할 때, Biome |
| 렌더링 중에는 setter를 부르지 않습니다 | `Error` | 실행할 때 |
| 자식 Component는 `function create<이름>` 선언으로 쓰고, Hook을 쓰지 않습니다 | 자식을 빼면 뒤쪽 Hook의 칸이 밀립니다 | Biome (`function` 선언일 때), 리뷰 |
| Root Component는 PascalCase로 짓습니다 (예: `CounterRootComponent`) | Biome이 클릭 함수 안의 Hook을 놓칩니다 | 리뷰 |
| 본문에서 DOM을 직접 고치지 않습니다 | 다음 Patch가 그 변경을 몰라 화면이 View와 어긋납니다 | 리뷰 |

근거 ADR (`docs/adr/` 아래): `render/hook-cells-are-found-by-call-order`, `render/hook-outside-render-throws-error`, `setter/setter-during-render-throws-error`, `render/hook-rule-kept-by-convention`, `team/hook-position-checked-by-lint`, `instance/component-returns-view-and-function-component-draws`.


## Hello World

[![Hello World 실행 화면](hello-world/screenshot.png)](hello-world/README.md)

문자열 하나를 화면에 표시합니다.

**사용 기능:** FunctionComponent, VNode

[설명](hello-world/README.md) · [TypeScript](hello-world/main.ts) · [HTML](hello-world/index.html) · [로컬 실행](http://localhost:5173/examples/hello-world/)

## 카운터

[![카운터 실행 화면](counter/screenshot.png)](counter/README.md)

증가·감소·초기화 버튼으로 숫자를 바꿉니다.

**사용 기능:** useState, on, StateSetter

[설명](counter/README.md) · [TypeScript](counter/main.ts) · [HTML](counter/index.html) · [로컬 실행](http://localhost:5173/examples/counter/)

## 테마 전환

[![테마 전환 실행 화면](theme/screenshot.png)](theme/README.md)

effect로 페이지의 배경을 바꿉니다.

**사용 기능:** useEffect, deps

[설명](theme/README.md) · [TypeScript](theme/main.ts) · [HTML](theme/index.html) · [로컬 실행](http://localhost:5173/examples/theme/)

## 계산 결과 캐시

[![계산 결과 캐시 실행 화면](memo/screenshot.png)](memo/README.md)

입력값의 제곱과 계산 실행 횟수를 표시합니다.

**사용 기능:** useMemo, deps

[설명](memo/README.md) · [TypeScript](memo/main.ts) · [HTML](memo/index.html) · [로컬 실행](http://localhost:5173/examples/memo/)

## 컴포넌트 조합

[![컴포넌트 조합 실행 화면](composition/screenshot.png)](composition/README.md)

같은 Root Component로 독립적인 카운터 두 개를 만듭니다.

**사용 기능:** 자식 Component, props, Root Instance

[설명](composition/README.md) · [TypeScript](composition/main.ts) · [HTML](composition/index.html) · [로컬 실행](http://localhost:5173/examples/composition/)

## 화면 변경과 되돌리기

[![화면 변경과 되돌리기 실행 화면](history/screenshot.png)](history/README.md)

화면 차이를 Patch로 반영하고 이력을 이동합니다.

**사용 기능:** createVNodeFromDom, diffViews, applyPatchesToDom, StateHistory

[설명](history/README.md) · [TypeScript](history/main.ts) · [HTML](history/index.html) · [로컬 실행](http://localhost:5173/examples/history/)

## 장보기 목록 (Vanilla와 비교)

[![장보기 목록 실행 화면](shopping-list/screenshot.png)](shopping-list/README.md)

같은 장보기 목록을 Vanilla 판과 mini-react 판으로 나란히 두고, 클릭 뒤에 입력란의 메모와 버튼의 포커스가 남는지 비교합니다.

**사용 기능:** useState, on, 자식 Component

[설명](shopping-list/README.md) · [TypeScript](shopping-list/main.ts) · [HTML](shopping-list/index.html) · [로컬 실행](http://localhost:5173/examples/shopping-list/)
