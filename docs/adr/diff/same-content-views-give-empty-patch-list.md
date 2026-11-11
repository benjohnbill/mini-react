---
status: proposed
---

# 내용이 같은 두 `View`는 객체가 달라도, 속성을 적은 순서만 달라도 빈 `Patch` 목록을 돌려줍니다

> [!CAUTION]
> 속성의 순서까지 비교하면 내용이 같은 `View`에서 `PROPS`가 생겨 DOM이 불필요하게 바뀝니다.

결정: (테스트: D1, D2, D3, D4, D12, D20, I8, P13)
