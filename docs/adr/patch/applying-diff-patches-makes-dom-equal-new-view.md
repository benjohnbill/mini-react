---
status: proposed
---

# `diffViews`가 낸 `Patch`를 `applyPatchesToDom`으로 적용하면, DOM을 다시 읽은 결과가 새 `View`와 같습니다

> [!CAUTION]
> `diffViews`와 `applyPatchesToDom`의 순서나 `path` 기준이 어긋나면, 각자의 테스트는 통과해도 함께 쓸 때 DOM이 새 `View`에 닿지 않습니다.

결정: (테스트: I1, I2, I3, I6, I10, I11, I12)
