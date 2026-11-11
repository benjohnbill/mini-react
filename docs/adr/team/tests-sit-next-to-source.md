---
status: proposed
---

# 테스트는 소스 옆에 `*.test.ts`로 두고, 최상위 `tests/`와 `pages/`를 만들지 않습니다

> [!CAUTION]
> 최상위 `tests/`는 `tsconfig.json`의 `include`를 넓혀야 CI의 타입 검사에 들어갑니다.
