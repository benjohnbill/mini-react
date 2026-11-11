---
status: proposed
---

# 입력칸이 든 `View`의 왕복은 `isEqualNode`가 아니라 `.value`로 비교합니다

> [!CAUTION]
> 아무것도 치지 않은 `<input>`을 왕복하면 `<input value="">`가 되어, `isEqualNode`로 원본과 비교하면 `false`입니다.

결정: (테스트: T37, R2, R3, R4)
CAUTION: (테스트: R4)
