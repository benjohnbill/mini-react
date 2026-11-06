<!-- readme: archetype=team -->
# mini-react

Virtual DOM, Diff, Patch, Hooks를 바닐라 TypeScript로 직접 구현하면서 React가 이 기능들을 갖춘 이유를 이해하는 크래프톤 정글 팀 프로젝트입니다.

Status: active

## 실행

Not runnable: 아직 코드와 도구 설정이 없습니다. 도구 설정 PR이 병합되면 이 칸에 명령을 적습니다.

## Map (파일 지도)

- `.github/pull_request_template.md` (entry): PR 본문의 형식과 작성 안내
- `AGENTS.md`: 레포 안에서 일하는 에이전트를 위한 규칙
- `CLAUDE.md`: Claude Code가 `AGENTS.md`를 읽도록 연결하는 파일

## 다음에 읽을 것

- `.github/pull_request_template.md`: PR을 열기 전에 읽습니다.
- `AGENTS.md`: 에이전트에게 작업을 맡기기 전에 읽습니다.

Agents: if a path named here does not exist, report it to the owner.

## 팀

| GitHub 계정 | 브랜치 |
|:---|:---|
| `benjohnbill` | `CJG` |
| `oyatmin1031` | 직접 생성 |
| `DavinAn6` | 직접 생성 |

## 마일스톤 범위

첫 팀 회의에서 정합니다.

## 🌿 Branches and workflow.

- `main`: 병합된 공통 코드입니다. PR로만 변경합니다.
- 개인 브랜치: 이름은 각자의 이니셜입니다. PR의 대상은 `main`이고, 병합 후에도 삭제하지 않습니다.
- 임시 feature 브랜치: 개인 브랜치끼리 먼저 합쳐야 할 때만 만듭니다.

병합은 승인을 받은 후에 merge commit으로 합니다. 승인 기준은 첫 팀 회의에서 정합니다.

## 📝 Commit with context.

첫 줄에 변경 목적과 결과를 한국어 문장으로 적습니다. 자세한 설명은 PR 본문에 적습니다.

```text
Patch가 속성 변경을 DOM에 반영하도록 구현합니다
```

## ✅ Before opening a PR.

`main`의 최신 내용을 개인 브랜치에 반영합니다.

```bash
git fetch origin
git merge origin/main
```

그다음 `.github/pull_request_template.md`의 형식대로 본문을 작성합니다. 확인 항목은 이 템플릿에 있습니다.

## 시작하기

```bash
git clone https://github.com/benjohnbill/mini-react.git
cd mini-react
git switch -c <이니셜>
git push -u origin <이니셜>
```
