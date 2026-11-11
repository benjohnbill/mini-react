---
kind: index
---

# setter: 함수가 칸을 바꾸고 `update()`를 부릅니다

- **들어오는 것:** `setter(값 또는 갱신 함수)`
- **나가는 것:** 바뀐 칸과 `update()` 호출. 같은 값이면 호출하지 않습니다
- **주로 닿는 코드:** `useState`가 돌려주는 setter, `createValueFromNextValue`
- **이웃:** `click`의 함수가 부르고, `instance`의 `update()`로 이어집니다
