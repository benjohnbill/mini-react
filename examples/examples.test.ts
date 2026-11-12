/// <reference types="vite/client" />
import { afterEach, expect, it, vi } from "vitest";
import compositionHtml from "./composition/index.html?raw";
import counterHtml from "./counter/index.html?raw";
import helloWorldHtml from "./hello-world/index.html?raw";
import historyHtml from "./history/index.html?raw";
import memoHtml from "./memo/index.html?raw";
import shoppingListHtml from "./shopping-list/index.html?raw";
import { startManualShoppingList } from "./shopping-list/vanilla-manual";
import themeHtml from "./theme/index.html?raw";

const exampleHtml = {
  "hello-world": helloWorldHtml,
  counter: counterHtml,
  theme: themeHtml,
  memo: memoHtml,
  composition: compositionHtml,
  history: historyHtml,
  "shopping-list": shoppingListHtml,
};

function startExample(name: keyof typeof exampleHtml): void {
  document.body.innerHTML = exampleHtml[name];
}

function clickButton(selector: string): void {
  const button = document.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) throw new Error(selector);
  button.click();
}

// 같은 예제를 여러 테스트에서 시작하려고, 모듈을 다시 불러 시작 코드를 다시 실행합니다.
async function startShoppingList(): Promise<void> {
  vi.resetModules();
  startExample("shopping-list");
  await import("./shopping-list/main");
}

function getMemoInput(panelSelector: string, index: number): HTMLInputElement {
  const input = document.querySelectorAll(`${panelSelector} input`)[index];
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`${panelSelector} input ${index}`);
  }
  return input;
}

