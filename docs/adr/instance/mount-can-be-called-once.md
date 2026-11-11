---
status: superseded by mount-succeeds-only-once
---

# 한 Root Instance의 `mount()`는 한 번만 부를 수 있고, 두 번째 호출은 `Error`를 던집니다

> [!CAUTION]
> `mount()`를 두 번 부르면 클릭 리스너가 둘이 되어 클릭 한 번에 클릭 함수가 두 번 불리므로, 다시 그리려면 setter로 `update()`를 일으킵니다.

결정: (테스트: F6)
