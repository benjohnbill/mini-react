---
kind: requirements
source: LMS learning/1307 (Phase 1, 기술 스택, 공통 학습 원칙, Phase 1 중점 포인트)
status: 2026-11-11 기준
---

# Phase 1 요구사항 표

- **충족:** 채점자가 LMS 문장을 읽고 지금의 코드, 테스트, 페이지를 통과시킨다 · **부분:** 남은 일이 있다 · **미충족** · **대상 아님:** 코드로 판정할 수 없는 문장.
- **근거:** 그 판정을 만든 결정의 ADR 파일 이름(`docs/adr/`)입니다. LMS가 동작을 직접 정해 ADR이 없는 줄만 `(테스트: …)`를 직접 적습니다. 판정이 바뀌는 변경을 하면 같은 PR에서 이 줄을 고치고, 근거에 적은 ADR 이름은 `npm run check`가 파일이 있는지 확인합니다.
- **범위:** 과제 개요의 Phase 1 부분, Phase 1 절, 기술 스택, 공통 학습 원칙, Phase 1 중점 포인트입니다. 단위·기능 테스트, 엣지 케이스, 완성도 문장은 Phase 2 표의 L33~L37이 한 번 판정했습니다.

## 요약

- **충족 23, 부분 3, 미충족 0, 대상 아님 6** (S1~S32). 부분은 S24, S25, S28이고 모두 "중점 포인트"(공부 주제) 문장입니다.
- 실행: `typecheck`, `check`, `test`, `build`가 모두 통과했습니다(2026-11-11). 실제 브라우저로 눌러 보는 확인은 하지 않았습니다(jsdom과 `vite build`).

