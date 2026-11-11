---
status: proposed
---

# 클릭은 View의 `data-action` 문자열과 Root Instance의 `actions` 표로 연결하고, 리스너는 `mount`할 때 컨테이너에 하나 붙입니다

> [!CAUTION]
> `onclick` 같은 속성에 함수를 넣으면 View에 함수가 들어가, `StateHistory`가 View를 `structuredClone`할 때 `DataCloneError`가 납니다.

결정: (테스트: F11, F49, F50, F52, F55, F56, F57, F58, F59, F60, F62, F63)
CAUTION: (테스트: F138)
