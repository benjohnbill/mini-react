# 팀 규칙

1. **브랜치:** `main`은 PR로만 변경합니다. 개인 브랜치는 이니셜로 만들고 병합 후에도 유지합니다. 임시 feature 브랜치는 개인 브랜치끼리 먼저 합칠 때만 만듭니다. 이유는 [ADR 0001](docs/adr/0001-personal-branches-no-forks.md)에 있습니다. 다른 PR의 브랜치를 base로 쌓은 PR은, 아래쪽 PR이 병합되면 `retarget-stacked-prs` workflow가 base를 병합 대상으로 옮깁니다.
2. **PR 전:** `main`의 최신 내용을 개인 브랜치에 반영합니다.

   ```bash
   git fetch origin
   git merge origin/main
   ```

3. **병합:** 승인 1건을 받은 후에 merge commit으로 합니다. 승인 후에 diff가 바뀌면 다시 승인을 받습니다.
4. **`main` 실패:** `main`의 CI가 실패하면 본 사람이 되돌리거나 고치는 일을 먼저 합니다.
5. **커밋:** 첫 줄에 변경 목적과 결과를 한국어 문장으로 적습니다. 매일 커밋 이력을 남깁니다.

   ```text
   Patch가 속성 변경을 DOM에 반영하도록 구현합니다
   ```

6. **설명:** 작성자는 PR을 올리기 전에 본문과 diff를 읽고, 생성 파일과 비밀 정보가 없는지 확인합니다. 병합된 코드는 AI가 작성했든 팀원이 작성했든 원리를 말로 설명할 수 있어야 합니다.
7. **기록 위치:** 할 일은 이슈와 보드에, 회의 안건은 회의록에, 확정된 규칙은 이 파일과 ADR에 적습니다.
8. **규칙 변경:** 이 파일과 ADR도 PR과 승인 1건으로 변경합니다. GitHub 설정은 PR로 바꿀 수 없으므로, PR에 적어 승인받은 뒤에 오너가 반영합니다.
9. **판정:** 타입 검사는 CI의 TS 7로 판정합니다. Markdown은 Biome 검사 대상이 아닙니다. 타입 검사, 린트, 빌드 결과는 PR 하단의 CI에서 확인합니다. 에이전트가 쓴 PR 본문에는 CI 화면에 바로 보이지 않는 테스트 변화와 데모 페이지 동작을 표로 적습니다. 손으로 쓰는 PR에는 이 표가 필요하지 않습니다.

## 모듈 구조

폴더 없이 `src/`에 기능당 파일 하나를 둡니다. 이유는 [ADR 0004](docs/adr/0004-one-file-per-feature-and-patch-format-later.md)에 있습니다.

```text
src/
├── vnode.ts               VNode, createVNodeFromDom, createDomFromVNode, isTextInput
├── patch.ts               Patch, applyPatchesToDom
├── diff.ts                diffViews
├── history.ts             StateHistory
├── function-component.ts  FunctionComponent, useState, useEffect, useMemo
├── main.ts                시작 코드
└── test-pages/
    ├── verification-page.ts  검증 페이지의 코드
    └── demo-page.ts          데모 페이지의 코드
```

- **폴더:** 코어에는 폴더와 묶어서 내보내는 `index.ts`를 두지 않습니다. 한 파일이 정말 커지면 PR에서 같은 이름의 폴더로 옮깁니다.
- **테스트:** 소스 옆에 `*.test.ts`로 둡니다.
- **`Patch`:** `patch.ts`에 두고, `diff.ts`는 `import type`으로 가져옵니다.
- **의존 방향:** 다음 표에 적힌 파일만 가져옵니다. 양쪽 모두 값을 가져오는 순환은 Biome이 판정합니다. 한쪽이라도 `import type`인 순환과 잘못된 방향은 리뷰에서 봅니다.

| 파일 | 가져올 수 있는 파일 |
| ---- | ------------------- |
| `vnode` | 없음 |
| `patch` | `vnode` |
| `diff` | `vnode`, `patch` |
| `history` | `vnode`의 타입만 |
| `function-component` | `vnode`, `patch`, `diff` |
| `test-pages` | 위의 모든 파일 |

## 테스트

- 공통 테스트는 구현 전에 PR로 `main`에 넣습니다. 함수가 비어 있는 동안 그 함수의 테스트는 건너뜁니다.
- 공통 테스트가 다루지 않는 입력이나 동작을 구현하면, 그 구현 PR에 테스트를 함께 넣습니다.
- 테스트는 내보낸 함수를 호출해 동작을 확인합니다. 테스트만을 위해 함수를 내보내지 않습니다.
- 기대값은 검사 대상 함수로 계산하지 않고 직접 적습니다. `diffViews`와 `applyPatchesToDom`으로 고친 DOM을 `createDomFromVNode`의 결과와 비교하는 것처럼, 다른 내보낸 함수의 결과와 비교할 수는 있습니다.

