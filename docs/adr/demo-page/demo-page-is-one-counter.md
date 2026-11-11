---
status: proposed
---

# 데모 페이지는 0에서 시작하는 카운터 하나이고, 기존 `index.html`의 `#demo` 컨테이너에 Root Component를 `mount`하며, `useState`, `useMemo`(짝수/홀수 표시), `useEffect`(문서 제목)를 모두 씁니다

> [!CAUTION]
> 문서 제목은 페이지에 하나뿐이므로, 같은 문서에 데모를 두 번 `mount`하면 마지막에 바뀐 카운터의 숫자가 제목에 남습니다.

결정: (테스트: F104, F104a, F105, F106, F107, F112, F114, F115)
