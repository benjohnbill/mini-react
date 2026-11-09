/*
 * [patch.ts]
 * Patch(DOM을 고치라는 지시)의 형식을 정하고, Patch 목록을 실제 DOM에 반영하는 파일.
 *  - 공개 : Patch 타입, applyPatchesToDom
 *  - 흐름 : applyPatchesToDom -> (Patch마다) findNodeAtPath -> findChildNode
 *                              -> remove / replaceWith / textContent / applyPropsPatch / applyInsertPatch
 *  - 목표 : 적용이 끝난 DOM이 createDomFromVNode(newView)로 새로 만든 DOM과 같아야 한다.
 */
import {
  applyPropsToElement,
  createDomFromVNode,
  hasValueProperty,
  type VNode,
} from "./vnode";

/*
 * ROLE : View의 차이를 DOM에 반영하기 위한 "지시 한 건".
 *        diffViews가 만들고, applyPatchesToDom이 읽어서 실제 DOM을 고친다.
 * PARAM : type = 할 일의 종류, path = 고칠 노드의 위치, 나머지 = 할 일에 필요한 값
 *   - "INSERT"  : path 자리에 node로 새 노드를 만들어 넣는다
 *   - "REMOVE"  : path 자리의 노드를 지운다
 *   - "REPLACE" : path 자리의 노드를 node로 만든 새 노드로 통째로 바꾼다
 *   - "TEXT"    : path 자리의 텍스트 노드 글자를 text로 바꾼다
 *   - "PROPS"   : path 자리의 요소에 set을 설정하고 remove에 적힌 속성을 지운다
 *
 * 참고 :
 *  - path는 View 루트에서 자식 번호를 차례로 적은 배열.
 *    []      = View 루트 자신 (container의 첫 자식)
 *    [1, 0]  = 루트의 1번 자식의 0번 자식
 *  - Patch 목록은 "앞에서부터 순서대로" 적용해야 path가 맞는다. (diffChildren 참고)
 */
export type Patch =
  | { type: "INSERT"; path: number[]; node: VNode }
  | { type: "REMOVE"; path: number[] }
  | { type: "REPLACE"; path: number[]; node: VNode }
  | { type: "TEXT"; path: number[]; text: string }
  | {
      type: "PROPS";
      path: number[];
      set: Record<string, string>;
      remove: string[];
    };

// View 루트가 container 안에서 몇 번째 자식인지. container에는 View 루트 하나만 들어 있다.
const ROOT_INDEX = 0;

/*
 * ROLE : Patch 목록을 차례대로 container 안의 DOM에 반영한다.
 * PARAM : container(View가 그려진 DOM 요소), patches(diffViews의 결과) -> 반환값 없음 (DOM을 직접 수정)
 *
 * 참고 :
 *  - 반드시 배열 순서대로 적용한다. diffChildren이 "적용 순서대로 path가 맞도록" 만들었기 때문.
 *  - "INSERT"만 따로 처리한다. 새로 넣을 자리에는 아직 노드가 없어서, 노드가 아니라 "부모"를 찾아야 함.
 *  - 나머지 4종류는 path로 노드를 찾은 뒤 바로 고친다.
 *    REMOVE  -> node.remove()
 *    REPLACE -> node.replaceWith(새 노드)   (부모가 container인 View 루트도 이 방법으로 바뀐다)
 *    TEXT    -> 글자 노드인지 확인한 뒤 node.data = 새 글자
 *    PROPS   -> applyPropsPatch
 *  - path에 노드가 없으면 에러를 던진다.
 *    노드가 있어도 종류가 틀리면(TEXT인데 요소, PROPS인데 글자) 같은 이유로 에러를 던진다.
 *    DOM이 currentView와 이미 다르다는 뜻이라, 조용히 넘기면 화면이 계속 틀어지기 때문.
 *  - 쓰이는 곳: function-component(다시 그릴 때), test-pages
 *      const patches = diffViews(currentView, newView);
 *      applyPatchesToDom(container, patches);
 */
export function applyPatchesToDom(container: Element, patches: Patch[]): void {
  for (const patch of patches) {
    if (patch.type === "INSERT") {
      applyInsertPatch(container, patch.path, patch.node);
      continue;
    }
    const targetNode = findNodeAtPath(container, patch.path);
    if (targetNode === undefined) {
      throw createMissingNodeError(patch.path);
    }
    switch (patch.type) {
      case "REMOVE":
        targetNode.remove();
        break;
      case "REPLACE":
        targetNode.replaceWith(createDomFromVNode(patch.node));
        break;
      case "TEXT":
        if (!(targetNode instanceof Text)) {
          throw createWrongNodeError(patch.type, patch.path);
        }
        targetNode.data = patch.text;
        break;
      case "PROPS":
        if (!(targetNode instanceof Element)) {
          throw createWrongNodeError(patch.type, patch.path);
        }
        applyPropsPatch(targetNode, patch.set, patch.remove);
        break;
    }
  }
}

/*
 * ROLE : "INSERT" Patch를 반영한다. path 자리에 node로 만든 새 노드를 끼워 넣는다.
 * PARAM : container, path(새 노드가 들어갈 위치), node(만들 노드) -> 반환값 없음
 *
 * 참고 :
 *  - path를 "부모 위치 + 마지막 번호"로 나눈다.  예) [0, 3] -> 부모 [0], 3번 자리
 *  - 번호는 0부터 "자식 수"까지만 된다. 자식 수와 같으면 맨 끝에 붙인다.
 *    그보다 크면 사이에 빈자리가 생긴다는 뜻이라 DOM과 View가 어긋난 것이므로 에러.
 *  - diffChildren은 INSERT를 항상 끝 번호에 만들기 때문에 실제로는 거의 "맨 끝에 붙이기"가 된다.
 *  - applyPatchesToDom에서 호출
 */
