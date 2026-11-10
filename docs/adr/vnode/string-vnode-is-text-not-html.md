---
status: proposed
---

# 문자열 `VNode`는 글자 노드로만 만들고 HTML로 해석하지 않으며, `applyPatchesToDom`의 `TEXT`도 같습니다

> [!CAUTION]
> 문자열을 HTML로 해석하면 `<React>` 같은 글자가 요소로 바뀌어 사라지고, 사용자 데이터에 든 `<img src=x onerror=alert(1)>`가 실행됩니다(XSS).

결정: (테스트: T31, P2, F4, F5, T23)
CAUTION: (테스트: T31, P2, F5)
