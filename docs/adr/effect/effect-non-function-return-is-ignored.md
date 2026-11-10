---
status: proposed
---

# effect가 함수가 아닌 값을 돌려주면 정리 함수가 없는 것으로 보고 `Error`를 내지 않습니다

> [!CAUTION]
> `async` 함수를 effect로 넘기면 Promise를 돌려주므로, 그 안에서 정리 함수를 돌려줘도 불리지 않습니다.

결정: (테스트: F87)
CAUTION: (테스트: F137)
