---
status: proposed
---

# setter는 자기 칸을 만든 Root Instance를 기억해, 인자 없이 그 인스턴스의 `update()`만 부릅니다

> [!CAUTION]
> 한 Root Instance의 setter를 다른 Root Instance의 클릭 함수에서 불러도, 다시 그려지는 것은 setter를 만든 쪽 화면뿐입니다.

결정: (테스트: F14, F14a)
CAUTION: (테스트: F14a)
