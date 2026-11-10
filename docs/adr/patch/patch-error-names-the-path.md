---
status: proposed
---

# `applyPatchesToDom`은 없는 노드를 가리키거나, `TEXT`가 글자 노드가 아닌 곳을, `PROPS`가 요소가 아닌 곳을 가리키면 `path`를 적은 `Error`를 던지고, 그 `Patch`는 DOM을 바꾸지 않습니다

> [!CAUTION]
> 없는 `path`를 조용히 건너뛰면 `diffViews`의 순서 오류가 DOM이 어긋난 뒤에야 드러납니다.

결정: (테스트: P26, P27, P35, P36, P37)
