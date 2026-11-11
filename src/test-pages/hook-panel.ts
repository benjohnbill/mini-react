import { diffViews } from "../diff";
import type { FunctionComponent } from "../function-component";
import type { Patch } from "../patch";
import { createDomFromVNode, type VNode } from "../vnode";

// 단계 이름과 순서는 docs/adr/README.md의 폴더와 같습니다.
const stages = [
  "click",
  "setter",
  "instance",
  "render",
  "diff",
  "patch",
  "effect",
] as const;
type Stage = (typeof stages)[number];

const STAGE_DELAY_MS = 150;
const HIGHLIGHT_MS = 900;

type HookCell = FunctionComponent["hooks"][number];
type CellResult = "changed" | "same" | "recomputed" | "skipped" | "ran";
type CellSnapshot = { cell: HookCell; value: unknown };
type CellRow = { label: string; valueText: string; result?: CellResult };

export type HookPanelCell = {
  label: string;
  createText: (value: unknown) => string;
};

export type HookPanelOptions = {
  panel: Element;
  container: Element;
  instance: FunctionComponent;
  cells: readonly HookPanelCell[];
};

const resultTexts: Record<CellResult, string> = {
  changed: "바뀜",
  same: "그대로",
  recomputed: "다시 계산",
  skipped: "건너뜀",
  ran: "실행",
};

// mount()가 붙인 클릭 리스너 뒤에 불리도록, mount()한 뒤에 시작합니다.
// update()는 클릭 안에서 끝나므로, 이 리스너가 불릴 때 칸과 View는 이미 클릭 뒤의 값입니다.
export function startHookPanel({
  panel,
  container,
  instance,
  cells,
}: HookPanelOptions): void {
  let snapshotsBefore = createCellSnapshots(instance.hooks);
  let viewBefore = instance.currentView;
  panel.replaceChildren(
    createDomFromVNode(
      createPanelView({
        ranStages: [],
        rows: createCellRows(cells, snapshotsBefore, undefined),
        patches: [],
      }),
    ),
  );

  container.addEventListener("click", (event) => {
    if (!isActionClick(event)) {
      return;
    }
    const snapshotsAfter = createCellSnapshots(instance.hooks);
    const viewAfter = instance.currentView;
    const rows = createCellRows(cells, snapshotsAfter, snapshotsBefore);
    const patches =
      viewBefore === undefined || viewAfter === undefined
        ? []
        : diffViews(viewBefore, viewAfter);
    panel.replaceChildren(
      createDomFromVNode(
        createPanelView({
          ranStages: createRanStages(viewBefore !== viewAfter, patches, rows),
          rows,
          patches,
        }),
      ),
    );
    snapshotsBefore = snapshotsAfter;
    viewBefore = viewAfter;
  });

  startHighlightOfChangedNodes(container);
}

function isActionClick(event: Event): boolean {
  return (
    event.target instanceof Element &&
    event.target.closest("[data-action]") !== null
  );
}

// State 칸은 value를, effect 칸은 예약할 때마다 늘어나는 version을 적어 둡니다.
// useMemo는 다시 계산할 때 칸 객체를 새로 만들므로, 칸 객체 자체를 비교합니다.
function createCellSnapshots(hooks: readonly HookCell[]): CellSnapshot[] {
  return hooks.map((cell) => ({
    cell,
    value: "version" in cell ? cell.version : cell.value,
  }));
}

function createCellRows(
  cells: readonly HookPanelCell[],
  snapshots: readonly CellSnapshot[],
  snapshotsBefore: readonly CellSnapshot[] | undefined,
): CellRow[] {
  return snapshots.map((snapshot, index) => {
    const { cell } = snapshot;
    const panelCell = cells[index];
    const before = snapshotsBefore?.[index];
    return {
      label: panelCell?.label ?? "Hook",
      valueText:
        panelCell?.createText("version" in cell ? cell.deps : cell.value) ?? "",
      result:
        before === undefined ? undefined : createCellResult(snapshot, before),
    };
  });
}

function createCellResult(
  snapshot: CellSnapshot,
  before: CellSnapshot,
): CellResult {
  const { cell } = snapshot;
  if ("setter" in cell) {
    return Object.is(snapshot.value, before.value) ? "same" : "changed";
  }
  if ("version" in cell) {
    return snapshot.value === before.value ? "skipped" : "ran";
  }
  return cell === before.cell ? "skipped" : "recomputed";
}

