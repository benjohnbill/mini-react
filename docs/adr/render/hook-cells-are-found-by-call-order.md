---
status: proposed
---

# Hook의 칸은 렌더링마다 0부터 다시 세는 호출 순서로 찾습니다

> [!CAUTION]
> 조건에 따라 Hook 호출을 건너뛰면, 뒤쪽 Hook이 앞쪽 Hook의 칸 값을 받습니다.

결정: (테스트: F8, F17, F20, F21, F101, F102, F139)
CAUTION: (테스트: F42, F70)
