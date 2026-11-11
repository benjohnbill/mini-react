---
status: proposed
---

# `useMemo`는 렌더링 중에 계산하고, deps가 같으면 계산 결과가 `undefined`여도 다시 계산하지 않고 같은 값을 돌려줍니다

> [!CAUTION]
> 계산에 쓰는 값을 deps에서 빠뜨리면, 그 값이 바뀌어도 옛 계산 결과가 화면에 남습니다.

결정: (테스트: F94, F95, F100, F103)
