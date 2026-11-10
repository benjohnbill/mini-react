---
status: proposed
---

# 입력칸의 `value`가 빈 값이 되면 `remove`가 아니라 `set`에 `""`로 담고, `PROPS`의 `value`는 `.value`에 씁니다

> [!CAUTION]
> 입력칸에서 `value`를 지우는 `PROPS`는 정하지 않았고 지금은 `value` 속성만 지우므로, `remove`에 담으면 `.value`가 따라가지 않습니다.

결정: (테스트: D23, P23, P24, P34, HR-N03)
CAUTION: (테스트: D23, P34)
