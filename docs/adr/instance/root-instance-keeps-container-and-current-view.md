---
status: proposed
---

# Root Instance는 `mount(container)`로 받은 `container`와 마지막으로 그린 View(`currentView`)를 필드로 가지고, `update()`는 인자 없이 `diffViews`와 `applyPatchesToDom`만으로 다시 그립니다

> [!CAUTION]
> 마지막 View를 `StateHistory`에 맡기면, 뒤로가기로 이력의 위치가 바뀐 뒤 `update()`가 화면과 다른 View와 비교해 잘못된 Patch를 만듭니다.

결정: (테스트: F2, F3, F9, F10, F12, F13, F22)
