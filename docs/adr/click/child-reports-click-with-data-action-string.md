---
status: proposed
---

# 자식 Component는 함수를 props로 받지 않고 `data-action` 문자열만 그리며, 그 이름의 함수는 Root Component가 `on`으로 등록합니다

> [!CAUTION]
> 자식이 그린 버튼의 이름을 Root Component가 등록하지 않으면, 클릭해도 `Error` 없이 아무 일도 일어나지 않습니다.

결정: (테스트: F69)
CAUTION: (테스트: F53)
