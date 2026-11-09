<!-- readme: archetype=team -->
# mini-react

Virtual DOM, Diff, Patch, Hooks를 바닐라 TypeScript로 직접 구현하면서 React가 이 기능들을 갖춘 이유를 이해하는 크래프톤 정글 팀 프로젝트입니다.

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

- `src/main.ts` (entry): 페이지의 시작 코드. `index.html`이 불러옵니다.
- `src/vnode.ts`: `VNode`와, DOM과 `VNode` 사이의 변환
- `src/diff.ts`: 두 `View`를 비교해 `Patch` 목록을 만드는 `diffViews`
- `src/patch.ts`: `Patch` 형식과, 그것을 DOM에 반영하는 `applyPatchesToDom`
- `src/history.ts`: 저장한 `View`의 목록과 현재 위치인 `StateHistory`
- `src/test-pages/`: 검증 페이지의 코드와 그 테스트. 테스트는 소스 옆의 `*.test.ts`에 있습니다.
- `docs/adr/`: 되돌리기 어려운 결정과 이유. 항목 끝의 테스트 ID가 그 결정을 지키는 테스트입니다.
- `scripts/check-decision-links.mjs`: ADR이 인용한 테스트 ID가 실제 테스트에 있는지 확인하는 검사. `npm run check`가 부릅니다.
- `GLOSSARY.md`: 코드와 문서에서 쓰는 이름
- `.github/pull_request_template.md`: PR 본문의 형식과 작성 안내
- `.github/workflows/ci.yml`: PR마다, 그리고 `main`에 push할 때마다 코드를 검사하는 CI
- `package.json`: 명령과 개발 도구 목록. 앱 런타임 의존성은 없습니다. 도구 설정은 `tsconfig.json`, `biome.json`, `vitest.config.ts`에 있습니다.
- `AGENTS.md`: 레포 안에서 일하는 에이전트를 위한 규칙. `CLAUDE.md`는 Claude Code가 이 파일을 읽도록 연결합니다.

## 다음에 읽을 것

- `CONVENTION.md`: 작업을 시작하기 전에 읽습니다.
- `AGENTS.md`: 에이전트에게 작업을 맡기기 전에 읽습니다.

Agents: if a path named here does not exist, report it to the owner.

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
