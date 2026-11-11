---
status: proposed
---

# LMS의 "Hook 은 최상위 컴포넌트에서만 사용 가능합니다"는 코드가 검사하지 않고 약속과 리뷰로 지킵니다(범위: 자식을 부르는 방식을 바꿔야 구별할 수 있음)

> [!CAUTION]
> 자식 Component 안에서 `useState`를 불러도 `Error`가 나지 않고, 그 자식을 빼면 뒤쪽 Hook이 자식이 쓰던 칸의 값을 받습니다.

CAUTION: (테스트: F70)
