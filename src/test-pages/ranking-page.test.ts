/// <reference types="vite/client" />
// 순위 페이지와 Hook 패널을 jsdom에서 확인합니다. 실제 브라우저 확인은 따로 합니다.
// 페이지는 index.html과 같은 마크업에서 시작 함수로 시작하고, 버튼은 click 이벤트로 누릅니다.
import { beforeEach, describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import { startRankingPage } from "./ranking-page";

const indexBodyHtml = new DOMParser().parseFromString(indexHtml, "text/html")
  .body.innerHTML;

function getPageElement(selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Page has no ${selector}`);
  }
  return element;
}

function clickAction(actionName: string): void {
  getPageElement(`#ranking [data-action="${actionName}"]`).click();
}

function readRankingNames(): string[] {
  return [...document.querySelectorAll("#ranking ol .name")].map(
    (name) => name.textContent ?? "",
  );
}

function readRankingScores(): string[] {
  return [...document.querySelectorAll("#ranking ol .score")].map(
    (score) => score.textContent ?? "",
  );
}

function readCellResult(cellIndex: number): string | undefined {
  return getPageElement(`#hook-panel [data-cell="${cellIndex}"]`).dataset
    .result;
}

function readRanStages(): string[] {
  return [...document.querySelectorAll('#hook-panel [data-ran="true"]')].map(
    (stage) => stage.textContent ?? "",
  );
}

function readPatchTexts(): string[] {
  return [...document.querySelectorAll("#hook-panel-patches li")].map(
    (patch) => patch.textContent ?? "",
  );
}

describe("순위 페이지", () => {
  beforeEach(() => {
    // innerHTML로 넣은 script는 실행되지 않으므로, main.ts가 함께 돌지 않습니다.
    document.body.innerHTML = indexBodyHtml;
  });

  it("K1 시작하면 여섯 명이 점수 순서로 보이고, 점수가 같으면 id가 앞선 사람이 위다", () => {
    startRankingPage(document);

    expect(readRankingNames()).toEqual([
      "이도윤",
      "박서연",
      "김하늘",
      "정지우",
      "최민준",
      "강서준",
    ]);
    expect(readRankingScores()).toEqual(["4", "4", "3", "3", "2", "1"]);
  });

  it("K2 시작하면 effect가 container 밖의 알림 줄에 1위를 쓴다", () => {
    startRankingPage(document);

    expect(getPageElement("#ranking-notice").textContent).toBe(
      "알림: 지금 1위는 이도윤",
    );
  });

  it("K3 순서가 그대로인 점수 클릭은 useMemo를 다시 계산하고 effect를 건너뛰며, Patch는 TEXT 둘이다", () => {
    startRankingPage(document);

    clickAction("increase-p06");

    expect(readRankingScores()).toEqual(["4", "4", "3", "3", "2", "2"]);
    expect(readCellResult(0)).toBe("changed");
    expect(readCellResult(3)).toBe("recomputed");
    expect(readCellResult(4)).toBe("skipped");
    expect(readRanStages()).toEqual([
      "click",
      "setter",
      "instance",
      "render",
      "diff",
      "patch",
    ]);
    expect(readPatchTexts()).toEqual([
      'TEXT [0, 1, 5, 3, 0] "2"',
      'TEXT [1, 3, 5, 2, 0] "2"',
    ]);
  });

  it("K4 1위가 바뀌는 점수 클릭은 effect까지 실행하고, 알림 줄이 새 1위를 쓴다", () => {
    startRankingPage(document);

    clickAction("increase-p03");

    expect(readRankingNames().slice(0, 2)).toEqual(["박서연", "이도윤"]);
    expect(readCellResult(3)).toBe("recomputed");
    expect(readCellResult(4)).toBe("ran");
    expect(readRanStages()).toEqual([
      "click",
      "setter",
      "instance",
      "render",
      "diff",
      "patch",
      "effect",
    ]);
    expect(getPageElement("#ranking-notice").textContent).toBe(
      "알림: 지금 1위는 박서연",
    );
  });

  it("K5 key가 없어 순서가 바뀐 두 줄은 옮기지 않고 글자를 TEXT로 고친다", () => {
    startRankingPage(document);
    const firstRow = getPageElement("#ranking ol li");

    clickAction("increase-p03");

    expect(getPageElement("#ranking ol li")).toBe(firstRow);
    expect(readPatchTexts()).toEqual([
      'TEXT [0, 1, 2, 3, 0] "5"',
      'TEXT [1, 3, 0, 0, 0] "박서연"',
      'TEXT [1, 3, 0, 1, 0] "infra"',
      'TEXT [1, 3, 0, 2, 0] "5"',
      'TEXT [1, 3, 1, 0, 0] "이도윤"',
      'TEXT [1, 3, 1, 1, 0] "backend"',
    ]);
  });

  it("K6 이름 가리기는 다시 렌더링하지만 useMemo와 effect를 건너뛴다", () => {
    startRankingPage(document);

    clickAction("toggle-anonymous");

    expect(readRankingNames()).toEqual([
      "익명",
      "익명",
      "익명",
      "익명",
      "익명",
      "익명",
    ]);
    expect(readCellResult(2)).toBe("changed");
    expect(readCellResult(3)).toBe("skipped");
    expect(readCellResult(4)).toBe("skipped");
    expect(readRanStages()).toEqual([
      "click",
      "setter",
      "instance",
      "render",
      "diff",
      "patch",
    ]);
    expect(readPatchTexts()).toEqual([
      "PROPS [1, 2] aria-pressed",
      'TEXT [1, 2, 0] "이름 보이기"',
      'TEXT [1, 3, 0, 0, 0] "익명"',
      'TEXT [1, 3, 1, 0, 0] "익명"',
      'TEXT [1, 3, 2, 0, 0] "익명"',
      'TEXT [1, 3, 3, 0, 0] "익명"',
      'TEXT [1, 3, 4, 0, 0] "익명"',
      'TEXT [1, 3, 5, 0, 0] "익명"',
    ]);
  });

  it("K7 트랙 탭은 그 트랙의 사람만 남기고, 남는 줄은 REMOVE로 지운다", () => {
    startRankingPage(document);

    clickAction("track-backend");

    expect(readRankingNames()).toEqual(["이도윤", "강서준"]);
    expect(readCellResult(1)).toBe("changed");
    expect(readCellResult(3)).toBe("recomputed");
    expect(
      readPatchTexts().filter((patch) => patch.startsWith("REMOVE")),
    ).toEqual([
      "REMOVE [1, 3, 5]",
      "REMOVE [1, 3, 4]",
      "REMOVE [1, 3, 3]",
      "REMOVE [1, 3, 2]",
    ]);
  });

  it("K8 최고 점수에서 올리기를 누르면 setter가 같은 값으로 판정해 update()를 부르지 않는다", () => {
    startRankingPage(document);
    clickAction("increase-p02");

    clickAction("increase-p02");

    expect(readRankingScores()[0]).toBe("5");
    expect(readCellResult(0)).toBe("same");
    expect(readRanStages()).toEqual(["click", "setter"]);
    expect(readPatchTexts()).toEqual([]);
  });

  it("K9 data-action이 없는 곳을 클릭하면 Hook 패널은 직전 클릭의 결과를 그대로 둔다", () => {
    startRankingPage(document);
    clickAction("increase-p06");

    getPageElement("#ranking h3").click();

    expect(readCellResult(0)).toBe("changed");
    expect(readPatchTexts()).toHaveLength(2);
  });
});
