---
status: superseded by failed-mount-leaves-instance-reusable
---

# 첫 `mount()`가 렌더링 중 `Error`로 끝나면 컨테이너는 그대로이고, 그 Root Instance의 `mount()`와 `update()`는 모두 `Error`라서 새 Root Instance를 만들어야 합니다

> [!CAUTION]
> `update()`의 메시지는 `mount()` 먼저라고 하지만 `mount()`를 다시 불러도 `Error`가 나므로, 메시지만 보고 `mount()`를 재시도하면 같은 `Error`가 납니다.

결정: (테스트: F142)
CAUTION: (테스트: F142)
