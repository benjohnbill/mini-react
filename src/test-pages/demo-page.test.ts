import { beforeEach, describe, expect, it } from "vitest";
import { startDemoPage } from "./demo-page";

function findButton(label: string): HTMLButtonElement {
  const buttons = document.querySelectorAll("button");
  for (const button of buttons) {
    if (button.textContent === label) {
      return button;
    }
  }
  throw new Error(`"${label}" 버튼이 없습니다`);
}

function typeIntoInput(text: string): void {
  const input = document.querySelector("input");
  if (input === null) {
    throw new Error("input이 없습니다");
  }
  input.value = text;
  input.dispatchEvent(new Event("input"));
}

describe("startDemoPage", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    startDemoPage(document);
  });

  it("부모가 넘긴 이름대로 자식을 그린다", () => {
    const html = document.getElementById("app")?.innerHTML;

    expect(html).toContain("<p>안녕, 다빈</p>");
  });

  it("버튼을 누를 때마다 횟수와 짝수/홀수가 바뀐다", () => {
    findButton("+1").click();
    expect(document.body.innerHTML).toContain("눌린 횟수: 1 (홀수)");

    findButton("+1").click();
    expect(document.body.innerHTML).toContain("눌린 횟수: 2 (짝수)");
  });

  it("입력한 글자를 추가하면 목록에 나오고 입력칸이 비워진다", () => {
    typeIntoInput("우유 사기");
    findButton("추가").click();

    expect(document.querySelector("ul")?.innerHTML).toBe("<li>우유 사기</li>");
    expect(document.querySelector("input")?.value).toBe("");
    expect(document.body.innerHTML).toContain("총 1개");
  });

  it("비어 있으면 추가하지 않는다", () => {
    findButton("추가").click();

    expect(document.body.innerHTML).toContain("총 0개");
  });

  it("목록이 바뀌면 탭 제목도 바뀐다", () => {
    typeIntoInput("빨래");
    findButton("추가").click();

    expect(document.title).toBe("할 일 1개");
  });

  it("글자를 칠 때 입력칸 요소가 새로 만들어지지 않는다", () => {
    const input = document.querySelector("input");

    typeIntoInput("a");
    typeIntoInput("ab");

    expect(document.querySelector("input")).toBe(input);
  });
});
