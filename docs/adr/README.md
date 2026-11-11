---
kind: index
---

# docs/adr: 결정 하나에 ADR 하나이고, 폴더는 데이터가 지나가는 단계입니다

```text
click ─► setter ─► instance ─► render ─► diff ─► patch ─► effect
(이벤트)  (칸 쓰기)  (흐름 지휘)  (칸 → View) (View 비교) (DOM 반영) (DOM 뒤)

vnode: DOM ⇄ VNode 변환     history: View 이력
verification-page, demo-page: 두 페이지     team: 코드 밖의 규칙
```

- **폴더 고르기:** 그 결정을 지키는 테스트가 부르는 모듈의 폴더에 둡니다. 코드가 없는 결정은 `team/`입니다.
- **파일 이름:** 폴더가 달라도 저장소 전체에서 유일해야 합니다. 링크가 아닌 언급은 폴더 없이 파일 이름으로 가리킵니다.
- **폴더 인덱스:** 폴더마다 `README.md`가 하나 있고, 들어오는 것, 나가는 것, 주로 닿는 코드, 이웃을 8줄 안쪽으로 적습니다. ADR 목록은 적지 않습니다.
