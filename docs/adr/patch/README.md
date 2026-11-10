---
kind: index
---

# patch: `Patch` 목록을 DOM에 적용합니다

- **들어오는 것:** `container`와 `Patch[]`. 각 `path`는 앞의 `Patch`를 적용한 트리를 가리킵니다
- **나가는 것:** 바뀐 DOM. 가리킬 곳이 없으면 `path`를 적은 `Error`
- **주로 닿는 코드:** `patch.ts`의 `Patch`, `applyPatchesToDom`
- **이웃:** `diff`가 목록을 만들고, `instance`와 `verification-page`가 적용을 부릅니다
