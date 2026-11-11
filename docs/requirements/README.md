---
kind: index
---

# requirements: LMS 문장마다 요구사항 충족 판정과 그 근거 ADR을 적습니다

- **들어오는 것:** LMS 1307의 문장(Phase 1, Phase 2, 공통)
- **나가는 것:** 문장마다 충족, 부분, 미충족, 대상 아님 중 하나와 근거 ADR 이름
- **주로 닿는 곳:** `phase-1.md`(S1~S32), `phase-2.md`(L1~L37), `docs/adr/`
- **이웃:** 판정이 바뀌는 변경은 같은 PR에서 표를 고칩니다. 근거에 적은 ADR 이름은 `npm run check`가 확인합니다
