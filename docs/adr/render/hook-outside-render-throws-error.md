---
status: proposed
---

# 렌더링 밖에서 Hook을 부르면 `Error`를 던집니다

> [!CAUTION]
> 클릭 함수 안에서 `useState`를 부르면 `Error`가 나므로, 클릭 함수는 렌더링 때 받은 값을 클로저로 씁니다.

결정: (테스트: F15, F43, F44)
CAUTION: (테스트: F45)
