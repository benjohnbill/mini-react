---
status: proposed
---

# Root Component만 `FunctionComponent`로 감싸고, 자식 Component는 props를 받아 `VNode`를 돌려주는 함수로 둡니다

> [!CAUTION]
> 자식 Component 안에서 `useState`를 부르면 `currentComponent`가 Root Instance를 가리키고 있어서, 자식의 상태가 Root Instance의 `hooks`에 섞입니다.

CAUTION: (테스트: F70)
