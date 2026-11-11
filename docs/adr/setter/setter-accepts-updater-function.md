---
status: proposed
---

# setter에 함수를 넘기면 칸의 현재 값으로 불러 그 결과를 새 값으로 씁니다

> [!CAUTION]
> 함수를 상태로 저장하려고 `setFn(myFn)`을 부르면 `myFn(현재 값)`의 반환값이 저장되므로, `setFn(() => myFn)`으로 감싸야 합니다.

결정: (테스트: F23, F35, F38)
CAUTION: (테스트: F25)
