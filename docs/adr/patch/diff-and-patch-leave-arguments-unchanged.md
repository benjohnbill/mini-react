---
status: proposed
---

# `diffViews`와 `applyPatchesToDom`은 받은 `View`와 `Patch` 목록을 바꾸지 않고, 앞의 호출이 돌려준 `Patch`를 다음 호출이 바꾸지 않습니다

> [!CAUTION]
> 받은 `View`나 `Patch` 목록을 고치면, 같은 입력으로 `Patch`를 다시 만들거나 적용할 때 결과가 달라집니다.

결정: (테스트: D36, D37, P25)
