---
status: proposed
---

# 입력칸의 `props.value`는 언제나 `.value`를 뜻하고, 값이 `""`여도 넣습니다

> [!CAUTION]
> 빈 값을 생략하면 Diff가 속성을 지우는 `Patch`를 만드는데, 이미 값이 바뀐 입력칸에서는 속성을 지워도 `.value`가 따라가지 않습니다.

결정: (테스트: T17, T18, T19, T20, T21, T41, T33, T51, R2, R3, P23, P24, P34, HR-N03)
CAUTION: (테스트: T20, T21, P34)
