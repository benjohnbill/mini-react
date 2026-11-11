---
kind: index
---

# click: DOM 클릭을 `actions` 표의 함수 호출로 바꿉니다

- **들어오는 것:** 컨테이너의 `click` 이벤트, 렌더링 중 `on(name, handler)`
- **나가는 것:** `actions`에서 찾은 함수의 한 번 호출
- **주로 닿는 코드:** `function-component.ts`의 `on`, `findActionName`, `actions`
- **이웃:** `render`가 `actions`를 채우고, 호출된 함수가 `setter`로 이어집니다
