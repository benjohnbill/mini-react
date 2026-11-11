---
status: proposed
---

# `update()`는 Root Component 본문을 처음부터 다시 실행해 새 View와 새 클릭 함수를 만듭니다

> [!CAUTION]
> 클릭 함수는 자기를 만든 렌더링의 값을 기억하므로, 렌더링이 `Error`로 끝나면 남은 옛 클릭 함수가 옛 값으로 계산합니다.

결정: (테스트: F8)
CAUTION: (테스트: F116)
