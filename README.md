<!-- readme: archetype=team -->
# mini-react

Virtual DOM, Diff, Patch, Hooks를 바닐라 TypeScript로 직접 구현하면서 React가 이 기능들을 갖춘 이유를 이해하는 크래프톤 정글 팀 프로젝트입니다.

Status: active

## 실행

```bash
npm ci             # 도구 설치 (Node 버전: .nvmrc)
npm run dev        # 데모 페이지 실행
npm run typecheck  # 타입 검사
npm run check      # 포맷과 린트 검사
npm run format     # 포맷과 린트 자동 수정
npm test           # 단위 테스트
npm run build      # 빌드
```

## Map (파일 지도)

- `src/main.ts` (entry): 데모 페이지의 시작 코드
- `index.html`: 데모 페이지
- `CONVENTION.md`: 팀 규칙
- `docs/adr/`: 되돌리기 어려운 결정과 이유
- `.github/pull_request_template.md`: PR 본문의 형식과 작성 안내
- `.github/workflows/ci.yml`: PR마다, 그리고 `main`에 push할 때마다 코드를 검사하는 CI
- `package.json`: 명령과 개발 도구 목록. 앱 런타임 의존성은 없습니다.
- `tsconfig.json`: 타입 규칙
- `biome.json`: 포맷과 린트 규칙
- `vitest.config.ts`: 테스트 설정
- `AGENTS.md`: 레포 안에서 일하는 에이전트를 위한 규칙
- `CLAUDE.md`: Claude Code가 `AGENTS.md`를 읽도록 연결하는 파일

## 다음에 읽을 것

- `CONVENTION.md`: 작업을 시작하기 전에 읽습니다.
- `AGENTS.md`: 에이전트에게 작업을 맡기기 전에 읽습니다.

Agents: if a path named here does not exist, report it to the owner.

## 팀

| GitHub 계정   | 브랜치    |
| :------------ | :-------- |
| `benjohnbill` | `CJG`     |
| `oyatmin1031` | 직접 생성 |
| `DavinAn6`    | 직접 생성 |

## 마일스톤 범위

첫 팀 회의에서 정합니다.

## 규칙

브랜치, PR, 커밋, 병합 규칙은 `CONVENTION.md`에 있습니다.

## 시작하기

```bash
git clone https://github.com/benjohnbill/mini-react.git
cd mini-react
git switch -c <이니셜>
git push -u origin <이니셜>
npm ci
npm test
```
