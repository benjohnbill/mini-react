---
kind: index
---

# instance: Root Instance가 `mount`와 `update`로 한 번의 흐름을 지휘합니다

- **들어오는 것:** `mount(container)`, `update()`
- **나가는 것:** 렌더링, `Patch` 적용, 클릭 리스너 하나
- **주로 닿는 코드:** `FunctionComponent`의 `mount`, `update`, `container`, `currentView`
- **이웃:** `setter`가 `update()`를 부르고, `render`, `diff`, `patch`를 차례로 부릅니다
