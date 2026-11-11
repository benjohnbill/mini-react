---
status: proposed
---

# `VNode`의 `children`은 실제 DOM의 자식과 하나씩 맞추고, 깊은 자식과 형제도 DOM의 순서대로 읽고 만듭니다

> [!CAUTION]
> `children`이 DOM의 자식과 하나씩 맞지 않으면, `children`의 번호로 DOM의 노드를 찾는 `applyPatchesToDom`이 엉뚱한 노드를 고칩니다.

결정: (테스트: T10, T11, T12, T27, T28, T29, T42, T48, R1, T34, T43)
