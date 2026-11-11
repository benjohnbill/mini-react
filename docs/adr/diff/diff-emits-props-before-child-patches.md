---
status: proposed
---

# `diffViews`는 한 요소의 `PROPS`를 그 요소의 자식 `Patch`보다 먼저 냅니다

> [!CAUTION]
> 지금은 순서를 바꿔도 DOM 결과가 같지만, `applyPatchesToDom`은 순서를 고치지 않고 받은 순서대로 적용하므로 이 순서는 `diffViews`가 지켜야 하는 약속입니다.

결정: (테스트: D34, D39)