| ID | LMS 문장 | 충족 | 근거 | 남은 일 |
|---|---|---|---|---|
| S1 | 두 단계에 걸쳐 "동작하는 미니 리액트" 를 직접 구현합니다. (Phase 1: Virtual DOM + Diff 알고리즘 + Patch) | 충족 (Phase 1 범위) | core-public-function-names, applying-diff-patches-makes-dom-equal-new-view | 두 번째 단계(Hook)는 이 채점의 범위 밖. "직접"은 과정 문장이라 판정하지 않음 |
| S2 | 최종 결과물은 사용자의 입력/클릭 등에 따라 부분 업데이트되는 동작하는 웹 페이지입니다. | 충족 | unchanged-nodes-stay-the-same-object, verification-patch-compares-against-real-area, verification-areas-change-only-on-patch | 실제 브라우저에서 눌러 보는 확인은 이 채점에서 하지 않음(jsdom과 `vite build`만) |
| S3 | React 의 핵심 개념인 Virtual DOM 과 Diff 알고리즘을 구현합니다. | 충족 | core-public-function-names, applying-diff-patches-makes-dom-equal-new-view | — |
| S4 | 브라우저의 DOM 정보를 읽어서 Virtual DOM 으로 변환하는 함수를 작성합니다. | 충족 | core-public-function-names, vnode-children-match-dom-children-by-number, comments-are-dropped-from-vnode-only, tag-name-is-lowercase-type, text-nodes-keep-whitespace-and-resolved-entities, input-value-prop-is-dot-value, only-text-like-inputs-count-as-input-fields | `createVNodeFromDom`은 요소만 받음. `textarea`, `select`, `checkbox`, `radio`, `file`, SVG, `<template>`는 ADR textarea-select-svg-template-are-not-covered가 변환 대상이 아니라고 밝힘(그 ADR에는 지키는 테스트가 없음) |
| S5 | 두 Virtual DOM 을 비교하여 변경된 부분을 찾아내는 Diff 알고리즘을 작성합니다. | 충족 | diff-compares-same-index-children-first, tag-change-is-one-replace, text-change-is-one-text-patch-without-trimming, props-patch-separates-missing-from-empty, same-content-views-give-empty-patch-list, diff-emits-props-before-child-patches | `key` 비교가 없어 같은 번호끼리만 비교함(ADR diff-compares-same-index-children-first가 밝힘) |
| S6 | 이 알고리즘을 검증할 수 있는 웹 페이지를 구현합니다. | 충족 | verification-test-area-is-html-textarea, verification-page-tested-in-jsdom-without-browser-runner | — |
| S7 | 페이지 내에 다음과 같이 2개의 영역과 Patch, 뒤로가기, 앞으로가기 버튼들이 있어야 합니다. | 충족 | verification-page-has-two-areas-and-three-buttons, verification-test-area-is-html-textarea | — |
| S8 | 실제 영역 | 충족 | path-is-children-index-list-from-view, verification-areas-change-only-on-patch | — |
| S9 | 테스트 영역 | 충족 | verification-test-area-is-html-textarea, verification-areas-change-only-on-patch | — |
| S10 | 웹 페이지를 로드하면 "실제 영역" 의 샘플 HTML 코드를 Virtual DOM 트리로 변환합니다. | 충족 | verification-load-shows-sample-view-in-both-areas, sample-html-is-not-indented, verification-comments-removed-and-text-merged-before-saving | — |
| S11 | 방금 만든 Virtual DOM 을 이용하여 테스트 영역을 렌더링합니다. | 충족 | verification-test-area-is-html-textarea, verification-load-shows-sample-view-in-both-areas | 해석 1 참고 |
| S12 | 사용자가 "테스트 영역" 에 있는 샘플 HTML 코드를 자유롭게 수정합니다. | 충족 | verification-test-area-is-html-textarea, verification-invalid-html-follows-browser-repair, verification-top-level-needs-exactly-one-element | 최상위 요소가 정확히 하나여야 하고, 아니면 반영 거절(ADR이 밝힘) |
| S13 | Patch 버튼을 누르면 현재 테스트 영역 상태를 다시 Virtual DOM 으로 만듭니다. | 충족 | verification-patch-reads-test-area-through-template, verification-patch-strips-executable-content, verification-comments-removed-and-text-merged-before-saving | 읽는 중 `script`, `on*` 속성, `javascript:` URL 등을 지워서, 사용자가 쓴 것과 View가 다를 수 있음(ADR이 밝힘). ADR verification-patch-reads-test-area-through-template에는 지키는 테스트가 없음(jsdom이 재현 못 함) |
| S14 | Diff 알고리즘을 이용해서 이전 Virtual DOM 과 비교하여 변경된 부분을 찾습니다. | 충족 | verification-patch-compares-against-real-area, same-content-views-give-empty-patch-list | 해석 2 참고. 이력의 현재 View가 아니라 실제 영역을 다시 읽은 View와 비교함 |
| S15 | 변경된 부분만 "실제 영역" 에 렌더링합니다. | 충족 | unchanged-nodes-stay-the-same-object, patch-kinds-are-text-replace-props-insert-remove, verification-patch-log-shows-last-patches | — V75가 MutationObserver 기록 1건만 있음을 확인함 |
| S16 | 새로 변경된 Virtual DOM 은 State History 에 저장합니다. | 충족 | history-push-drops-forward-views, history-stores-and-returns-clones, verification-history-push-only-when-view-differs, history-saves-equal-content-and-page-filters | 바뀐 것이 없으면(`diffViews`가 빈 목록) 저장하지 않음 |
| S17 | 뒤로가기, 앞으로가기 버튼을 눌러 state history 에 저장된 특정 Virtual DOM 으로 이동 가능하며 "실제 영역", "테스트 영역" 도 함께 변경되어야 합니다. | 충족 | history-moves-return-null-at-edges, history-method-names-follow-browser-history, verification-back-forward-discards-unsaved-edits | 한 칸씩 이동만 가능(임의 지점 이동 없음). Patch하지 않은 테스트 영역 편집은 이동 때 사라짐(ADR이 밝힘) |
| S18 | HTML, CSS, Javascript (또는 Typescript) — Vanilla | 충족 | zero-runtime-dependencies | Vite, Vitest, jsdom, Biome, TypeScript는 개발 도구. ADR 자체가 "팀의 확인이 필요"하다고 적음 |
| S19 | 외부 프레임워크 (React, Vue 등) 사용 금지 | 충족 | zero-runtime-dependencies | `package.json`에 `dependencies` 없음, `src`에 react/vue import 없음. 위와 같은 확인 필요 |
| S20 | "학습" 보다는 "구현" 이 우선입니다. AI 등을 적극적으로 활용하여 결과물을 만들어내는 것이 최우선 목표입니다. | 대상 아님 | - | 목표 문장 |
| S21 | 다만, 만들어진 결과물 중 핵심 로직에 대해서는 이해하고 설명할 수 있어야 합니다. | 대상 아님 | - | 사람이 설명하는 일. 코드로 판정 못 함 |
| S22 | 코드를 직접 작성하기 어려운 경우, 전체 코드를 AI 를 통해 생성해도 괜찮습니다. 다만, 생성된 코드를 반드시 학습하고 그 원리를 이해해야 합니다. | 대상 아님 | - | 과정 문장 |
| S23 | 추가적으로, 다른 팀과의 차별점을 둘 수 있는 추가 구현 요소 에 대해서도 함께 고민해 보시기 바랍니다. | 대상 아님 | - | 고민하라는 권유. Phase 1 코드에 추가 구현 요소는 없음 |
| S24 | 브라우저에서 DOM 을 다루는 방법 (Document, Window) | 부분 | vnode-children-match-dom-children-by-number, string-vnode-is-text-not-html | `Document` 쪽은 코드가 답함(`createElement`, `createTextNode`, `childNodes`, `<template>`). `Window`는 `src`의 비테스트 코드에서 쓰지 않고 어떤 ADR도 다루지 않음 |
| S25 | 실제 DOM 의 변화를 감지 하기 위한 브라우저 API | 부분 | - (ADR 없음) | `MutationObserver`를 테스트 4곳(`verification-page.test.ts`, `history-restore.test.ts`, `patch.test.ts`, `diff-patch.test.ts`)이 부분 업데이트 증명에 씀. 앱 코드는 쓰지 않고, 이를 답으로 적은 ADR이나 문서가 없음 |
| S26 | 실제 DOM 이 느린 이유 (Reflow / Repaint 관점) | 대상 아님 | - | 저장소 어디에도 reflow, repaint가 없음. 순수 학습 주제 |
| S27 | Virtual DOM 구조 | 충족 | tag-name-is-lowercase-type, string-vnode-is-text-not-html, vnode-children-match-dom-children-by-number, text-nodes-keep-whitespace-and-resolved-entities, comments-are-dropped-from-vnode-only | `GLOSSARY.md`의 VNode, View 정의와 `src/vnode.ts`의 `VNode` 타입이 일치 |
| S28 | Virtual DOM 이 필요한 이유 | 부분 | unchanged-nodes-stay-the-same-object | ADR은 "바뀌지 않은 노드를 새로 만들면 포커스와 입력값이 사라진다"는 이유를 기록함. Virtual DOM 층이 왜 필요한가를 직접 답한 문장은 없음 |
| S29 | Diff 알고리즘 동작 방식 | 충족 | diff-compares-same-index-children-first, diff-emits-props-before-child-patches, tag-change-is-one-replace, text-change-is-one-text-patch-without-trimming | `src/diff.ts` 83줄이 ADR과 일치 |
| S30 | Diff 알고리즘: 최소 변경을 찾기 위한 5가지 핵심 케이스 | 충족 | patch-kinds-are-text-replace-props-insert-remove | `TEXT`, `REPLACE`, `PROPS`, `INSERT`, `REMOVE` 다섯 종류가 `src/patch.ts`와 `src/diff.ts`에 있음. 각각의 결정도 별도 ADR(tag-change-is-one-replace, props-patch-separates-missing-from-empty 등)에 있음 |
| S31 | Diff 알고리즘: 실제 DOM 에 반영 방법 | 충족 | patch-path-follows-tree-after-earlier-patches, path-is-children-index-list-from-view, applying-diff-patches-makes-dom-equal-new-view, patch-error-does-not-roll-back, patch-error-names-the-path | `applyPatchesToDom`은 실패해도 되돌리지 않고, 검증 페이지가 실제 영역을 다시 그림(ADR verification-error-redraws-real-area-from-current-view) |
| S32 | React 에서 실제 DOM 을 변경할 때, Virtual DOM 과 Diff 알고리즘의 동작 방식 | 대상 아님 | - | React 자체의 동작을 공부하라는 주제. `README.md`의 흐름 그림이 이 저장소의 흐름은 보여 주지만 React의 설명은 아님 |

