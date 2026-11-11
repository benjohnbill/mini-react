---
kind: requirements
source: LMS learning/1307 (Phase 2, 과제 개요, 공통 문장)
status: 2026-11-11 기준
---

# Phase 2 요구사항 표

- **충족:** 채점자가 LMS 문장을 읽고 지금의 코드, 테스트, 데모를 통과시킨다 · **부분:** 남은 일이 있다 · **미충족** · **대상 아님:** 코드로 판정할 수 없는 문장.
- **근거:** 그 판정을 만든 결정의 ADR 파일 이름(`docs/adr/`)입니다. 테스트는 ADR의 마지막 줄 `결정:`과 `CAUTION:`이 들고 있습니다. LMS가 동작을 직접 정해 ADR이 없는 줄만 `(테스트: …)`를 직접 적습니다.
- **고치는 법:** 판정이 바뀌는 변경을 하면 같은 PR에서 이 줄을 고칩니다. 근거에 적은 ADR 이름은 `npm run check`가 파일이 있는지 확인합니다.

## 요약

- 충족 34, 대상 아님 3 (L31, L32, L37).
- 판정에 반영한 수정: L27 데모를 자식 Component로 나눔(`demo-splits-view-into-child-components`), L36 렌더링 `Error` 뒤 클릭 함수가 사라져 페이지가 멈추던 버그 수정(`render-error-keeps-previous-render`).
- 판정 밖에서 볼 것: `README.md`의 동작 흐름 그림이 Phase 2를 담지 않습니다. README는 팀이 최종 코드에서 씁니다.

