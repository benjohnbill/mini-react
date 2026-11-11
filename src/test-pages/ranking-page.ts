import {
  FunctionComponent,
  type RootComponent,
  useEffect,
  useMemo,
  useState,
} from "../function-component";
import type { VNode } from "../vnode";
import { startHookPanel } from "./hook-panel";

type Track = "frontend" | "backend" | "infra" | "ai";
type TrackFilter = "all" | Track;
type Participant = { id: string; name: string; track: Track };
type Scores = Record<string, number>;
type RankingRow = Participant & { score: number };

const MIN_SCORE = 1;
const MAX_SCORE = 5;

const participants: readonly Participant[] = [
  { id: "p01", name: "김하늘", track: "frontend" },
  { id: "p02", name: "이도윤", track: "backend" },
  { id: "p03", name: "박서연", track: "infra" },
  { id: "p04", name: "최민준", track: "ai" },
  { id: "p05", name: "정지우", track: "frontend" },
  { id: "p06", name: "강서준", track: "backend" },
];

const initialScores: Scores = {
  p01: 3,
  p02: 4,
  p03: 4,
  p04: 2,
  p05: 3,
  p06: 1,
};

const trackFilters: readonly TrackFilter[] = [
  "all",
  "frontend",
  "backend",
  "infra",
  "ai",
];

function getScore(scores: Scores, participantId: string): number {
  const score = scores[participantId];
  if (score === undefined) {
    throw new Error(`Scores has no ${participantId}`);
  }
  return score;
}

// 점수가 높은 순서이고, 점수가 같으면 id가 앞선 사람이 위입니다.
function createRanking(scores: Scores, track: TrackFilter): RankingRow[] {
  return participants
    .filter((participant) => track === "all" || participant.track === track)
    .map((participant) => ({
      ...participant,
      score: getScore(scores, participant.id),
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.id.localeCompare(right.id),
    );
}

// 점수가 범위 끝에 있으면 받은 객체를 그대로 돌려주어, setter가 같은 값으로 판정하게 합니다.
function createScoresWithChange(
  scores: Scores,
  participantId: string,
  change: number,
): Scores {
  const score = getScore(scores, participantId);
  const newScore = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score + change));
  return newScore === score ? scores : { ...scores, [participantId]: newScore };
}

// 자식 Component: 한 사람의 이름, 트랙, 점수와 점수 버튼 둘을 그립니다.
function createEvaluationRow({
  participant,
  score,
}: {
  participant: Participant;
  score: number;
}): VNode {
  return {
    type: "li",
    props: {},
    children: [
      { type: "span", props: { class: "name" }, children: [participant.name] },
      {
        type: "span",
        props: { class: "track" },
        children: [participant.track],
      },
      {
        type: "button",
        props: {
          type: "button",
          "data-action": `decrease-${participant.id}`,
          "aria-label": `${participant.name} 점수 내리기`,
        },
        children: ["−"],
      },
      { type: "strong", props: { class: "score" }, children: [String(score)] },
      {
        type: "button",
        props: {
          type: "button",
          "data-action": `increase-${participant.id}`,
          "aria-label": `${participant.name} 점수 올리기`,
        },
        children: ["+"],
      },
    ],
  };
}

// 자식 Component: 트랙 탭 하나를 그립니다. 고른 탭은 class와 aria-pressed로 표시합니다.
function createTrackTab({
  filter,
  isSelected,
}: {
  filter: TrackFilter;
  isSelected: boolean;
}): VNode {
  return {
    type: "button",
    props: {
      type: "button",
      class: isSelected ? "tab selected" : "tab",
      "data-action": `track-${filter}`,
      "aria-pressed": String(isSelected),
    },
    children: [filter === "all" ? "전체" : filter],
  };
}

