---
status: proposed
---

# `StateHistory.push`는 현재와 같은 내용의 `View`도 저장하고, 바뀐 것이 없으면 저장하지 않는 일은 검증 페이지가 `diffViews`의 결과로 판단합니다

> [!CAUTION]
> `push`에서 같은 내용을 거르면 `StateHistory`가 `View`를 비교해야 해서 `diffViews`와 하는 일이 겹칩니다.

결정: (테스트: H13, H14)
