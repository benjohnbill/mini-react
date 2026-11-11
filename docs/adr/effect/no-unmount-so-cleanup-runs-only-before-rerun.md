---
status: proposed
---

# Root Instance는 unmount하지 않으므로, 정리 함수는 같은 effect가 다시 실행되기 직전에만 불립니다(범위)

> [!CAUTION]
> `[]` effect에서 붙인 이벤트 리스너나 타이머는 정리 함수가 불리지 않아 페이지가 살아 있는 동안 남습니다.

결정: (테스트: F85)
