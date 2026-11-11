---
status: proposed
---

# 새 `View`가 `StateHistory`의 현재 `View`와 다를 때만 `push`하고, 바뀐 것이 없으면 DOM도 이력도 앞쪽 기록도 그대로 둡니다

> [!CAUTION]
> 실제 영역의 입력칸에 직접 친 값만 달라도 `View`는 같으므로 이력이 쌓이지 않습니다.

결정: (테스트: V80, HR-N02, HR-N05a, DEC-09a, DEC-09b, V95a)
CAUTION: (테스트: V95a)
