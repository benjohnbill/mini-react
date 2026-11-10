# mini-react

mini-react 코드에서 쓰는 이름을 고정합니다. 쓰는 법은 `CONVENTION.md`의 "프로젝트 공통 용어 가이드"에 있습니다.

## 화면 표현

| 용어 | 뜻 | 코드 |
|---|---|---|
| **VNode** | 화면의 한 부분을 설명하는 값으로, 문자열(글자 노드 하나, HTML로 해석하지 않음)이거나 태그와 속성과 자식을 가진 객체입니다. | `VNode` |
| **View** | 화면 전체를 설명하는 최상위 `VNode`입니다. | |
| **Patch** | `View`의 차이를 DOM에 반영하기 위한 지시를 적은 값입니다. | `Patch` |
| **path** | `View`에서 노드까지 내려가는 `children` 번호의 목록이며, `[]`는 `View` 자신입니다. | `Patch`의 `path` |
| **StateHistory** | 저장한 `View`의 목록과 현재 위치이며, 뒤로 간 뒤 새 `View`를 저장하면 앞쪽 `View`를 지웁니다. | `StateHistory` |
| **container** | `View`를 그려 넣는 DOM 요소입니다. | `applyPatchesToDom`의 `container` |

## 검증 페이지

| 용어 | 뜻 | 코드 |
|---|---|---|
| **검증 페이지** | Phase 1의 기능을 화면에서 확인하는 페이지로, 실제 영역, 테스트 영역, 뒤로가기·Patch·앞으로가기 버튼이 있습니다. | `startVerificationPage` |
| **실제 영역** | 검증 페이지에서 Patch가 반영되는 `container`입니다. | `real` |
| **테스트 영역** | 검증 페이지에서 사용자가 HTML을 고치는 입력란이며, Patch를 누르기 전에는 실제 영역에 반영되지 않습니다. | `test` |
