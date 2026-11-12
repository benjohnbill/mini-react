# mini-react

mini-react 코드에서 쓰는 이름을 고정합니다. 쓰는 법은 `CONVENTION.md`의 "프로젝트 공통 용어 가이드"에 있습니다.

## 화면 표현

| 용어 | 뜻 | 코드 |
|---|---|---|
| **VNode** | 화면의 한 부분을 설명하는 값으로, 문자열(글자 노드 하나, HTML로 해석하지 않음)이거나 태그와 속성과 자식을 가진 객체입니다. | `VNode` |
| **View** | 화면 전체를 설명하는 최상위 `VNode`입니다. | |
| **Patch** | `View`의 차이를 DOM에 반영하기 위한 지시를 적은 값입니다. | `Patch` |
| **path** | `View`에서 노드까지 내려가는 `children` 번호의 목록이며, `[]`는 `View` 자신입니다. | `Patch`의 `path` |
| **StateHistory** | 저장한 `View`의 목록과 현재 위치이며, 뒤로 간 뒤 새 `View`를 저장하면 앞쪽 `View`를 지웁니다. | `StateHistory` |
| **container** | `View`를 그려 넣는 DOM 요소입니다. | `applyPatchesToDom`의 `container` |

## 검증 페이지

| 용어 | 뜻 | 코드 |
|---|---|---|
| **검증 페이지** | Phase 1의 기능을 화면에서 확인하는 페이지로, 실제 영역, 테스트 영역, 뒤로가기·Patch·앞으로가기 버튼이 있습니다. 데모 페이지와 다릅니다. | `startVerificationPage` |
| **실제 영역** | 검증 페이지에서 Patch가 반영되는 `container`입니다. | `real` |
| **테스트 영역** | 검증 페이지에서 사용자가 HTML을 고치는 입력란이며, Patch를 누르기 전에는 실제 영역에 반영되지 않습니다. | `test` |

## 데모 페이지

| 용어 | 뜻 | 코드 |
|---|---|---|
| **데모 페이지** | `index.html`의 `#demo`에 카운터 Root Component를 `mount`해 Phase 2를 화면에서 확인하는 페이지입니다. 검증 페이지와 다릅니다. | `startDemoPage` |

## 순위 페이지

| 용어 | 뜻 | 코드 |
|---|---|---|
| **순위 페이지** | `index.html`의 `#ranking`에 순위 Root Component를 `mount`해, 클릭마다 세 Hook이 실행되는지 건너뛰는지를 화면에서 확인하는 페이지입니다. 데모 페이지와 다릅니다. | `startRankingPage` |
| **Hook 패널** | 클릭마다 Root Instance의 `hooks`와 `View`를 직전 값과 비교해, 지난 단계와 칸의 결과와 `Patch` 목록을 보여 주는 영역입니다. | `startHookPanel` |
| **단계** | 클릭 하나가 지나는 일곱 구간(`click`, `setter`, `instance`, `render`, `diff`, `patch`, `effect`)으로, `docs/adr/`의 폴더 이름과 같습니다. | `stages` |

## Component와 상태

| 용어 | 뜻 | 코드 |
|---|---|---|
| **Component** | props를 받아 `VNode`를 돌려주는 함수로, 렌더링마다 처음부터 다시 실행되므로 스스로는 상태를 기억하지 못합니다(LMS의 "함수형 컴포넌트"). | |
| **Root Component** | Component 트리의 맨 위에 있고 상태를 가지기로 약속한 유일한 Component입니다. 코드는 자식 Component의 Hook 호출을 막지 않습니다([`hook-rule-kept-by-convention`](docs/adr/render/hook-rule-kept-by-convention.md)). `container`와 다릅니다. | `RootComponent` |
| **자식 Component** | Root Component 본문에서 직접 불리는 Component로, 상태 없이 props만 씁니다. | |
| **props** | Component가 받는 인자 객체입니다. Root Component의 props는 `on` 하나입니다. | |
| **on** | Root Component의 props로 받아 렌더링 중에 클릭 함수를 이름으로 등록하는 함수입니다. | `RootComponentProps`의 `on` |
| **클릭 함수** | `on(name, handler)`으로 이름을 붙여 등록해, 그 이름의 `data-action` 요소가 클릭될 때 불리는 함수입니다. | `ActionHandler` |
| **갱신 함수** | setter에 값 대신 넘기는 `(현재 값) => 새 값` 함수로, setter가 칸의 현재 값으로 불러 그 결과를 새 값으로 씁니다. | |
| **FunctionComponent** | Root Component를 감싸 `hooks`를 보관하고 `mount()`와 `update()`로 그리는 클래스입니다. | `FunctionComponent` |
| **Root Instance** | Root Component를 감싼 `FunctionComponent`의 인스턴스로, 앱에 여러 개 있을 수 있고 각 setter는 자기 인스턴스의 `update()`를 부릅니다. `container`와 다릅니다. | |
| **렌더링** | Root Component를 불러 새 `View`를 돌려받는 일입니다. DOM에 그리는 일은 포함하지 않습니다. | `renderedView` |
| **Component의 로직** | State와 클릭 함수를 함께 부르는 말로, Root Component만 가지고 자식 Component는 값을 props로 받아 그리기만 합니다(LMS의 "자신만의 로직"). | |
| **State(상태)** | 렌더링과 렌더링 사이에 남는 값으로, 칸 하나에 하나씩 들어 있습니다. | `StateCell`의 `value` |
| **hooks** | `FunctionComponent`에서 상태를 Hook 호출 순서대로 담는 배열입니다. | `FunctionComponent`의 `hooks` |
| **칸** | `hooks`의 한 자리로, Hook 호출 하나의 값을 담습니다. | `HookCell` |
| **Hook** | 렌더링 중에만 부를 수 있고 칸 하나를 쓰는 함수의 종류입니다(`useState`, `useEffect`, `useMemo`). | |
| **useState** | 자기 칸의 State와, 그 State를 바꾸는 setter를 돌려주는 Hook입니다. | `useState` |
| **useEffect** | effect와 deps를 받아, deps가 바뀐 렌더링의 DOM 반영 직후 effect를 부르게 하는 Hook입니다. | `useEffect` |
| **effect** | `useEffect`에 넘겨 DOM 반영 직후에 부르게 하는 함수입니다. | `Effect` |
| **정리 함수** | effect가 돌려주는 함수로, 같은 effect가 다시 실행되기 직전에 불립니다. | `Cleanup` |
| **deps** | `useEffect`와 `useMemo`가 다시 실행할지 정하려고 렌더링마다 비교하는 값의 배열입니다. | `Deps` |
| **생명주기** | Root Instance가 effect를 부르는 시점으로, `mount()` 직후와 `update()` 직후 두 가지이며 unmount는 없습니다(LMS의 "생명주기"). | `runPendingEffects` |
| **useMemo** | 계산 함수와 deps를 받아, deps가 바뀐 렌더링에서만 다시 계산한 값을 돌려주는 Hook입니다. | `useMemo` |
| **setter** | `useState`가 돌려주는 함수로, 새 값이나 갱신 함수를 받아 칸을 바꾸고 `update()`를 부릅니다. | `StateSetter` |

## 테스트

| 용어 | 뜻 | 코드 |
|---|---|---|
| **단위 테스트** | 내보낸 함수 하나를 불러 그 결과를 확인하는 테스트입니다. | |
| **기능 테스트** | `index.html`과 같은 마크업에서 페이지 시작 함수를 부르고, 클릭으로 화면이 바뀌는지 확인하는 테스트입니다(jsdom). | |