function getButton(selector: string): HTMLButtonElement {
  const button = document.querySelector(selector);
  if (!(button instanceof HTMLButtonElement)) throw new Error(selector);
  return button;
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

it("E7 장보기 목록의 Vanilla 판은 항목 추가를 누르면 입력란과 버튼을 새로 만들어, 친 메모와 버튼의 포커스가 사라집니다", async () => {
  await startShoppingList();
  const memo = getMemoInput("#vanilla", 0);
  memo.value = "저지방";
  const addButton = getButton('#vanilla [data-action="add"]');
  addButton.focus();
  addButton.click();
  expect(document.querySelectorAll("#vanilla li")).toHaveLength(3);
  expect(getMemoInput("#vanilla", 0)).not.toBe(memo);
  expect(getMemoInput("#vanilla", 0).value).toBe("");
  expect(document.activeElement).toBe(document.body);
  await Promise.resolve();
  expect(document.querySelector("#vanilla-created")?.textContent).toBe(
    "방금 새로 만든 요소: 16개",
  );
  expect(document.querySelector("#vanilla-created-detail")?.textContent).toBe(
    "ul 1, li 3, span 3, button 4, input 3, p 2",
  );
});

it("E8 장보기 목록의 mini-react 판은 항목 추가를 눌러도 같은 입력란과 같은 버튼이라, 친 메모와 버튼의 포커스가 남습니다", async () => {
  await startShoppingList();
  const memo = getMemoInput("#mini-react", 0);
  memo.value = "저지방";
  const addButton = getButton('#mini-react [data-action="add"]');
  addButton.focus();
  addButton.click();
  expect(document.querySelectorAll("#mini-react li")).toHaveLength(3);
  expect(document.querySelector("#mini-react p")?.textContent).toBe(
    "합계: 6000원",
  );
  expect(getMemoInput("#mini-react", 0)).toBe(memo);
  expect(getMemoInput("#mini-react", 0).value).toBe("저지방");
  expect(document.activeElement).toBe(addButton);
  await Promise.resolve();
  expect(document.querySelector("#mini-react-created")?.textContent).toBe(
    "방금 새로 만든 요소: 4개",
  );
  expect(
    document.querySelector("#mini-react-created-detail")?.textContent,
  ).toBe("li 1, span 1, button 1, input 1");
  expect(document.querySelector("#mini-react-patches")?.textContent).toBe(
    'INSERT [0, 2] <li>\nTEXT [1, 0] "합계: 6000원"',
  );
});

it("E9 한계 — 장보기 목록의 mini-react 판에서 첫 항목을 삭제하면, 친 메모가 지운 항목과 함께 사라지지 않고 첫 줄에 남습니다", async () => {
  await startShoppingList();
  const memo = getMemoInput("#mini-react", 0);
  memo.value = "저지방";
  clickButton('#mini-react [data-action="delete-0"]');
  expect(document.querySelectorAll("#mini-react li")).toHaveLength(1);
  expect(document.querySelector("#mini-react li span")?.textContent).toBe(
    "빵 - 3000원",
  );
  expect(getMemoInput("#mini-react", 0)).toBe(memo);
  expect(getMemoInput("#mini-react", 0).value).toBe("저지방");
  await Promise.resolve();
  expect(document.querySelector("#mini-react-created")?.textContent).toBe(
    "방금 새로 만든 요소: 0개",
  );
});

it("E10 장보기 목록에서 맨 아래 항목을 삭제하면, Vanilla 판은 남은 줄도 새로 만들어 친 메모가 사라지고 mini-react 판은 그 줄만 지워 친 메모가 남습니다", async () => {
  await startShoppingList();
  getMemoInput("#vanilla", 0).value = "저지방";
  const memo = getMemoInput("#mini-react", 0);
  memo.value = "저지방";
  clickButton('#vanilla [data-action="delete"][data-index="1"]');
  clickButton('#mini-react [data-action="delete-1"]');
  expect(document.querySelectorAll("#vanilla li")).toHaveLength(1);
  expect(getMemoInput("#vanilla", 0).value).toBe("");
  expect(document.querySelectorAll("#mini-react li")).toHaveLength(1);
  expect(getMemoInput("#mini-react", 0)).toBe(memo);
  expect(getMemoInput("#mini-react", 0).value).toBe("저지방");
  expect(document.querySelector("#mini-react-patches")?.textContent).toBe(
    'REMOVE [0, 1]\nTEXT [1, 0] "합계: 2000원"',
  );
  await Promise.resolve();
  expect(document.querySelector("#vanilla-created")?.textContent).toBe(
    "방금 새로 만든 요소: 8개",
  );
  expect(document.querySelector("#mini-react-created")?.textContent).toBe(
    "방금 새로 만든 요소: 0개",
  );
});

// 손으로 고치는 판은 예제 페이지에 없어서, 빈 container에 직접 시작합니다.
function startManualPanel(): void {
  document.body.innerHTML = '<div id="manual"></div>';
  const container = document.querySelector("#manual");
  if (container === null) throw new Error("#manual");
  startManualShoppingList(container);
}

it("E11 장보기 목록의 손으로 고치는 판은 항목 추가를 누르면 새 줄 하나만 붙이고 합계를 고쳐, 친 메모가 남습니다", () => {
  startManualPanel();
  const memo = getMemoInput("#manual", 0);
  memo.value = "저지방";
  const firstLine = document.querySelector("#manual li");
  clickButton('#manual [data-action="add"]');
  expect(document.querySelectorAll("#manual li")).toHaveLength(3);
  expect(document.querySelector("#manual li")).toBe(firstLine);
  expect(getMemoInput("#manual", 0)).toBe(memo);
  expect(getMemoInput("#manual", 0).value).toBe("저지방");
  expect(document.querySelector("#manual ul + p")?.textContent).toBe(
    "합계: 6000원",
  );
});

it("E12 장보기 목록의 손으로 고치는 판에서 첫 항목을 삭제하면 그 줄만 지워 빵에 친 메모가 빵 줄에 남고, 모두 지우면 빈 목록 문구가 나옵니다", () => {
  startManualPanel();
  const breadMemo = getMemoInput("#manual", 1);
  breadMemo.value = "통밀";
  clickButton('#manual li [data-action="delete"]');
  expect(document.querySelectorAll("#manual li")).toHaveLength(1);
  expect(document.querySelector("#manual li span")?.textContent).toBe(
    "빵 - 3000원",
  );
  expect(getMemoInput("#manual", 0)).toBe(breadMemo);
  expect(getMemoInput("#manual", 0).value).toBe("통밀");
  expect(document.querySelector("#manual ul + p")?.textContent).toBe(
    "합계: 3000원",
  );
  clickButton('#manual li [data-action="delete"]');
  expect(document.querySelectorAll("#manual li")).toHaveLength(0);
  expect(document.querySelector("#manual ul + p")?.textContent).toBe(
    "합계: 0원",
  );
  expect(document.querySelector("#manual ul + p + p")?.textContent).toBe(
    "목록이 비었어요",
  );
});