| ID | LMS 문장 | 충족 | 근거 | 남은 일 |
|---|---|---|---|---|
| L1 | 기존 React 의 핵심 기능인 Component · State · Hooks 를 직접 구현하고 이를 활용하여 동작하는 웹 페이지를 만들어 보는 것입니다. | 충족 | root-only-function-component, demo-page-is-one-counter, zero-runtime-dependencies | — |
| L2 | Component 는 UI 를 나누는 작은 단위입니다. | 충족 | root-only-function-component (자식 Component를 props를 받아 `VNode`를 돌려주는 함수로 정함, F67~F69가 UI를 자식으로 나눔) | — |
| L3 | 각각의 Component 는 자신만의 로직과 렌더링을 담당합니다. | 충족 | component-returns-view-and-function-component-draws, root-only-function-component | — |
| L4 | 반드시 함수형 컴포넌트 로 구현합니다. | 충족 | root-only-function-component | — |
| L5 | 함수형 컴포넌트를 감싸는 FunctionComponent 클래스를 직접 만듭니다. | 충족 | root-only-function-component | — |
| L6 | 이 클래스에는 아래 기능이 필요합니다. hooks 배열 (상태 저장용) | 충족 | hook-cells-are-found-by-call-order | — |
| L7 | mount(): 처음 렌더링 | 충족 | root-instance-keeps-container-and-current-view, component-returns-view-and-function-component-draws | — |
| L8 | update(): 상태 변경 후 다시 렌더링 | 충족 | root-instance-keeps-container-and-current-view, setter-updates-without-batching, update-before-mount-throws-error | — |
| L9 | Hook 은 최상위 컴포넌트에서만 사용 가능합니다. | 충족 | hook-rule-kept-by-convention, hook-outside-render-throws-error, root-only-function-component | — |
| L10 | State (상태) 는 "최상위 컴포넌트 (루트 컴포넌트)" 에서만 관리합니다. | 충족 | root-only-function-component | — |
| L11 | 자식 컴포넌트는 state (상태) 를 가지지 않고, 부모로부터 전달받은 props 만 사용합니다. (Lifting State Up 패턴) | 충족 | root-only-function-component, child-reports-click-with-data-action-string | — |
| L12 | 즉, 자식 컴포넌트는 상태 없이 (Stateless) props 만 받아서 사용하는 순수 함수로 구현합니다. | 충족 | root-only-function-component, child-reports-click-with-data-action-string, hook-rule-kept-by-convention | — |
| L13 | State 는 값이 변경될 수 있는 동적 데이터입니다. | 충족 | (테스트: F8, F20, F21, F22) | — |
| L14 | State 가 바뀌면 → 화면이 자동으로 다시 그려져야 합니다. | 충족 | setter-updates-without-batching, setter-skips-same-value | — |
| L15 | 함수형 컴포넌트에서도 상태와 생명주기를 사용할 수 있게 해주는 기능입니다. | 충족 | effect-runs-right-after-dom-update, cleanups-run-before-effects-in-order, no-unmount-so-cleanup-runs-only-before-rerun | — |
| L16 | 최소 구현 대상: useState | 충족 | hook-cells-are-found-by-call-order, initial-value-function-is-called-once, setter-accepts-updater-function, setter-skips-same-value, setter-updates-without-batching | — |
| L17 | 최소 구현 대상: useEffect | 충족 | effect-runs-right-after-dom-update, deps-compare-each-item-with-object-is, cleanups-run-before-effects-in-order, effect-non-function-return-is-ignored, effect-error-propagates-after-dom-update, setter-in-effect-updates-immediately, no-unmount-so-cleanup-runs-only-before-rerun | — |
| L18 | 최소 구현 대상: useMemo | 충족 | memo-computes-during-render-and-keeps-any-value, deps-compare-each-item-with-object-is | — |
| L19 | "함수는 매번 새로 실행되는데, 상태는 어떻게 유지할까?" → 이 문제를 해결하는 것이 Hooks 의 핵심입니다. | 충족 | hook-cells-are-found-by-call-order, root-instance-keeps-container-and-current-view | — |
| L20 | Phase 2 의 상태가 변경되어 다시 렌더링할 때, Phase 1 에서 만든 Virtual DOM 을 그대로 활용합니다. | 충족 | root-instance-keeps-container-and-current-view | — |
| L21 | 동작 흐름: Virtual DOM 생성 | 충족 | component-returns-view-and-function-component-draws | — |
| L22 | 이전 Virtual DOM 과 비교 (Diff) | 충족 | root-instance-keeps-container-and-current-view | — |
| L23 | 바뀐 부분만 실제 DOM 에 반영 (Patch) | 충족 | root-instance-keeps-container-and-current-view, patch-kinds-are-text-replace-props-insert-remove, path-is-children-index-list-from-view | — |
| L24 | 목표: 전체를 다시 그리지 않고 필요한 부분만 업데이트 | 충족 | root-instance-keeps-container-and-current-view, setter-skips-same-value | — |
| L25 | Phase 1 과 Phase 2 에서 구현한 내용을 활용하여 브라우저에서 동작하는 웹 페이지를 구현합니다. | 충족 | demo-page-is-one-counter, verification-test-area-is-html-textarea, verification-patch-compares-against-real-area | — |
| L26 | 어떤 주제라도 상관 없습니다. 다만, 반드시 사용자의 입력/클릭 등에 따라 화면이 변경되어야 합니다. | 충족 | demo-page-is-one-counter, click-wires-through-data-action-and-actions-table, only-click-events-are-wired | — |
| L27 | UI 를 어떻게 Component 로 나눌 것인가? | 충족 | root-only-function-component, demo-splits-view-into-child-components | — |
| L28 | State (상태) 는 어디에 두는 것이 좋은가? | 충족 | root-only-function-component | — |
| L29 | setState 는 상태 변경 외에 무엇을 해야 할까? | 충족 | setter-updates-without-batching, setter-skips-same-value, setter-in-effect-updates-immediately | — |
| L30 | 여러 상태 변경을 한 번에 처리하는 방법은? | 충족 | setter-updates-without-batching | — |
| L31 | Batching 방법을 고민해 보세요. 단 선택 과제입니다. | 대상 아님 | 선택 과제라 구현 여부를 판정하지 않음 (구현은 하지 않았음: setter-updates-without-batching) | — |
| L32 | 이번에 구현한 React 와 실제 React 의 차이점에 대해서 공부해 보세요. | 대상 아님 | 공부 항목이라 코드로 판정할 수 없음 (참고: "(범위)"가 붙은 ADR 5개가 차이를 기록함) | — |
| L33 | 단위 테스트 를 통해 각 모듈 (Virtual DOM 변환, Diff, Patch, useState, useEffect, useMemo 등) 을 검증합니다. | 충족 | (테스트: T1, D1, P1, H1, F16, F71, F94) | — |
| L34 | 기능 테스트를 통해 화면이 제대로 동작하는지 확인합니다. | 충족 | verification-page-tested-in-jsdom-without-browser-runner, demo-page-is-one-counter | — |
| L35 | 테스트 영역에 다양한 태그와 요소를 추가해 여러 동작과 변화를 자유롭게 확인해 보세요. | 충족 | verification-test-area-is-html-textarea, verification-patch-compares-against-real-area | — |
| L36 | 엣지 케이스를 최대한 고려 합니다. | 충족 | setter-skips-same-value, deps-compare-each-item-with-object-is, hook-outside-render-throws-error, update-before-mount-throws-error, render-error-keeps-previous-render, effect-error-propagates-after-dom-update, effect-non-function-return-is-ignored, mount-can-be-called-once, root-instances-are-independent, updater-error-leaves-state-unchanged, setter-is-same-function-every-render, setter-during-render-throws-error, on-outside-render-throws-error, same-action-name-last-registration-wins | 검토하고 범위 밖으로 뺀 경우(테스트 없음): `useMemo` 계산 함수 안의 `useState`(Hook 규칙 위반, `hook-rule-kept-by-convention`), 글자 노드에 보낸 클릭(실제 브라우저의 클릭 대상은 요소), `data-action=""`(쓰는 화면 없음), 클릭 함수가 `Error`를 던진 뒤의 클릭(브라우저가 리스너를 지킴), effect 안 setter의 끝없는 반복(`setter-in-effect-updates-immediately`의 CAUTION), `main.ts`를 직접 부르는 테스트(시작 함수 테스트가 대신함). |
| L37 | 이력서와 포트폴리오에 포함할 수 있을 만큼 완성도 높은 수준으로 구현합니다. | 대상 아님 | 품질 목표라 코드로 판정할 수 없음 (참고: `README.md`의 동작 흐름 그림이 Phase 2를 담지 않음) | — |


