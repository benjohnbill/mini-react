---
status: proposed
---

# 한 Root Instance의 `mount()`는 한 번만 성공하고, 성공한 뒤 다시 부르면 `Error`를 던집니다

> [!CAUTION]
> 성공한 `mount()`를 다시 부를 수 있다면 클릭 리스너가 둘이 되어 클릭 한 번에 클릭 함수가 두 번 불리므로, 다시 그리려면 setter로 `update()`를 일으킵니다.

결정: (테스트: F6, F142)
