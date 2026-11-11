/// <reference types="vite/client" />
import { afterEach, expect, it } from "vitest";
import compositionHtml from "./composition/index.html?raw";
import counterHtml from "./counter/index.html?raw";
import helloWorldHtml from "./hello-world/index.html?raw";
import historyHtml from "./history/index.html?raw";
import memoHtml from "./memo/index.html?raw";
import themeHtml from "./theme/index.html?raw";

const exampleHtml = {
  "hello-world": helloWorldHtml,
  counter: counterHtml,
  theme: themeHtml,
  memo: memoHtml,
  composition: compositionHtml,
  history: historyHtml,
};

function startExample(name: keyof typeof exampleHtml): void {
  document.body.innerHTML = exampleHtml[name];
}

function clickButton(selector: string): void {
  const button = document.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) throw new Error(selector);
  button.click();
}

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty("color-scheme");
});

it("E1 Hello World를 그립니다", async () => {
  startExample("hello-world");
  await import("./hello-world/main");
  expect(document.querySelector("#app")?.textContent).toBe("Hello World");
});

it("E2 카운터를 증가·감소·초기화합니다", async () => {
  startExample("counter");
  await import("./counter/main");
  clickButton('[data-action="increment"]');
  clickButton('[data-action="increment"]');
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    "숫자: 2",
  );
  clickButton('[data-action="decrement"]');
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    "숫자: 1",
  );
  clickButton('[data-action="reset"]');
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    "숫자: 0",
  );
});

it("E3 effect가 테마를 바꿉니다", async () => {
  startExample("theme");
  await import("./theme/main");
  expect(document.documentElement.style.colorScheme).toBe("light");
  clickButton('[data-action="toggle"]');
  expect(document.documentElement.style.colorScheme).toBe("dark");
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    "현재 테마: 어두움",
  );
  clickButton('[data-action="toggle"]');
  expect(document.documentElement.style.colorScheme).toBe("light");
});

it("E4 별도 State 변경은 계산을 재실행하지 않습니다", async () => {
  startExample("memo");
  await import("./memo/main");
  clickButton('[data-action="count"]');
  expect(document.querySelector("#unrelated")?.textContent).toBe(
    "별도 카운터: 1",
  );
  expect(document.querySelector("#computations")?.textContent).toBe(
    "계산 실행: 1회",
  );
  clickButton('[data-action="number"]');
  expect(document.querySelector('[role="status"]')?.textContent).toBe(
    "4 × 4 = 16",
  );
  expect(document.querySelector("#computations")?.textContent).toBe(
    "계산 실행: 2회",
  );
});

it("E5 Root Instance의 State는 독립적입니다", async () => {
  startExample("composition");
  await import("./composition/main");
  clickButton("#first button");
  clickButton("#first button");
  clickButton("#second button");
  expect(document.querySelector('#first [role="status"]')?.textContent).toBe(
    "숫자: 2",
  );
  expect(document.querySelector('#second [role="status"]')?.textContent).toBe(
    "숫자: 1",
  );
});

it("E6 화면 이력을 이동하고 뒤로 간 뒤 새 이력을 저장합니다", async () => {
  startExample("history");
  await import("./history/main");
  expect(document.querySelector("#back")).toHaveProperty("disabled", true);
  clickButton("#change");
  expect(document.querySelector("#view")?.textContent).toBe("변경한 화면 1");
  expect(
    JSON.parse(document.querySelector("#patches")?.textContent ?? ""),
  ).toEqual([{ type: "TEXT", path: [0], text: "변경한 화면 1" }]);
  clickButton("#back");
  expect(document.querySelector("#view")?.textContent).toBe("첫 화면");
  clickButton("#forward");
  expect(document.querySelector("#view")?.textContent).toBe("변경한 화면 1");
  clickButton("#back");
  clickButton("#change");
  expect(document.querySelector("#view")?.textContent).toBe("변경한 화면 2");
  expect(document.querySelector("#position")?.textContent).toBe("이력: 2 / 2");
  expect(document.querySelector("#forward")).toHaveProperty("disabled", true);
});
