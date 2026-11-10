---
kind: index
---

# render: 칸을 읽어 Root Component를 실행하고 새 `View`를 만듭니다

- **들어오는 것:** `hooks`의 칸, Root Component 본문의 Hook 호출
- **나가는 것:** 새 `View`와 이번 렌더링의 `actions` 표
- **주로 닿는 코드:** `renderedView`, `useState`
- **이웃:** `instance`가 부르고, 만든 `View`를 `diff`가 받습니다
