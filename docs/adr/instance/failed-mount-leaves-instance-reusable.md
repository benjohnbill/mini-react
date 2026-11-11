---
status: proposed
---

# 첫 `mount()`가 렌더링 중 `Error`로 끝나면, 같은 Root Instance로 `mount()`를 다시 부를 수 있습니다

> [!CAUTION]
> 실패한 첫 렌더링이 부른 초깃값 함수는 다시 `mount()`할 때 한 번 더 불리므로, 그 안에 한 번만 해야 하는 일을 두면 두 번 일어납니다.

결정: (테스트: F142, F142a)
CAUTION: (테스트: F142a)
