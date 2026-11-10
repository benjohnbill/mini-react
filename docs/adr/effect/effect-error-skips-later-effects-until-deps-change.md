---
status: proposed
---

# effect가 `Error`를 던져도 deps는 이미 기록되어 있어, 그 effect와 뒤에 선언한 effect는 deps가 같은 동안 다시 실행되지 않습니다

> [!CAUTION]
> 던진 effect 뒤에 선언한 effect는 한 번도 실행되지 않았어도, deps가 바뀌기 전에는 실행되지 않습니다.

결정: (테스트: F141)
CAUTION: (테스트: F141)
