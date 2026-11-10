---
status: proposed
---

# `mount` 전에 `update()`를 부르면 Root Component를 부르지 않고 `Error`를 던집니다

> [!CAUTION]
> `mount`를 빠뜨리면 그릴 `container`도 비교할 `currentView`도 없으므로, 조용히 넘어가지 않고 `update() needs mount() first`로 알립니다.

결정: (테스트: F7)