function applyInsertPatch(
  container: Element,
  path: number[],
  node: VNode,
): void {
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parentNode = findNodeAtPath(container, parentPath);
  if (index === undefined || parentNode === undefined) {
    throw createMissingNodeError(path);
  }
  const siblingNodes = Array.from(parentNode.childNodes).filter(
    isTextOrElementNode,
  );
  if (index > siblingNodes.length) {
    throw createMissingNodeError(path);
  }
  parentNode.insertBefore(
    createDomFromVNode(node),
    siblingNodes[index] ?? null,
  );
}

/*
 * ROLE : "PROPS" Patch를 반영한다. 바뀐 속성은 설정하고, 없어진 속성은 지운다.
 * PARAM : element(고칠 요소), setProps(설정할 속성), removeProps(지울 속성 이름) -> 반환값 없음
 *
 * 참고 :
 *  - 설정은 vnode.ts의 applyPropsToElement를 그대로 쓴다. (value 처리 규칙을 한 곳에서만 관리)
 *  - input/textarea에서 value를 지울 때는 속성만 지우면 화면 글자가 남는다.
 *    사용자가 입력한 값은 프로퍼티에 있기 때문. 그래서 .value = "" 도 함께 한다.
 *  - 요소인지는 applyPatchesToDom이 이미 확인했다.
 *  - applyPatchesToDom에서 호출
 */
function applyPropsPatch(
  element: Element,
  setProps: Record<string, string>,
  removeProps: string[],
): void {
  applyPropsToElement(element, setProps);
  for (const name of removeProps) {
    if (name === "value" && hasValueProperty(element)) {
      (element as HTMLInputElement | HTMLTextAreaElement).value = "";
    }
    element.removeAttribute(name);
  }
}

/*
 * ROLE : path를 따라 내려가서 그 자리의 DOM 노드를 찾는다.
 * PARAM : container, path -> 찾은 노드 (없으면 undefined)
 *
 * 참고 :
 *  - container에서 시작해 [ROOT_INDEX, ...path] 순서로 한 칸씩 내려간다.
 *    path [] -> container의 0번 자식 = View 루트
 *    path [2] -> View 루트의 2번 자식
 *  - 중간에 한 번이라도 못 찾으면 바로 undefined
 *  - applyPatchesToDom, applyInsertPatch에서 호출
 */
function findNodeAtPath(
  container: Element,
  path: number[],
): ChildNode | undefined {
  let foundNode: ChildNode | undefined;
  let parentNode: Node = container;
  for (const index of [ROOT_INDEX, ...path]) {
    foundNode = findChildNode(parentNode, index);
    if (foundNode === undefined) {
      return undefined;
    }
    parentNode = foundNode;
  }
  return foundNode;
}

/*
 * ROLE : 부모 노드의 index번 자식을 찾는다. 단, VNode가 되는 자식(텍스트, 요소)만 센다.
 * PARAM : parentNode(부모), index(몇 번째) -> 찾은 자식 노드 (없으면 undefined)
 *
 * 참고 :
 *  - createVNodeFromDom은 HTML 주석 노드를 버린다.
 *    그래서 DOM에 주석이 섞여 있으면 VNode 번호와 DOM 번호가 달라진다.
 *    같은 기준으로 세야 path가 맞으므로 주석 등은 건너뛰고 센다.
 *  - findNodeAtPath, applyInsertPatch에서 호출
 */
function findChildNode(parentNode: Node, index: number): ChildNode | undefined {
  const vnodeChildNodes = Array.from(parentNode.childNodes).filter(
    isTextOrElementNode,
  );
  return vnodeChildNodes[index];
}

/*
 * ROLE : 노드가 텍스트 노드나 요소 노드인지 확인한다. (VNode로 바뀌는 노드인지)
 * PARAM : node -> true / false
 *
 * 참고 :
 *  - vnode.ts의 createChildrenFromNodes와 같은 기준이다. 한쪽을 바꾸면 다른 쪽도 바꿔야 한다.
 *  - findChildNode에서 호출
 */
function isTextOrElementNode(node: ChildNode): boolean {
  return (
    node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE
  );
}

/*
 * ROLE : "path에 노드가 없다"는 에러를 만든다.
 * PARAM : path -> Error
 *
 * 참고 :
 *  - 같은 메시지를 두 곳(applyPatchesToDom, applyInsertPatch)에서 쓰므로 한 곳에 모았다.
 */
function createMissingNodeError(path: number[]): Error {
  return new Error(`Patch path [${path.join(", ")}] has no node`);
}

/*
 * ROLE : "path의 노드가 Patch가 기대하는 종류가 아니다"는 에러를 만든다.
 * PARAM : patchType(Patch 종류), path -> Error
 *
 * 참고 :
 *  - path를 메시지에 넣는다. 어느 자리에서 DOM과 View가 어긋났는지 바로 보이게 하기 위해서다.
 */
function createWrongNodeError(patchType: Patch["type"], path: number[]): Error {
  return new Error(
    `${patchType} Patch의 path가 맞지 않는 종류의 노드를 가리킵니다: [${path.join(", ")}]`,
  );
}
