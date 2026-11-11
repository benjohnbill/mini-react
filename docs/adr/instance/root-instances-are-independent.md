---
status: proposed
---

# Root Instance 여러 개는 칸과 클릭 함수를 나누지 않고, 한쪽의 setter는 그쪽 화면만 다시 그립니다

> [!CAUTION]
> 데모를 두 번 시작하면 Root Instance가 둘이라 서로의 State를 읽을 수 없으므로, 두 화면이 같은 값을 보여 주려면 한 Root Component로 합쳐야 합니다.

결정: (테스트: F14)
