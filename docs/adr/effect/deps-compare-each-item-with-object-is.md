---
status: proposed
---

# `useEffect`와 `useMemo`의 deps는 칸마다 `Object.is`로 비교하고, `[]`이면 처음 한 번, 생략하면 매 렌더링, 길이나 형태가 바뀌면 바뀐 것으로 봅니다

> [!CAUTION]
> deps에 렌더링마다 새로 만드는 배열이나 객체를 넣으면 매번 바뀐 것으로 판정되어, `[obj]`를 넣어도 deps를 생략한 것처럼 매 렌더링 실행됩니다.

결정: (테스트: F75, F76, F77, F78, F79, F80, F81, F82, F96, F97, F98, F99)
CAUTION: (테스트: F135, F136)
