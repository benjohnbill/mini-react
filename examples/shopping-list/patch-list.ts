import { diffViews } from "../../src/diff";
import type { Patch } from "../../src/patch";
import { createVNodeFromDom, type VNode } from "../../src/vnode";

function createNodeLabel(node: VNode): string {
  return typeof node === "string" ? JSON.stringify(node) : `<${node.type}>`;
}

function createPatchLine(patch: Patch): string {
  const place = `${patch.type} [${patch.path.join(", ")}]`;
  if (patch.type === "TEXT") return `${place} ${JSON.stringify(patch.text)}`;
  if (patch.type === "INSERT" || patch.type === "REPLACE") {
    return `${place} ${createNodeLabel(patch.node)}`;
  }
  if (patch.type === "PROPS") {
    return `${place} ${[...Object.keys(patch.set), ...patch.remove].join(", ")}`;
  }
  return place;
}

// 클릭 직전과 직후의 container 안 View를 DOM에서 읽어 diffViews로 비교하고, 그 Patch 목록을 output에 적습니다.
// 직전의 View는 capture 단계에서 읽습니다. 그래야 입력란에 친 글자가 차이로 잡히지 않습니다.
export function startPatchList(container: Element, output: Element): void {
  let viewBeforeClick: VNode | undefined;
  container.addEventListener(
    "click",
    () => {
      const viewElement = container.firstElementChild;
      viewBeforeClick =
        viewElement === null ? undefined : createVNodeFromDom(viewElement);
    },
    { capture: true },
  );
  container.addEventListener("click", () => {
    const viewElement = container.firstElementChild;
    if (viewBeforeClick === undefined || viewElement === null) return;
    const patches = diffViews(viewBeforeClick, createVNodeFromDom(viewElement));
    output.textContent = patches.map(createPatchLine).join("\n");
  });
}
