---
status: proposed
---

# `applyPatchesToDom`은 `Patch`를 받은 순서대로 적용하고, 각 `path`는 앞의 `Patch`를 적용한 뒤의 트리를 가리킵니다

> [!CAUTION]
> 같은 `Patch` 목록을 두 번 적용했을 때 결과가 같다고 약속하지 않으니, 두 번째 적용은 바뀐 트리에서 `path`를 읽습니다.

결정: (테스트: P20, P21)
