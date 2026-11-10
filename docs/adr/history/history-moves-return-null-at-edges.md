---
status: proposed
---

# `back`과 `forward`는 한 칸 옮긴 뒤 그 자리의 `View`를 돌려주고, 옮길 수 없으면 `null`을 돌려주며 현재 위치를 그대로 둡니다

> [!CAUTION]
> 빈 이력이나 끝에서도 `null`을 돌려주므로, 돌려받은 값을 `null` 검사 없이 쓰면 `Error`가 납니다.

결정: (테스트: H1, H3, H4, H5, H6, H7, H8, H9)
