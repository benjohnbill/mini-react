---
kind: index
---

# vnode: DOM과 `VNode`를 서로 바꿉니다

- **들어오는 것:** DOM 요소(`createVNodeFromDom`), `VNode`(`createDomFromVNode`)
- **나가는 것:** `VNode` 또는 새 DOM 노드
- **주로 닿는 코드:** `vnode.ts`의 `createVNodeFromDom`, `createDomFromVNode`, `isTextInput`
- **이웃:** `diff`가 `VNode`를 비교하고, `patch`와 `verification-page`가 변환 결과를 씁니다
