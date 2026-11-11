---
status: proposed
---

# 렌더링 중에만 쓰는 `currentComponent`와 `hookIndex`는 모듈 변수에 두고, 렌더링 사이에 남는 `hooks`는 Root Instance에 둡니다

> [!CAUTION]
> Root Component 본문에서 다른 Root Instance를 `mount()`하면 그 렌더링이 `currentComponent`를 비우므로, 본문의 뒤쪽 Hook 호출은 `Error`가 납니다.

결정: (테스트: F14)
CAUTION: (테스트: F143)
