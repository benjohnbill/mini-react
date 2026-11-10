---
status: proposed
---

# `useState`의 초깃값이 함수이면 칸이 비어 있는 첫 렌더링에서 한 번 불러 그 결과를 씁니다

> [!CAUTION]
> 함수를 상태로 저장하려고 `useState(myFn)`을 부르면 `myFn()`의 반환값이 저장되므로, `useState(() => myFn)`으로 감싸야 합니다.

결정: (테스트: F17, F19)