## 판정에 쓴 해석

- **S11 "테스트 영역을 렌더링":** View를 HTML 원문으로 바꿔 `textarea`에 쓰는 일로 읽었습니다. S12가 "HTML 코드를 수정"이라서입니다. 렌더된 DOM을 직접 고치는 방식을 기대하면 이 행은 달라집니다.
- **S14 "이전 Virtual DOM":** `StateHistory`의 현재 View가 아니라 Patch 때 실제 영역을 다시 읽은 View로 읽었습니다. 둘은 실제 영역 입력칸에 직접 친 값이 없으면 같고, `verification-patch-compares-against-real-area`가 이 선택을 기록합니다.
- **S1:** Phase 1 부분만 판정했습니다.
- **S2 "부분 업데이트되는 동작하는 웹 페이지":** 검증 페이지의 Patch와 이동이 jsdom에서 변경 1건으로 동작하고 `vite build`가 통과하는 것으로 읽었습니다.
- **S12 "자유롭게 수정":** 최상위가 요소 하나인 HTML 안의 모든 편집으로 읽었습니다. 최상위가 둘이면 거절하는 제한은 ADR이 밝힌 설계로 받아들였습니다.
- **S16 "새로 변경된 View를 저장":** 바뀐 것이 없으면 저장하지 않는 것이 문장에 맞다고 읽었습니다.
- **S24~S28, S32 (중점 포인트):** 코드가 답하고 ADR이 그 답을 적었을 때만 충족으로 읽었습니다. S24는 `Document`만, S25는 테스트 안에서만, S28은 이유의 한 면만 답해서 부분입니다. S26과 S32는 코드가 답하지 않는 학습 주제라 대상 아님입니다.
- **S18, S19:** ADR `zero-runtime-dependencies`의 "개발 도구는 허용" 해석을 받아 충족으로 했습니다. 팀의 확인이 남아 있습니다.

## 열린 것

- **S24, S25, S28 (부분 3개):** 코드가 아니라 설명의 문제입니다. 답하는 ADR 한 줄씩을 쓰거나 공부 주제라서 판정하지 않고 둘 수 있습니다. Phase 2 표는 같은 종류의 문장(L19, L28~L30)을 ADR이 답하면 충족으로 봤습니다.
