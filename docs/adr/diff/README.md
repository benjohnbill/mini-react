---
kind: index
---

# diff: 두 `View`를 비교해 `Patch` 목록을 만듭니다

- **들어오는 것:** 이전 `View`와 새 `View`
- **나가는 것:** 순서가 정해진 `Patch[]`
- **주로 닿는 코드:** `diff.ts`의 `diffViews`
- **이웃:** `vnode`의 `View`를 읽고, `patch`가 그 목록을 DOM에 적용합니다
