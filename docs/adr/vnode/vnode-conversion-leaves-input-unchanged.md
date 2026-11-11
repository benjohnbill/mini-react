---
status: proposed
---

# `createVNodeFromDom`과 `createDomFromVNode`는 입력을 바꾸지 않고, `createDomFromVNode`는 같은 `VNode`로 부를 때마다 새 노드를 만듭니다

> [!CAUTION]
> 같은 `VNode`로 만든 노드를 두 곳에 쓰면 DOM 노드는 부모를 하나만 가지므로, 한쪽 화면에서 사라집니다.

결정: (테스트: T5, T47, T49, T50)
CAUTION: (테스트: T50)
