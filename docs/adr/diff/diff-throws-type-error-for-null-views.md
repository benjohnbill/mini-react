---
status: proposed
---

# `diffViews`는 두 인자 중 하나가 `null`이나 `undefined`이면 `TypeError`를 던지고, 자식 안의 값은 검사하지 않습니다

> [!CAUTION]
> `children` 안에 `null`을 넣어도 검사하지 않으므로, 잘못된 `View`가 `diffViews` 안쪽에서 `null`을 읽다가 나는 `TypeError`로 터집니다.

결정: (테스트: D38)
CAUTION: (테스트: D38a)
