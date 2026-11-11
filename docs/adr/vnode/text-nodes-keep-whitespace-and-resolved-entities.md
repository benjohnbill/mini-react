---
status: proposed
---

# `createVNodeFromDom`은 글자 노드의 공백을 지우지 않고, 엔티티는 해석된 글자로 담습니다

> [!CAUTION]
> 공백만 있는 글자 노드를 지우면 `<b>a</b> <i>b</i>`의 띄어쓰기가 사라집니다.

결정: (테스트: T2, T13, T14, T44, T45, T36, P19, T30, T35)
CAUTION: (테스트: T13, T44)
