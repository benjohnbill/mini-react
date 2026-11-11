---
status: proposed
---

# `PROPS`는 바뀐 속성만 `set`과 `remove`로 나눠 담고, 속성이 없는 것과 값이 빈 것을 구별하며, 둘 다 비면 DOM을 바꾸지 않습니다

> [!CAUTION]
> 없는 것과 빈 값을 구별하지 않으면 `disabled` 같은 빈 값 속성이 생기거나 사라지는 변경을 놓칩니다.

결정: (테스트: D16, D17, D18, D19, D20, D21, D22, P5, P6, P11, P30, P31)
CAUTION: (테스트: D19)
