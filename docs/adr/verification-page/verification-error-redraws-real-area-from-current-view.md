---
status: proposed
---

# Patch를 적용하다 `Error`가 나면 보여야 할 `View`로 실제 영역을 다시 그리고 오류를 안내에 보여 주며, Patch에서 난 오류면 이력에 쌓지 않습니다

> [!CAUTION]
> `applyPatchesToDom`은 되돌리지 않으므로 다시 그리지 않으면 반쯤 바뀐 화면이 남아 이력과 어긋납니다.

결정: (테스트: V93, V94)
CAUTION: (테스트: V93)
