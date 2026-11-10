---
status: proposed
---

# setter는 칸에 새 값을 쓴 뒤 바로 Root Instance의 `update()`를 부르고, 여러 setter 호출을 모으지(Batching) 않습니다(범위)

> [!CAUTION]
> 클릭 한 번에 `setCount(c => c + 1)`을 두 번 부르면 Root Component 실행과 `diffViews`도 두 번 일어납니다.

결정: (테스트: F37)
CAUTION: (테스트: F35)
