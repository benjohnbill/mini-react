---
kind: index
---

# effect: DOM 반영 직후 effect와 정리 함수를 부릅니다

- **들어오는 것:** `useEffect(effect, deps)`. `useMemo`도 같은 deps 비교를 씁니다
- **나가는 것:** 정리 함수와 effect의 호출, effect 안 `setter`가 시작한 `update()`
- **주로 닿는 코드:** `useEffect`, `runPendingEffects`, `hasChangedDeps`
- **이웃:** `instance`가 `mount()`와 `update()`의 끝에서 부르고, effect 안 `setter`가 흐름의 처음으로 돌아갑니다
