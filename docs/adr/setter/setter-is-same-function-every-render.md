---
status: proposed
---

# setter는 칸을 처음 만들 때 한 번 만들어, 렌더링마다 같은 함수를 돌려줍니다

> [!CAUTION]
> setter를 렌더링마다 새로 만들면, setter를 deps에 넣은 effect가 매 렌더링 다시 실행됩니다.

결정: (테스트: F39)
CAUTION: (테스트: F133)
