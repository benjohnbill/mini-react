---
status: proposed
---

# effect가 `Error`를 던지면 그 `Error`가 `mount()`나 `update()` 밖으로 나가고, DOM은 이미 새 View입니다

> [!CAUTION]
> effect 하나가 `Error`를 던지면, 그 렌더링에서 뒤에 선언한 effect는 실행되지 않습니다.

결정: (테스트: F93, F117, F118, F131, F132)
CAUTION: (테스트: F119)
