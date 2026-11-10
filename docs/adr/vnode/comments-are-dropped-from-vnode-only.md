---
status: proposed
---

# `createVNodeFromDom`은 주석 노드만 `VNode`에서 버리고 입력 DOM에서는 지우지 않으며, 그래서 왕복하면 주석이 사라집니다

> [!CAUTION]
> 주석 노드는 `childNodes`에는 있고 `children`에는 없어서, `<div>hello<!-- 설명 --><span>world</span></div>`의 `span`은 `childNodes`의 2번이고 `children`의 1번입니다.

결정: (테스트: T3, T4, T5, T39, T47, R5, P17, P18, P32)
CAUTION: (테스트: P17, P18)
