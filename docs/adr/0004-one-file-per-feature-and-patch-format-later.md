---
status: proposed
---

# 기능당 파일 하나로 나누고, Patch 형식은 첫 구현 PR에서 정합니다

mini-react의 코어는 파일 5개 정도이므로, 폴더 없이 `src/`에 기능당 파일 하나를 둡니다. `Patch` 형식은 직접 구현해 보기 전에는 사람마다 다르게 나올 수 있으므로, 팀에 먼저 지시하지 않고 첫 구현 PR에서 제안합니다.

## 공개 함수

```ts
createVNodeFromDom(element: Element): VNode
createDomFromVNode(vnode: VNode): Node
diffViews(currentView: VNode, newView: VNode): Patch[]
applyPatchesToDom(container: Element, patches: Patch[]): void
```

이름은 확정입니다. 매개변수와 반환 타입은 `Patch` 형식을 정할 때 바뀔 수 있습니다.

`createVNodeFromDom`과 `createDomFromVNode`의 변환 규칙은 [ADR 0005](0005-dom-and-vnode-conversion-rules.md)에 있습니다.

## 고려한 대안

- **폴더별 구조(`src/vdom`, `src/diff`, `src/patch`, `src/history`, `src/component`):** 파일이 하나뿐인 폴더는 경로만 길게 만들고, `index.ts`를 두면 다시 내보내기만 하는 파일이 생깁니다.
- **최상위 `tests/`와 `pages/`:** `tsconfig.json`의 `include`가 `src`이므로 설정을 넓혀야 CI의 타입 검사에 들어갑니다. 소스 옆에 두면 설정을 바꾸지 않아도 됩니다.
- **`types.ts`에 `Patch`를 두기:** 관련 없는 타입이 한 파일에 모이기 쉽습니다.
- **Hooks를 별도 파일로 나누기:** `FunctionComponent`와 세 Hook은 지금 렌더링 중인 컴포넌트를 공유합니다. 나누면 이 값을 설정하는 함수까지 공개해야 합니다.
- **`Patch` 형식을 먼저 정하기:** `diffViews`와 `applyPatchesToDom`을 다른 사람이 동시에 맡을 수 있지만, 구현해 보지 않은 형식을 팀에 지시하게 됩니다.

## 결과

- 빈 함수를 `main`에 올릴 때 `Patch`는 `export type Patch = unknown;`으로 둡니다. 빈 함수 상태의 페이지는 `Patch`를 넘기기만 하므로 형식이 없어도 됩니다.
- 형식이 정해질 때까지 `diffViews`와 `applyPatchesToDom`은 한 사람이 자기 브랜치에서 함께 채웁니다. 각자의 형식이 다르면 `Patch` 줄에서 병합 충돌이 나고, 팀이 남길 쪽을 그때 정합니다.
- 세 Hook을 다른 사람이 맡으면 `function-component.ts`에서 충돌이 날 수 있습니다.
- Biome `noImportCycles`는 양쪽 모두 값을 가져오는 순환만 잡습니다. 한쪽이라도 `import type`인 순환과 잘못된 방향은 리뷰에서 봅니다.
