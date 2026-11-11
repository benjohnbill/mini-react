---
status: proposed
---

# Patch는 실제 영역을 `createVNodeFromDom`으로 다시 읽어 새 `View`와 비교하고, 그 `Patch`를 적용합니다

> [!CAUTION]
> 이력의 현재 `View`와 비교하면 실제 영역의 입력칸에 직접 친 값이 Patch 뒤에도 남아 두 영역이 다르게 보입니다.

결정: (테스트: V74, V75, V77, V78, V95, V95a)
CAUTION: (테스트: V95)
