---
status: proposed
---

# Component는 View를 돌려주기까지만 하고, DOM에 그리는 일은 `FunctionComponent`의 `mount()`와 `update()`가 합니다

> [!CAUTION]
> Component 본문에서 DOM을 직접 고치면, 다음 `update()`가 그 변경을 모르는 `currentView`와 비교해 Patch가 화면과 어긋납니다.

결정: (테스트: F1, F8)
CAUTION: (테스트: F144)
