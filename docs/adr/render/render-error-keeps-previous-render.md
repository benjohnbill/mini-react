---
status: proposed
---

# Root Component가 렌더링 중 `Error`를 던지면 그 `Error`가 나가고, 화면과 클릭 함수는 직전 렌더링의 것이 남습니다

> [!CAUTION]
> 칸의 값은 setter가 이미 바꾼 뒤라서, `Error` 뒤의 화면은 칸의 값보다 한 단계 늦은 값을 보여 줍니다.

결정: (테스트: F15, F116, F120, F122, F123, F124, F128)
CAUTION: (테스트: F125, F126)