// 자식 Component: 순위표의 한 줄을 그립니다. 이름을 가리면 이름 자리에 "익명"을 씁니다.
function createRankingRow({
  row,
  isAnonymous,
}: {
  row: RankingRow;
  isAnonymous: boolean;
}): VNode {
  return {
    type: "li",
    props: {},
    children: [
      {
        type: "span",
        props: { class: "name" },
        children: [isAnonymous ? "익명" : row.name],
      },
      { type: "span", props: { class: "track" }, children: [row.track] },
      {
        type: "strong",
        props: { class: "score" },
        children: [String(row.score)],
      },
    ],
  };
}

const RankingRootComponent: RootComponent = ({ on }): VNode => {
  const [scores, setScores] = useState(initialScores);
  const [track, setTrack] = useState<TrackFilter>("all");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const ranking = useMemo(() => createRanking(scores, track), [scores, track]);
  const first = ranking[0];
  // container 밖의 알림 줄은 View에 없으므로, DOM 반영 뒤에 effect로 맞춥니다.
  useEffect(() => {
    const notice = document.querySelector("#ranking-notice");
    if (notice !== null) {
      notice.textContent = `알림: 지금 1위는 ${first?.name ?? "없음"}`;
    }
  }, [first?.id]);

  for (const participant of participants) {
    on(`increase-${participant.id}`, () =>
      setScores((current) =>
        createScoresWithChange(current, participant.id, 1),
      ),
    );
    on(`decrease-${participant.id}`, () =>
      setScores((current) =>
        createScoresWithChange(current, participant.id, -1),
      ),
    );
  }
  for (const filter of trackFilters) {
    on(`track-${filter}`, () => setTrack(filter));
  }
  on("toggle-anonymous", () => setIsAnonymous(!isAnonymous));

  return {
    type: "div",
    props: { class: "reader" },
    children: [
      {
        type: "section",
        props: { class: "evaluation" },
        children: [
          { type: "h3", props: {}, children: ["동료 평가"] },
          {
            type: "ul",
            props: {},
            children: participants.map((participant) =>
              createEvaluationRow({
                participant,
                score: getScore(scores, participant.id),
              }),
            ),
          },
        ],
      },
      {
        type: "section",
        props: { class: "ranking" },
        children: [
          { type: "h3", props: {}, children: ["순위"] },
          {
            type: "p",
            props: { class: "tabs" },
            children: trackFilters.map((filter) =>
              createTrackTab({ filter, isSelected: filter === track }),
            ),
          },
          {
            type: "button",
            props: {
              type: "button",
              class: "toggle",
              "data-action": "toggle-anonymous",
              "aria-pressed": String(isAnonymous),
            },
            children: [isAnonymous ? "이름 보이기" : "이름 가리기"],
          },
          {
            type: "ol",
            props: {},
            children: ranking.map((row) =>
              createRankingRow({ row, isAnonymous }),
            ),
          },
        ],
      },
    ],
  };
};

export function startRankingPage(page: ParentNode): void {
  const container = page.querySelector("#ranking");
  if (container === null) {
    throw new Error("Ranking page has no #ranking");
  }
  const panel = page.querySelector("#hook-panel");
  if (panel === null) {
    throw new Error("Ranking page has no #hook-panel");
  }
  const instance = new FunctionComponent(RankingRootComponent);
  instance.mount(container);
  // 칸은 이름을 모르므로, Hook을 부른 순서대로 이름과 값을 글자로 바꾸는 법을 넘깁니다.
  startHookPanel({
    panel,
    container,
    instance,
    cells: [
      {
        label: "useState · scores",
        createText: (value) =>
          `[${participants.map((participant) => getScore(value as Scores, participant.id)).join(", ")}]`,
      },
      { label: "useState · track", createText: String },
      { label: "useState · isAnonymous", createText: String },
      {
        label: "useMemo · ranking",
        createText: (value) =>
          (value as RankingRow[]).map((row) => row.name).join(" › "),
      },
      {
        label: "useEffect · 1위 알림",
        createText: (deps) => `deps [${(deps as unknown[]).join(", ")}]`,
      },
    ],
  });
}
