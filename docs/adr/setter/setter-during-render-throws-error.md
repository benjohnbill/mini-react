---
status: proposed
---

# 렌더링 중에 setter를 부르면(Root Component 본문, 자식 Component 본문, `useMemo` 계산 함수) 칸은 쓰지 않고 `Error`를 던집니다

> [!CAUTION]
> 렌더링 중에 State를 맞추려고 setter를 부르면 렌더링 안에서 다시 렌더링이 시작되므로, 계산은 `useMemo`로 하고 상태 변경은 effect나 클릭 함수에서 합니다.

결정: (테스트: F41, F129, F130)
