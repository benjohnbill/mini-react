---
kind: index
---

# verification-page: 테스트 영역의 HTML을 Patch로 실제 영역에 반영하고 이력을 오갑니다

- **들어오는 것:** 테스트 영역의 HTML, Patch·뒤로가기·앞으로가기 클릭
- **나가는 것:** 바뀐 실제 영역과 테스트 영역, 이력, 안내, Patch 목록
- **주로 닿는 코드:** `test-pages/verification-page.ts`의 `startVerificationPage`
- **이웃:** `vnode`, `diff`, `patch`, `history`를 차례로 부릅니다
