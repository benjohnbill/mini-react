---
status: proposed
---

# 갱신 함수가 `Error`를 던지면 그 `Error`가 setter 밖으로 나가고, 칸과 화면과 렌더링 횟수는 그대로입니다

> [!CAUTION]
> 한 클릭 함수에서 setter를 여러 번 부를 때 앞의 갱신 함수가 `Error`를 던지면, 뒤의 setter는 실행되지 않습니다.

결정: (테스트: F26)
CAUTION: (테스트: F127)
