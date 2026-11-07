# mini-react

mini-react 코드에서 쓰는 이름을 고정합니다.

## Language

**VNode**:
화면의 한 부분을 설명하는 값입니다. 문자열이거나, 태그와 속성과 자식을 가진 객체입니다.
_Avoid_: 화면 설명 객체, 가상 노드, vdom 객체

**View**:
화면 전체를 설명하는 최상위 `VNode`입니다.
_Avoid_: 화면 트리, 루트 객체

**Patch**:
`View`의 차이를 DOM에 반영하기 위한 지시를 적은 값입니다.
_Avoid_: 변경 사항, 델타

**container**:
`View`를 그려 넣는 DOM 요소입니다.
_Avoid_: 루트, 마운트 지점
