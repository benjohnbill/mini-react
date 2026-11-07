---
status: proposed
---

# DOM과 VNode를 실제 DOM의 자식과 하나씩 맞춰 변환합니다

`createVNodeFromDom`은 사용자가 보고 있는 화면을 빠짐없이 `VNode`로 읽고, 화면에 보이지 않는 주석만 버립니다. `createDomFromVNode`은 `VNode`에 적힌 것을 빠짐없이, 적힌 그대로 DOM으로 만듭니다. `VNode`의 `children`은 실제 DOM의 자식과 하나씩 맞춥니다. M3의 `applyPatchesToDom`이 `children`의 번호로 DOM의 노드를 찾기 때문입니다.

## DOM에서 VNode로

- **글자:** 공백까지 유지합니다. 공백을 지우면 `<b>a</b> <i>b</i>`의 띄어쓰기가 사라집니다. 엔티티는 해석된 글자로 담습니다(`&amp;`는 `&`).
- **주석:** HTML 주석 노드만 버립니다. 주석은 입력 DOM에서 지우지 않고 `VNode`에서만 뺍니다. 그래서 `<div>hello<!-- 설명 --><span>world</span></div>`에서 `span`은 `childNodes`의 2번이고 `children`의 1번입니다. M3는 노드를 찾을 때 주석을 세지 않습니다.
- **주석 양옆의 글자:** 합치지 않습니다. `a<!--x-->b`는 `["a", "b"]`입니다. 주석을 버린 뒤에도 DOM에는 글자 노드 두 개가 남기 때문입니다.
- **빈 글자 노드:** 버리지 않고 `""`로 남깁니다. `children: [""]`를 그리면 빈 글자 노드가 생기므로, 이것을 버리고 읽으면 옆 노드의 번호가 어긋납니다.
- **`type`:** 소문자로 적습니다. `tagName`은 `DIV`처럼 대문자를 돌려줍니다.

## VNode에서 DOM으로

문자열 `VNode`는 글자 노드로만 만들고, HTML로 해석하지 않습니다. 문자열을 HTML로 해석하면 `<React>` 같은 글자가 요소로 바뀌어 화면에서 사라지고, 사용자 데이터에 든 `<img src=x onerror=alert(1)>`가 실행됩니다(XSS). `applyPatchesToDom`이 글자를 바꿀 때도 같은 규칙을 따릅니다.

## 입력칸

입력칸은 `<input>` 중 `checkbox`와 `radio`를 뺀 것입니다. 사용자가 친 글자는 `value` 속성이 아니라 `.value`에 있으므로, `createVNodeFromDom`은 `.value`를 읽어 `props.value`에 담습니다. `props.value`는 언제나 `.value`를 뜻하고, 값이 `""`여도 넣습니다. 빈 값을 생략하면 Diff가 속성을 지우는 Patch를 만드는데, 이미 값이 바뀐 입력칸에서는 속성을 지워도 `.value`가 따라가지 않습니다.

`li`, `button`처럼 `.value`를 갖지만 입력칸이 아닌 요소는 `.value`를 읽지 않습니다. `li`의 `.value`는 목록의 번호입니다.

## 고려한 대안

- **문자열을 HTML로 해석하기(`innerHTML`):** HTML 조각을 문자열 하나로 적을 수 있지만, 글자와 HTML을 구별할 수 없고 XSS가 생깁니다. React도 JSX에 넣은 값을 기본으로 이스케이프하고, HTML 해석은 `dangerouslySetInnerHTML`로 따로 엽니다([JSX Prevents Injection Attacks](https://legacy.reactjs.org/docs/introducing-jsx.html), [`dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common)).
- **주석 양옆의 글자를 하나로 합치기:** `VNode`는 사람이 보는 화면과 비슷해지지만, 실제 DOM과 번호가 달라집니다.
- **빈 입력칸의 `value` 생략:** `VNode`는 짧아지지만, M3에 "입력칸에서 `value`를 지우는 Patch는 `.value`를 `""`로 쓴다"는 예외 규칙이 필요합니다.

## 결과

- 아무것도 치지 않은 `<input>`을 왕복하면 `<input value="">`가 되어, 원본과 `isEqualNode`로 비교하면 `false`입니다. 입력칸의 왕복 테스트는 `.value`로 비교합니다. `isEqualNode`는 `.value`를 보지 못합니다.
- 주석이 든 DOM은 왕복하면 주석이 사라지므로 왕복 테스트에 쓰지 않습니다.
- 다음은 다루지 않습니다.
  - `textarea`, `select`, `checkbox`, `radio`: 지금 상태가 `.value` 하나에 있지 않습니다. `textarea`는 자식 글자가 처음 값으로 남고, `select`는 `selected` 속성이 처음 고른 항목으로 남고, `checkbox`와 `radio`는 상태가 `.checked`에 있습니다. 각자 전용 규칙이 필요합니다.
  - SVG: 이름공간을 따로 다뤄야 합니다. HTML 이름공간으로 만들면 `viewBox` 같은 속성의 대소문자가 사라집니다.
  - `<template>`: 내용이 `childNodes`가 아니라 `content`에 있어서, 읽으면 자식이 비어 보입니다.
