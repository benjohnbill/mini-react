---
status: proposed
---

# `StateHistory`는 저장할 때와 돌려줄 때 모두 `structuredClone`으로 사본을 만듭니다

> [!CAUTION]
> 함수 속성이 든 `View`는 `structuredClone`이 `DataCloneError`를 던지므로 저장할 수 없습니다.

결정: (테스트: H15, H16, H17)
CAUTION: (테스트: F138)