## 판정에 쓴 해석

- **L9 "Hook 은 최상위 컴포넌트에서만 사용 가능합니다":** 앱을 쓰는 사람이 지키는 설계 제약으로 읽었습니다. 같은 "제약조건" 아래의 L10~L12와 같은 성격입니다. 자식에서 Hook을 부르면 `Error`를 내는 실행 중 검사는 요구로 보지 않았습니다. 검사를 요구로 읽으면 `부분`입니다. 자식의 `useState`는 `Error` 없이 Root Instance의 칸을 쓰기 때문입니다(F70). 그때 남은 일은 Root Component가 자식을 부르는 동안 Hook 호출을 막는 것과, 자식의 `useState`가 `Error`를 내는 테스트입니다.
- **L26 "입력/클릭 등":** 예시를 늘어놓은 말로 읽었습니다. 사용자 동작 한 종류로 화면이 바뀌면 충족입니다. 데모는 클릭으로 숫자, 짝수와 홀수 표시, 문서 제목을 바꿉니다. 입력과 클릭을 둘 다 요구로 읽으면 `부분`입니다. `input` 이벤트는 연결되지 않기 때문입니다(only-click-events-are-wired). 다만 같은 페이지의 검증 페이지는 입력란에 친 HTML을 Patch 버튼으로 반영합니다.
- **L27 "UI 를 어떻게 Component 로 나눌 것인가?":** 발표용 토론 질문이 아니라, 제출한 페이지 코드가 보여 줘야 하는 설계로 읽었습니다. 그래서 테스트 안의 자식 Component(F67~F69)만으로는 부족하고, 데모 페이지에 나눔이 있어야 충족입니다.
- **L2, L3, L11, L12 (정의 문장과 제약):** 코드와 테스트가 그 개념을 지원하고, 어기는 곳이 없으면 충족으로 보았습니다. 데모 페이지에 자식 Component가 없는 점은 L27에서 한 번만 셌습니다.
- **L3 "렌더링":** Component가 `VNode`를 돌려주는 일로 읽었습니다(`GLOSSARY.md`의 렌더링). DOM에 그리는 일은 `FunctionComponent`가 맡아도 됩니다.
- **L15 "생명주기":** `mount()` 직후와 `update()` 직후로 읽었습니다. LMS가 unmount를 적지 않았으므로 unmount가 없는 것은 감점하지 않았습니다.
- **L19, L28, L29, L30 (핵심 질문과 중점 질문):** 코드가 답을 담고 있고 그 답이 결정으로 기록되어 있으면 충족으로 보았습니다. L30의 답은 "setter 호출을 모으지 않는다"이고, Batching 구현은 L31에 따라 선택입니다.
- **L31, L32, L37:** L31은 선택 과제라서, L32는 공부 항목이라서, L37은 품질 목표라서 코드로 판정하지 않았습니다.
- **L20 "그대로 활용":** Phase 1 모듈(`vnode.ts`, `diff.ts`, `patch.ts`)을 고치지 않고 부르는 것으로 읽었습니다. Phase 2는 세 파일의 코드를 바꾸지 않습니다(주석 제외).
- **L24 "필요한 부분만":** key가 없어 목록 앞에 항목을 넣으면 여러 `TEXT` Patch가 생기지만, 전체를 다시 그리지는 않으므로 충족으로 보았습니다. F9는 버튼 요소와 글자 노드가 같은 객체로 남는 것을 확인합니다.
- **L33 "단위 테스트":** 모듈마다 내보낸 함수를 부르는 테스트 묶음이 있으면 충족으로 보았습니다. `function-component.test.ts`는 Hook을 `mount`와 클릭으로 부르는데, 모듈 하나를 검사하므로 단위 테스트로 셌습니다.
- **L35 "테스트 영역":** 검증 페이지의 HTML 입력란으로 읽었습니다(`GLOSSARY.md`의 테스트 영역). 어떤 태그든 넣고 Patch로 변화를 볼 수 있으면 충족입니다.
- **L36 "최대한":** 끝이 없는 기준이라서, 테스트와 ADR이 다룬 범위에 더해 직접 찾은 열린 경우가 남아 있는지로 판정했습니다.
