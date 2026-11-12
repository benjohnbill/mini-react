<!-- readme: archetype=team -->
<p align="center">
  <img src="docs/images/mini-react_README_banner.png" width="100%" alt="mini-react 배너">
</p>

[![CI](https://github.com/benjohnbill/mini-react/actions/workflows/ci.yml/badge.svg)](https://github.com/benjohnbill/mini-react/actions/workflows/ci.yml)
[![Deploy](https://github.com/benjohnbill/mini-react/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/benjohnbill/mini-react/actions/workflows/deploy-pages.yml)
[![Demo](https://img.shields.io/badge/demo-GitHub%20Pages-222?logo=github)](https://benjohnbill.github.io/mini-react/)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-brightgreen)

[Overview](#overview) · [Architecture](#architecture) · [Demo](#demo) · [How We Built It](#how-we-built-it) · [Environment](#environment) · [Getting Started](#getting-started) · [Team](#team)


## Overview
**mini-react란?**
- React 없이 Virtual DOM, Diff, Patch, Hooks를 바닐라 TypeScript로 직접 구현한 프로젝트
- React의 핵심 흐름만 남긴 간소화 버전
- 구조를 단순하게 유지해서 코드를 따라 읽기만 해도 핵심 로직 파악 가능

**Features**
- 함수형 컴포넌트로 화면 렌더링
- `useState`, `useEffect`, `useMemo`
- State가 바뀌면 이전 화면과 비교해서 바뀐 부분만 DOM에 반영

**React와 다른 점**
- State와 Hook은 최상위 컴포넌트에서만 사용 가능. 자식 컴포넌트는 props만 받음
- 이벤트는 클릭만 지원
- `key` 없음. 자식 요소는 같은 순서끼리 비교
- 여러 번의 setState를 한 번에 묶어 처리하는 Batching 없음
- 컴포넌트가 화면에서 사라질 때(unmount) 정리하는 기능 없음

## Architecture

### Phase 1과 Phase 2

|         | 하는 일                                                          | 새 `View`를 만드는 것                              |
| ------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Phase 1 | 두 `View`(Virtual DOM)의 차이를 찾아, 그 차이만 DOM에 반영합니다 | 사람 (검증 페이지의 테스트 영역 HTML과 Patch 버튼) |
| Phase 2 | State가 바뀌면 새 `View`를 만들어 Phase 1에 넘깁니다             | 클릭이 바꾼 State                                  |

`View`는 화면 전체를 설명하는 값이고, 과제 문서가 Virtual DOM이라 부르는 것입니다. 두 Phase는 `View`에서 만납니다. Phase 2의 `update()`는 Phase 1의 `diffViews`와 `applyPatchesToDom`을 그대로 부릅니다.

![Phase 2의 click, setter, instance, render가 만든 새 View와 Phase 1의 vnode가 만든 새 View가 diff로 모이고, patch가 DOM에 반영한 뒤 effect가 실행되는 그림](docs/images/architecture.png)

상자의 `ADR` 숫자는 그 단계의 결정 수입니다. 그림의 원본은 `docs/images/architecture.html`입니다.

### 단계

단계는 데이터가 지나가는 구간이고, `docs/adr/`의 폴더 이름과 같습니다. 결정은 그 결정을 지키는 테스트가 부르는 모듈의 단계에 둡니다.

| Phase | 단계 | 하는 일 | ADR |
| ----- | ---- | ------- | --- |
| 1 | [`vnode`](docs/adr/vnode/README.md) | DOM과 `VNode`를 서로 바꿉니다 | 14 |
| 1 | [`diff`](docs/adr/diff/README.md) | 두 `View`를 비교해 `Patch` 목록을 만듭니다 | 8 |
| 1 | [`patch`](docs/adr/patch/README.md) | `Patch` 목록을 DOM에 적용합니다 | 9 |
| 1 | [`history`](docs/adr/history/README.md) | 저장한 `View`의 목록과 현재 위치를 가집니다 | 5 |
| 2 | [`click`](docs/adr/click/README.md) | DOM 클릭을 `actions` 표의 함수 호출로 바꿉니다 | 5 |
| 2 | [`setter`](docs/adr/setter/README.md) | 함수가 칸을 바꾸고 `update()`를 부릅니다 | 8 |
| 2 | [`instance`](docs/adr/instance/README.md) | Root Instance가 `mount`와 `update`로 한 번의 흐름을 지휘합니다 | 6 |
| 2 | [`render`](docs/adr/render/README.md) | 칸을 읽어 Root Component를 실행하고 새 `View`를 만듭니다 | 9 |
| 2 | [`effect`](docs/adr/effect/README.md) | DOM 반영 직후 effect와 정리 함수를 부릅니다 | 8 |

- **닿는 LMS 문장:** 요구사항 표([Phase 1](docs/requirements/phase-1.md), [Phase 2](docs/requirements/phase-2.md))에서 그 단계의 ADR을 근거로 적은 문장의 수입니다.
- **ADR:** 대체된 ADR 2개를 뺀 수입니다. 흐름 밖의 폴더는 `verification-page` 16, `demo-page` 2, `team` 11입니다.

### Core Data Structures

| 값 | 뜻 | 만드는 단계 → 쓰는 단계 |
| --- | --- | --- |
| `VNode` | 화면의 한 부분을 설명하는 값. 맨 위의 `VNode`가 `View`입니다 | `render`, `vnode` → `diff` |
| `Patch` | DOM에 반영할 지시 하나. `path`는 `View`에서 노드까지 내려가는 `children` 번호의 목록입니다 | `diff` → `patch` |
| `HookCell` | Hook 호출 하나의 값을 담는 칸. `hooks` 배열에 호출 순서대로 들어 있습니다 | `setter`, `render` → 다음 `render` |

```ts
type VNode =
  | string
  | { type: string; props: Record<string, string>; children: VNode[] };

type Patch =
  | { type: "TEXT"; path: number[]; text: string }
  | { type: "REPLACE"; path: number[]; node: VNode }
  | { type: "PROPS"; path: number[]; set: Record<string, string>; remove: string[] }
  | { type: "INSERT"; path: number[]; node: VNode }
  | { type: "REMOVE"; path: number[] };

type HookCell = StateCell | EffectCell | MemoCell;
```

순위 페이지에서 6위인 사람의 `+`를 한 번 누른 뒤의 값입니다.

```text
hooks[0]  StateCell   value: { …, p06: 2 }                  1 → 2
hooks[3]  MemoCell    deps: [scores, track]                 scores가 바뀌어 다시 계산
hooks[4]  EffectCell  deps: ["p02"]                         1위가 그대로라 건너뜀

patches   { type: "TEXT", path: [0, 1, 5, 3, 0], text: "2" }   동료 평가의 점수
          { type: "TEXT", path: [1, 3, 5, 2, 0], text: "2" }   순위표의 점수
```


## Demo

### Main Demo: 순위 페이지

[배포된 페이지에서 바로 실행하기](https://benjohnbill.github.io/mini-react/#ranking-section)

순위 페이지는 동료 평가의 점수를 누르면 순위가 바뀌는 화면입니다. 오른쪽의 Hook 패널은 클릭마다 그 클릭이 지난 단계, `hooks`의 칸마다 일어난 일, DOM에 적용한 `Patch` 목록을 보여 줍니다. `npm run dev`를 실행한 뒤 `http://localhost:5173/#ranking-section`에서 볼 수 있습니다.

| 클릭 | 지난 단계 | `useMemo` | `useEffect` | `Patch` |
| ---- | --------- | --------- | ----------- | ------- |
| 이름 가리기 | `click` ~ `patch` | 건너뜀 | 건너뜀 | `PROPS` 1, `TEXT` 7 |
| 순위가 그대로인 점수 `+` | `click` ~ `patch` | 다시 계산 | 건너뜀 | `TEXT` 2 |
| 1위가 바뀌는 점수 `+` | `click` ~ `effect` | 다시 계산 | 실행 | `TEXT` 6 |
| 5점인 사람의 `+` | `click`, `setter` | | | 없음 |

코드는 `src/test-pages/ranking-page.ts`(Root Component)와 `src/test-pages/hook-panel.ts`(Hook 패널)이고, 위 표의 줄은 `ranking-page.test.ts`의 테스트 K3, K4, K5, K6, K8이 확인합니다.

### Vanilla, mini-react, React의 차이

1위가 바뀌는 클릭 한 번에 순위표의 DOM에 하는 일입니다.

| | DOM에 하는 일 |
| --- | --- |
| Vanilla (`innerHTML`) | 순위표의 줄을 모두 새로 만듭니다 |
| mini-react | 줄은 그대로 두고, 자리가 바뀐 두 줄의 글자를 고칩니다 (`TEXT` 6) |
| React (`key`) | 글자는 그대로 두고, 줄을 옮깁니다 |

mini-react는 `key`가 없어 같은 번호의 자식끼리 비교합니다([`diff-compares-same-index-children-first`](docs/adr/diff/diff-compares-same-index-children-first.md)). mini-react의 줄은 테스트 K5가 확인합니다. Vanilla와 React의 줄은 이 저장소에서 재지 않았습니다.

## How We Built It (TBD)



### 자동 검사

이 연결은 자동으로 검사합니다.

| 연결 | 검사 |
| ---- | ---- |
| LMS 문장 69개 → 근거 ADR 이름 | `npm run check`가 그 이름의 ADR 파일이 있는지 확인합니다 |
| ADR 101개 → 테스트 ID | `npm run check`가 인용한 ID(342개)가 테스트에 있는지 확인합니다 |
| 테스트 → 코드 | `npm test`. CI가 PR마다 실행합니다 |

## Environment
### Tech Stack
| 구분 | 도구 | 용도 |
| --- | --- | --- |
| Language | TypeScript 7 | `strict`, `noUncheckedIndexedAccess` 켜고 사용 |
| Runtime | Node.js 26 | 버전은 `.nvmrc` 기준 |
| Dev Server / Build | Vite 8 | 개발 서버, 데모 페이지 빌드 |
| Test | Vitest 5 + jsdom | 단위 테스트, 기능 테스트. jsdom으로 브라우저 DOM 환경 재현 |
| Lint / Format | Biome 2 | 코드 형식 통일, 실수 자동 검사 |
| CI | GitHub Actions | PR과 main push마다 typecheck → check → test → build 실행 |
| Deploy | GitHub Pages | main에 머지되면 데모 페이지 자동 배포 |


### Project Structure
```text
mini-react/
├── src/
│   ├── main.ts                진입점. index.html이 불러옴
│   ├── vnode.ts               VNode 타입, DOM ↔ VNode 변환
│   ├── diff.ts                diffViews: 두 View 비교 → Patch 목록
│   ├── patch.ts               applyPatchesToDom: Patch 목록을 DOM에 반영
│   ├── history.ts             StateHistory: 뒤로가기 / 앞으로가기
│   ├── function-component.ts  FunctionComponent, useState / useEffect / useMemo
│   ├── test-pages/            검증 페이지, 데모 페이지
│   └── *.test.ts              테스트 (소스 옆에 둠)
├── docs/
│   ├── examples/              Hello World 등 사용 예제
│   └── adr/                   설계 결정과 이유
├── index.html                 데모 페이지
└── GLOSSARY.md                코드와 문서에서 쓰는 용어 정리
```




## Getting Started

### 설치 및 실행
Node.js **26**이 필요합니다(`.nvmrc` 기준). 저장소를 내려받고 개발 서버를 실행하세요.

```bash
git clone https://github.com/benjohnbill/mini-react.git
cd mini-react
npm ci             # 도구 설치 (Node 버전: .nvmrc)
npm run dev        # 개발 서버에서 index.html 실행
npm test           # 단위 테스트
```


### Hello World

Root Component는 화면을 설명하는 `VNode`를 돌려주는 함수입니다. 문자열도 `VNode`이므로 한 줄로 첫 화면을 그릴 수 있습니다.

```ts
new FunctionComponent(() => "Hello World").mount(container);
```

`npm run dev` 실행 후 `http://localhost:5173/docs/examples/hello-world/`에서 확인합니다. 전체 코드: [main.ts](docs/examples/hello-world/main.ts) · [index.html](docs/examples/hello-world/index.html)

![Hello World 실행 화면](docs/examples/hello-world/screenshot.png)

더 많은 예제와 Root Component 작성 규칙은 [예제 모음](docs/examples/README.md)에 있습니다.

## Team

| GitHub 계정   | 이름 | 브랜치    | 
| :------------ | :--- | :-------- |
| `benjohnbill` | 조진근 | `CJG`     |
| `oyatmin1031` | 이민호 | (확인 필요) |
| `DavinAn6`    | 안다빈 | `Davin`   |


### 작업 규칙
- `CONVENTION.md`: 브랜치, PR, 커밋, 병합 규칙. 작업 시작 전에 읽음
- `AGENTS.md`: 에이전트에게 작업을 맡기기 전에 읽음
- 마일스톤과 할 일: [팀 보드](https://github.com/users/benjohnbill/projects/7)