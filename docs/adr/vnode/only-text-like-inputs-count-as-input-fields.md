---
status: proposed
---

# 입력칸은 `input` 중 `checkbox`, `radio`, `file`을 뺀 것이고, `li`와 `button`처럼 `.value`를 갖는 다른 요소는 입력칸이 아닙니다

> [!CAUTION]
> `li`의 `.value`는 사용자가 친 글자가 아니라 `value` 속성을 숫자로 바꾼 값이고, `file` 입력칸에 글자를 쓰면 `InvalidStateError`가 납니다.

결정: (테스트: T16, T46, T51, T52, T53, P38)
CAUTION: (테스트: T16, T52, P38)
