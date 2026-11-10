---
status: proposed
---

# 한 렌더링에서 같은 이름으로 `on`을 두 번 부르면 나중에 등록한 함수만 불립니다

> [!CAUTION]
> 자식 Component 두 개가 같은 `data-action` 이름을 그리면, 두 버튼 모두 나중에 등록한 함수를 부릅니다.

결정: (테스트: F61)