// 클릭 함수가 setter를 불렀다고 보고, View 객체가 새것이면 update()가 일어난 것으로 판정합니다.
function createRanStages(
  hasNewView: boolean,
  patches: readonly Patch[],
  rows: readonly CellRow[],
): Stage[] {
  const ranStages: Stage[] = ["click", "setter"];
  if (!hasNewView) {
    return ranStages;
  }
  ranStages.push("instance", "render", "diff");
  if (patches.length > 0) {
    ranStages.push("patch");
  }
  if (rows.some((row) => row.result === "ran")) {
    ranStages.push("effect");
  }
  return ranStages;
}

function createPanelView({
  ranStages,
  rows,
  patches,
}: {
  ranStages: readonly Stage[];
  rows: readonly CellRow[];
  patches: readonly Patch[];
}): VNode {
  return {
    type: "div",
    props: {},
    children: [
      { type: "h3", props: {}, children: ["이번 클릭이 지난 단계"] },
      {
        type: "ol",
        props: { class: "stages" },
        children: stages.map((stage) =>
          createStageItem(stage, ranStages.indexOf(stage)),
        ),
      },
      {
        type: "p",
        props: { class: "panel-message" },
        children: [createMessage(ranStages)],
      },
      { type: "h3", props: {}, children: ["hooks"] },
      {
        type: "table",
        props: { class: "cells" },
        children: [
          {
            type: "tbody",
            props: {},
            children: rows.map((row, index) => createCellRow(row, index)),
          },
        ],
      },
      {
        type: "h3",
        props: { id: "hook-panel-patch-count" },
        children: [`Patch ${patches.length}건`],
      },
      {
        type: "ol",
        props: { id: "hook-panel-patches" },
        children: patches.map((patch) => ({
          type: "li",
          props: {},
          children: [createTextFromPatch(patch)],
        })),
      },
    ],
  };
}

// 지난 단계는 순서대로 켜지도록, 몇 번째로 지났는지를 animation-delay에 적습니다.
function createStageItem(stage: Stage, ranOrder: number): VNode {
  const hasRun = ranOrder !== -1;
  return {
    type: "li",
    props: {
      class: hasRun ? "stage ran" : "stage",
      "data-stage": stage,
      "data-ran": String(hasRun),
      style: `animation-delay: ${Math.max(ranOrder, 0) * STAGE_DELAY_MS}ms`,
    },
    children: [stage],
  };
}

function createMessage(ranStages: readonly Stage[]): string {
  if (ranStages.length === 0) {
    return "버튼을 누르면 그 클릭이 지난 단계가 켜집니다.";
  }
  if (!ranStages.includes("instance")) {
    return "setter가 받은 값이 칸의 값과 같아서 update()를 부르지 않았습니다.";
  }
  return ranStages.includes("effect")
    ? "deps가 바뀐 effect를 DOM 반영 뒤에 실행했습니다."
    : "deps가 같은 effect는 건너뛰었습니다.";
}

function createCellRow(row: CellRow, index: number): VNode {
  return {
    type: "tr",
    props: {
      "data-cell": String(index),
      "data-result": row.result ?? "",
    },
    children: [
      { type: "th", props: {}, children: [`hooks[${index}]`] },
      { type: "td", props: {}, children: [row.label] },
      { type: "td", props: { class: "cell-value" }, children: [row.valueText] },
      {
        type: "td",
        props: { class: "cell-result" },
        children: [row.result === undefined ? "" : resultTexts[row.result]],
      },
    ],
  };
}

function createTextFromPatch(patch: Patch): string {
  const path = `[${patch.path.join(", ")}]`;
  switch (patch.type) {
    case "TEXT":
      return `TEXT ${path} "${patch.text}"`;
    case "PROPS":
      return `PROPS ${path} ${[...Object.keys(patch.set), ...patch.remove].join(", ")}`;
    case "INSERT":
    case "REPLACE":
      return `${patch.type} ${path} ${typeof patch.node === "string" ? `"${patch.node}"` : `<${patch.node.type}>`}`;
    case "REMOVE":
      return `REMOVE ${path}`;
  }
}

// Patch가 실제로 바꾼 DOM 노드를 MutationObserver로 받아 잠깐 색을 입힙니다.
// animate()는 속성을 바꾸지 않으므로, 다음 Patch가 모르는 변경을 DOM에 남기지 않습니다.
function startHighlightOfChangedNodes(container: Element): void {
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const changedNodes =
        record.type === "childList" ? [...record.addedNodes] : [record.target];
      for (const node of changedNodes) {
        const element = node instanceof Element ? node : node.parentElement;
        if (element !== null && typeof element.animate === "function") {
          element.animate(
            [
              { backgroundColor: "#ffd54a" },
              { backgroundColor: "transparent" },
            ],
            { duration: HIGHLIGHT_MS },
          );
        }
      }
    }
  });
  observer.observe(container, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
}
