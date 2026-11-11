---
status: proposed
---

# `applyPatchesToDom`은 `Error`가 나도 앞서 적용한 `Patch`를 되돌리지 않습니다

> [!CAUTION]
> `Error` 뒤의 DOM은 `Patch` 일부만 반영된 상태이므로, 부르는 쪽이 현재 `View`로 다시 그려야 합니다.

결정: (테스트: P28)
CAUTION: (테스트: V93, V94)
