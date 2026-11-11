---
status: proposed
---

# 데모 페이지는 숫자 줄과 늘리기 버튼을 자식 Component로 나누고, 상태와 클릭 함수는 Root Component에 둡니다

> [!CAUTION]
> 자식 Component 안에서 `useState`를 부르면 Root Instance의 칸에 섞이므로, 숫자와 짝수/홀수는 Root Component가 계산해 props로 내려 줍니다.
