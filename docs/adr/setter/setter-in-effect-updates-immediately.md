---
status: proposed
---

# effect 안에서 setter를 부르면 바로 `update()`가 일어나고, 그 렌더링의 effect도 그 안에서 실행됩니다

> [!CAUTION]
> deps 없는 effect가 매번 새 값으로 setter를 부르면 렌더링과 effect가 끝없이 반복되며, 코드는 이를 막지 않습니다.

결정: (테스트: F89, F90, F91)
