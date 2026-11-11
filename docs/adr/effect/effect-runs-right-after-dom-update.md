---
status: proposed
---

# effect는 `mount()`와 `update()`가 DOM에 반영한 직후 동기로 실행합니다(범위: React는 화면을 그린 뒤 비동기로 실행)

> [!CAUTION]
> effect는 브라우저가 화면을 그리기 전에 실행되므로, 오래 걸리는 effect는 클릭에 대한 화면 반응을 그만큼 늦춥니다.

결정: (테스트: F71, F72, F73, F88)
