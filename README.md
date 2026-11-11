<!-- readme: archetype=team -->
# mini-react

Virtual DOM, Diff, Patch, Hooks를 바닐라 TypeScript로 직접 구현하면서 React가 이 기능들을 갖춘 이유를 이해하는 크래프톤 정글 팀 프로젝트입니다.

[![CI](https://github.com/benjohnbill/mini-react/actions/workflows/ci.yml/badge.svg)](https://github.com/benjohnbill/mini-react/actions/workflows/ci.yml)

Status: active

## 실행

```bash
npm ci             # 도구 설치 (Node 버전: .nvmrc)
npm run dev        # 개발 서버에서 index.html 실행
npm run typecheck  # 타입 검사
npm run check      # 포맷, 린트, ADR이 인용한 테스트 ID 검사 (자동 수정: npm run format)
npm test           # 단위 테스트
npm run build      # 빌드
```

## Map (파일 지도)

```text
mini-react/
├── src/
│   ├── main.ts (entry)    페이지 시작 코드. index.html이 불러옴
│   ├── vnode.ts           VNode, DOM ↔ VNode 변환
│   ├── diff.ts            diffViews: 두 View → Patch 목록
│   ├── patch.ts           Patch 형식, applyPatchesToDom
│   ├── history.ts         StateHistory: 저장한 View 목록과 현재 위치
│   ├── test-pages/        검증 페이지 코드와 테스트
│   └── *.test.ts          테스트는 소스 옆에 둠
├── docs/adr/              되돌리기 어려운 결정과 이유. 폴더는 데이터가 지나가는 단계(docs/adr/README.md). 끝 두 줄의 ID = 지키는 테스트
├── scripts/
│   └── check-decision-links.mjs   ADR이 인용한 테스트 ID 확인. npm run check가 부름
├── .github/               PR 템플릿, CI(PR과 main push마다 검사)
├── GLOSSARY.md            코드와 문서의 이름
├── package.json           명령, 개발 도구. 런타임 의존성 없음. 설정은 tsconfig.json, biome.json, vitest.config.ts
└── AGENTS.md              에이전트 규칙. CLAUDE.md가 이 파일로 연결
```

## 다음에 읽을 것

- `CONVENTION.md`: 작업을 시작하기 전에 읽습니다.
- `AGENTS.md`: 에이전트에게 작업을 맡기기 전에 읽습니다.

Agents: if a path named here does not exist, report it to the owner.

## 동작 흐름

```mermaid
flowchart LR
    C["container (DOM)"] -->|createVNodeFromDom| V["View (VNode)"]
    V -->|push| H["StateHistory"]
    H -->|"back · forward"| V
    V -->|"diffViews(currentView, newView)"| P["Patch[]"]
    P -->|"applyPatchesToDom(container, patches)"| C
```

함수 이름은 `src/`의 export와 같습니다. `src/main.ts`는 아직 이 함수들을 잇지 않습니다.

## 팀

| GitHub 계정   | 브랜치    |
| :------------ | :-------- |
| `benjohnbill` | `CJG`     |
| `oyatmin1031` | 직접 생성 |
| `DavinAn6`    | `Davin`   |

## 마일스톤 범위

마일스톤과 할 일은 팀 보드에 있습니다: https://github.com/users/benjohnbill/projects/7

## 규칙

브랜치, PR, 커밋, 병합 규칙과, ADR의 결정과 테스트를 잇는 규칙은 `CONVENTION.md`에 있습니다.

## 시작하기

```bash
git clone https://github.com/benjohnbill/mini-react.git
cd mini-react
git switch -c <이니셜>
git push -u origin <이니셜>
npm ci
npm test
```
