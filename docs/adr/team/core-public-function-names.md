---
status: proposed
---

# 코어가 다른 모듈과 페이지에 내놓는 변환·비교·반영 함수는 `createVNodeFromDom`, `createDomFromVNode`, `diffViews`, `applyPatchesToDom` 넷이고, `createVNodeFromDom`은 요소만 받습니다

> [!CAUTION]
> `createVNodeFromDom`에 글자나 주석 노드 하나를 루트로 넘기는 경우는 다루지 않으므로, 그런 노드는 요소의 자식으로 읽어야 합니다.

결정: (테스트: T1, T22, D1, P1)
