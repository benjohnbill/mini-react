/*
 * [diff.ts]
 * 이전 View와 새 View를 비교해서, DOM을 어떻게 고쳐야 하는지 Patch 목록으로 돌려주는 파일.
 *  - 공개 함수는 diffViews 하나.
 *  - DOM은 전혀 건드리지 않는다. (DOM 수정은 patch.ts의 applyPatchesToDom이 담당)
 *  - 흐름 : diffViews -> diffVNodes -> diffProps / diffChildren -> (자식마다) diffVNodes ...
 */
import type { Patch } from "./patch";
import type { VNode } from "./vnode";

// View 루트 자신을 가리키는 path. 루트에서 내려간 자식 번호가 하나도 없으므로 빈 배열.
const ROOT_PATH: number[] = [];

/*
 * ROLE : 두 View(화면 전체)를 비교해서 Patch 목록을 돌려준다.
 * PARAM : currentView(지금 화면), newView(바꾸고 싶은 화면) -> Patch[]
 *
 * 참고 :
 *  - 바뀐 게 없으면 빈 배열 []
 *  - null이나 undefined가 오면 TypeError. 비교할 View가 없다는 뜻이라 조용히 넘기지 않는다.
 *  - 실제 비교는 diffVNodes가 하고, 여기서는 "루트 위치(ROOT_PATH)에서 시작"만 정한다.
 *    (호출하는 쪽이 path를 몰라도 되도록 감싼 공개 함수)
 *  - 쓰이는 곳: function-component(상태가 바뀌어 다시 그릴 때), test-pages
 *    보통 이렇게 쓴다 ->
 *      const patches = diffViews(currentView, newView);
 *      applyPatchesToDom(container, patches);
 */
export function diffViews(currentView: VNode, newView: VNode): Patch[] {
  if (
    currentView === null ||
    currentView === undefined ||
    newView === null ||
    newView === undefined
  ) {
    throw new TypeError("diffViews의 인자는 VNode여야 합니다.");
  }
  return diffVNodes(currentView, newView, ROOT_PATH);
}

/*
 * ROLE : 같은 위치(path)에 있는 VNode 두 개를 비교해서 Patch 목록을 돌려준다.
 * PARAM : currentVNode(이전 것), newVNode(새 것), path(둘의 위치) -> Patch[]
 *
 * 참고 :
 *  - 판단 순서
 *    1) 둘 다 문자열 : 글자가 다를 때만 "TEXT"
 *    2) 하나만 문자열이거나 태그 이름이 다름 : 통째로 "REPLACE" (안쪽은 비교하지 않음)
 *    3) 같은 태그 : 속성 비교(diffProps) + 자식 비교(diffChildren)
 *  - diffChildren이 자식마다 다시 이 함수를 부른다. (재귀)
 */
function diffVNodes(
  currentVNode: VNode,
  newVNode: VNode,
  path: number[],
): Patch[] {
  if (typeof currentVNode === "string" && typeof newVNode === "string") {
    if (currentVNode === newVNode) {
      return [];
    }
    return [{ type: "TEXT", path, text: newVNode }];
  }
  if (
    typeof currentVNode === "string" ||
    typeof newVNode === "string" ||
    currentVNode.type !== newVNode.type
  ) {
    return [{ type: "REPLACE", path, node: newVNode }];
  }
  return [
    ...diffProps(currentVNode.props, newVNode.props, path),
    ...diffChildren(currentVNode.children, newVNode.children, path),
  ];
}

/*
 * ROLE : 같은 태그 요소의 속성(props)을 비교해서, 바뀐 게 있으면 "PROPS" Patch 하나를 돌려준다.
 * PARAM : currentProps(이전 속성), newProps(새 속성), path(요소의 위치) -> Patch[] (0개 또는 1개)
 *
 * 참고 :
 *  - setProps    : 새로 생겼거나 값이 바뀐 속성
 *  - removeProps : 이전에는 있었는데 새 것에는 없는 속성 이름
 *  - 둘 다 비어 있으면 [] (Patch를 만들지 않음)
 *  - 속성 이름 확인은 `in`이 아니라 Object.hasOwn 사용.
 *    `"constructor" in {}`는 true라서, `in`을 쓰면 없는 속성을 있다고 착각한다.
 */
function diffProps(
  currentProps: Record<string, string>,
  newProps: Record<string, string>,
  path: number[],
): Patch[] {
  const setProps: Record<string, string> = {};
  for (const [name, value] of Object.entries(newProps)) {
    if (!Object.hasOwn(currentProps, name) || currentProps[name] !== value) {
      setProps[name] = value;
    }
  }
  const removeProps = Object.keys(currentProps).filter(
    (name) => !Object.hasOwn(newProps, name),
  );

  if (Object.keys(setProps).length === 0 && removeProps.length === 0) {
    return [];
  }
  return [{ type: "PROPS", path, set: setProps, remove: removeProps }];
}

/*
 * ROLE : 두 자식 목록을 "번호(index)끼리" 비교해서 Patch 목록을 돌려준다.
 * PARAM : currentChildren(이전 자식들), newChildren(새 자식들), parentPath(부모의 위치) -> Patch[]
 *
 * 참고 :
 *  - 자식의 path = 부모 path 뒤에 자기 번호를 붙인 것. ([0] 부모의 2번 자식 -> [0, 2])
 *  - 만드는 순서가 중요하다. (applyPatchesToDom이 앞에서부터 적용하므로)
 *    1) 양쪽에 다 있는 번호 : diffVNodes로 비교 (재귀)
 *    2) 이전에만 있는 번호 : "REMOVE"를 뒤 번호부터 만든다.
 *       앞에서부터 지우면 뒤 자식들 번호가 하나씩 당겨져서 path가 틀어지기 때문.
 *    3) 새 것에만 있는 번호 : "INSERT"를 앞 번호부터 만든다. (끝에 차례로 붙음)
 *  - key가 없어서 순서만 바뀐 자식도 "다른 것"으로 본다. (예: [a, b] -> [b, a]는 두 번 비교)
 */
function diffChildren(
  currentChildren: VNode[],
  newChildren: VNode[],
  parentPath: number[],
): Patch[] {
  const sharedPatches: Patch[] = [];
  const insertPatches: Patch[] = [];
  newChildren.forEach((newChild, index) => {
    const childPath = [...parentPath, index];
    const currentChild = currentChildren[index];
    if (currentChild === undefined) {
      insertPatches.push({ type: "INSERT", path: childPath, node: newChild });
    } else {
      sharedPatches.push(...diffVNodes(currentChild, newChild, childPath));
    }
  });

  const removePatches: Patch[] = [];
  for (
    let index = currentChildren.length - 1;
    index >= newChildren.length;
    index--
  ) {
    removePatches.push({ type: "REMOVE", path: [...parentPath, index] });
  }

  return [...sharedPatches, ...removePatches, ...insertPatches];
}
