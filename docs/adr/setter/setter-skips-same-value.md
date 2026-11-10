---
status: proposed
---

# setter는 새 값이 칸의 값과 같으면(`Object.is`) `update()`를 부르지 않습니다

> [!CAUTION]
> 배열을 `push`로 고친 뒤 같은 배열을 넘기면 같은 값으로 판정되어 화면이 바뀌지 않습니다.

결정: (테스트: F18, F24, F27, F28, F29, F30, F31, F33, F36)
CAUTION: (테스트: F32)