## 이름과 함수

**판정 기준:** 함수 본문을 열지 않고 이름과 시그니처만 따라가서, 각 함수가 하는 일과 데이터 경로를 말할 수 있어야 합니다. 이름 형식, default export, 매개변수 재할당은 Biome이 판정하고, 이 절의 나머지는 리뷰에서 봅니다. 이유는 [ADR 0003](docs/adr/0003-names-and-functions-for-human-tracing.md)에 있습니다.

### 함수 나누기

한 함수에 다른 단계(전처리, 핵심 로직, 후처리)나 다른 대상이 섞여 있으면 나눕니다. 줄 수 제한은 두지 않습니다. 나누기 전에 세 가지를 묻고, 하나라도 "아니요"이면 나누지 않습니다.

- 상위 함수와 구별되는 이름을 붙일 수 있는가?
- 호출하는 쪽이 본문을 열지 않아도 되는가?
- 나눈 뒤에 상위 함수가 단계의 목록처럼 읽히는가?

```ts
// 나쁨: 이름으로 입력과 결과를 알 수 없습니다
update(a, b);

// 좋음: 호출만 읽어도 데이터 경로가 보입니다
const patches = diffViews(currentView, newView);
applyPatchesToDom(container, patches);
```

다음과 같은 함수는 만들지 않습니다.

- 호출 하나를 감싸기만 하는 함수
- 호출하는 쪽이 내부 순서나 매개변수의 변경을 알아야 쓸 수 있는 함수
- 아직 없는 요구를 위한 옵션, 인터페이스, 범용 함수

호출하는 곳이 하나뿐이어도, 단계에 이름을 붙이는 함수는 허용합니다. 판단이 갈리면 작성자와 리뷰어가 이름 트리를 함께 읽고, 판정 기준을 통과하는 쪽을 택합니다.

### 이름

- 함수는 `동사+목적어`로 짓고, 이름은 실제 동작을 말해야 합니다.
- 동사의 뜻은 하나로 고정합니다. 새 동사가 필요하면 이 표에 한 줄 추가합니다.

| 동사 | 뜻 |
| ---- | -- |
| `create` | 새로 만들어 돌려줍니다 |
| `apply` | 변경을 대상에 반영합니다 |
| `diff` | 두 값을 비교해 차이를 돌려줍니다 |
| `find` | 찾습니다. 없으면 `undefined`를 돌려줍니다 |
| `get` | 찾습니다. 없으면 `Error`를 던집니다 |
| `is`, `has` | 참과 거짓을 묻습니다. `boolean`을 돌려줍니다 |
| `can` | 할 수 있는지 묻습니다. `boolean`을 돌려줍니다 |
| `push` | 목록의 끝에 더합니다 |
| `start` | 페이지의 처음 상태를 만들고 이벤트를 연결합니다. 값을 돌려주지 않습니다 |
| `back`, `forward` | 이력에서 한 칸 옮기고 그 자리의 값을 돌려줍니다. 옮길 수 없으면 `null`을 돌려줍니다 |
| `use` | 컴포넌트 안에서 Hook으로 값이나 동작을 이어받습니다. React 이름(useState 등)을 따릅니다 |


- `StateHistory`의 메서드는 브라우저 History와 팀 테스트 시트의 이름(`push`, `back`, `forward`, `current`, `canBack`, `canForward`, `size`)을 씁니다. `current`와 `size`는 값을 묻는 이름이라 동사를 붙이지 않습니다.
- 변환 함수는 `create<결과>From<입력>`으로 짓습니다. 비교 방식 같은 구현은 이름에 넣지 않습니다.
- 변수는 명사로 짓고, 쓰이는 범위가 넓을수록 길게 짓습니다.
- 숫자 상수에는 이름을 붙입니다.
- 같은 개념은 모든 파일에서 같은 이름을 씁니다. 이름은 `GLOSSARY.md`를 따릅니다.
- 주석은 이름으로 말할 수 없는 이유만 적습니다.

### 에이전트

- 생성 전에 모듈의 기능, 인터페이스, 위치를 먼저 말합니다.
- 생성 전에 같은 일을 하는 함수가 있는지 검색합니다.
- 생성 전에 `GLOSSARY.md`에서 이름을 확인합니다. 없는 개념이면 같은 PR에 정의를 추가합니다.
- PR 전에 코드를 작성하지 않은 새 세션에게 이 절을 기준으로 diff 검토를 받습니다.
