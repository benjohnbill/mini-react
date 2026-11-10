---
status: proposed
---

# effect의 deps는 렌더링 중이 아니라 effect를 부르기 직전에 기록하므로, `Error`로 끝난 렌더링은 deps를 남기지 않습니다

> [!CAUTION]
> `Error`로 끝난 렌더링의 값은 화면에 없으므로, 그 값의 effect는 다음에 성공한 렌더링에서야 불립니다.

결정: (테스트: F140)
