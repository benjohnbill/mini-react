---
status: proposed
---

# Patch는 다섯 종류이고, path는 앞의 Patch를 적용한 뒤의 트리를 가리킵니다

`Patch`는 `TEXT`, `REPLACE`, `PROPS`, `INSERT`, `REMOVE` 다섯 종류입니다. `applyPatchesToDom`은 받은 순서대로 하나씩 적용하고, 각 `path`는 앞의 `Patch`를 적용한 뒤의 트리에서 찾습니다. 그래서 순서를 맞추는 책임은 `diffViews`에 있습니다. `applyPatchesToDom`은 순서를 고치지 않습니다.

## 형식

```ts
type Patch =
  | { type: "TEXT"; path: number[]; text: string }
  | { type: "REPLACE"; path: number[]; node: VNode }
  | { type: "PROPS"; path: number[]; set: Record<string, string>; remove: string[] }
  | { type: "INSERT"; path: number[]; node: VNode }
  | { type: "REMOVE"; path: number[] };
```

- **`TEXT`:** `path`가 가리키는 글자 노드의 글자를 `text`로 바꿉니다. `path`는 글자 노드 자체를 가리킵니다. `<p>a</p>`의 글자는 `[0]`입니다. 글자는 HTML로 해석하지 않습니다(ADR 0005).
- **`REPLACE`:** `path`의 노드를 `node`로 만든 DOM으로 바꿉니다. 글자와 요소 사이도 바꿀 수 있습니다.
- **`PROPS`:** `set`의 속성을 쓰고 `remove`의 속성을 지웁니다. 요소는 같은 객체로 남습니다. 입력칸의 `value`는 `.value`에 씁니다(ADR 0005). `set`과 `remove`가 모두 비어 있으면 DOM을 바꾸지 않습니다.
- **`INSERT`:** `path`의 마지막 번호 자리에 `node`로 만든 DOM을 끼워 넣습니다. 마지막 번호는 부모의 자식 수까지 쓸 수 있고, 자식 수와 같으면 끝에 붙입니다.
- **`REMOVE`:** `path`의 노드를 지웁니다.

## path

- `View`에서 노드까지 내려가는 `children` 번호의 목록입니다. `[]`는 `View` 자신이고, `container`는 그대로 남습니다.
- `container`에는 `View` 하나만 둡니다. `applyPatchesToDom`은 `container`의 첫 글자 또는 요소 자식을 `View`로 보므로, `View` 앞에 공백 글자가 있으면 `[]`가 그 공백을 가리킵니다.
- 번호는 글자 노드와 요소만 셉니다. `VNode`의 `children`과 번호를 맞추기 위해서입니다. 주석은 세지 않습니다(ADR 0005).
- 각 `path`는 앞의 `Patch`를 적용한 뒤의 트리를 기준으로 합니다.

## 순서

`diffViews`는 같은 번호의 자식끼리 비교한 `Patch`를 먼저 내고, 늘어난 자식은 앞 번호부터 `INSERT`하고, 줄어든 자식은 뒤 번호부터 `REMOVE`합니다. key가 없으면 지우는 자식은 언제나 끝 번호에 있으므로, 앞 번호의 `Patch`와 번호가 부딪히지 않습니다. 한 요소에서는 그 요소의 `PROPS`를 자식의 `Patch`보다 먼저 냅니다.

## 실패

`path`에 노드가 없거나, `TEXT`가 글자 노드가 아닌 곳을, `PROPS`가 요소가 아닌 곳을 가리키면 `Error`를 던집니다. 메시지에 `path`를 적습니다. 앞서 적용한 `Patch`는 되돌리지 않습니다.

`diffViews`는 두 인자 중 하나가 `null`이나 `undefined`이면 `TypeError`를 던집니다. 자식 안의 값은 검사하지 않습니다.

## 고려한 대안

- **`path`를 변경 전 트리 기준으로 해석하기:** `applyPatchesToDom`이 모든 `path`를 먼저 노드로 찾은 뒤에 적용하면 순서와 무관해지고, 실패할 때 DOM을 바꾸기 전에 멈춥니다. 하지만 새 노드의 자리는 변경 전 트리에 없으므로 `INSERT`에 다른 위치 표현이 필요합니다. 팀 테스트 목록(Lark)의 `diff-child-remove`, `diff-remove-all`, `diff-from-empty`, `patch-remove`가 이미 순서를 보장하는 방식을 기대하므로 쓰지 않습니다.
- **`INSERT` 대신 `CREATE`:** 팀 테스트 목록은 `CREATE`를 쓰지만, `CONVENTION.md`의 동사 표에서 `create`는 "새로 만들어 돌려줍니다"입니다. DOM에 끼워 넣는 일과 뜻이 섞이므로 `INSERT`로 씁니다.
- **실패할 때 앞의 변경을 되돌리기:** 되돌릴 기록을 따로 가져야 합니다. 요구사항에 없으므로 하지 않습니다.

## 결과

- 팀 테스트 목록의 `CREATE`(37, 44행)는 `INSERT`로 고쳐야 합니다.
- 입력칸에서 `value`를 지우는 `PROPS`는 정하지 않습니다. `createVNodeFromDom`이 입력칸의 `value`를 언제나 넣으므로(ADR 0005), DOM에서 읽은 `View`끼리 비교하면 이 `Patch`는 생기지 않습니다. 지금은 `value` 속성만 지웁니다.
- M9의 key와 `MOVE`가 들어오면 지우는 자식이 끝 번호에 있다는 전제가 깨집니다. 그때 순서 규칙을 다시 정합니다.
