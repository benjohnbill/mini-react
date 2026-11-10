/// <reference types="vite/client" />
// 카운터 데모 페이지(#30 표 104~113행, seam B)를 jsdom에서 확인합니다. 실제 브라우저 확인은 따로 합니다.
// 페이지는 index.html과 같은 마크업에서 시작 함수로 시작하고, 버튼은 click 이벤트로 누릅니다.
// F111은 검증 페이지의 기존 테스트 파일 전체가 같은 index.html로 통과하는 것으로 확인하고, 여기서는 그 흐름의 대표 하나를 둡니다.
import { beforeEach, describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import { startDemoPage } from "./demo-page";
import { startVerificationPage } from "./verification-page";

const indexBodyHtml = new DOMParser().parseFromString(indexHtml, "text/html")
  .body.innerHTML;

function getPageElement<T extends Element>(
  selector: string,
  elementType: new () => T,
): T {
  const element = document.querySelector(selector);
  if (!(element instanceof elementType)) {
    throw new Error(`Page has no ${selector}`);
  }
  return element;
}

function getShownCount(): number {
  const text = getPageElement("#demo-count", HTMLElement).textContent;
  if (text === null || !/^\d+$/.test(text)) {
    throw new Error(`#demo-count shows no number: ${text}`);
  }
  return Number(text);
}

function clickDemoButton(): void {
  getPageElement("#demo button", HTMLButtonElement).click();
}

describe("카운터 데모 페이지", () => {
  beforeEach(() => {
    // innerHTML로 넣은 script는 실행되지 않으므로, main.ts가 함께 돌지 않습니다.
    document.body.innerHTML = indexBodyHtml;
  });

  it("F104 index.html 마크업에서 시작하면 데모 섹션에 숫자가 보인다", () => {
    startDemoPage(document);

    expect(getPageElement("#demo-count", HTMLElement).textContent).toMatch(
      /^\d+$/,
    );
  });

  // 근거: demo-page-is-one-counter
  it("F104a 처음 숫자는 0이다", () => {
    startDemoPage(document);

    expect(getShownCount()).toBe(0);
  });

  it("F114 짝수/홀수 표시는 처음에 짝수이고 클릭하면 홀수가 된다", () => {
    startDemoPage(document);
    const readParity = () =>
      getPageElement("#demo-parity", HTMLElement).textContent;
    expect(readParity()).toBe("짝수");

    clickDemoButton();

    expect(readParity()).toBe("홀수");
  });

  it("F115 문서 제목은 숫자를 따라 바뀐다", () => {
    startDemoPage(document);
    expect(document.title).toBe("숫자 0");

    clickDemoButton();

    expect(document.title).toBe("숫자 1");
  });

  it("F105 늘리기 버튼을 한 번 클릭하면 숫자가 1 늘어난다", () => {
    startDemoPage(document);
    const countBefore = getShownCount();

    clickDemoButton();

    expect(getPageElement("#demo-count", HTMLElement).textContent).toBe(
      String(countBefore + 1),
    );
  });

  it("F106 늘리기 버튼을 세 번 클릭하면 숫자가 3 늘어난다", () => {
    startDemoPage(document);
    const countBefore = getShownCount();

    clickDemoButton();
    clickDemoButton();
    clickDemoButton();

    expect(getPageElement("#demo-count", HTMLElement).textContent).toBe(
      String(countBefore + 3),
    );
  });

  it("F107 버튼 안쪽 요소를 클릭해도 숫자가 늘어난다", () => {
    startDemoPage(document);
    const countBefore = getShownCount();

    getPageElement("#demo button span", HTMLElement).click();

    expect(getShownCount()).toBe(countBefore + 1);
  });

  it("F108 데모를 시작한 뒤 검증 페이지에서 Patch해도 데모의 숫자는 그대로다", () => {
    startVerificationPage(document);
    startDemoPage(document);
    clickDemoButton();
    const countBefore = getShownCount();
    const test = getPageElement("#test", HTMLTextAreaElement);

    test.value = test.value.replace("<li>운동</li>", "<li>산책</li>");
    getPageElement("#patch", HTMLButtonElement).click();

    expect(getPageElement("#real", HTMLElement).textContent).toContain("산책");
    expect(getShownCount()).toBe(countBefore);
  });

  it("F109 두 번 Patch한 뒤 뒤로 간 상태에서 데모 버튼을 클릭해도 실제 영역, 테스트 영역, 이력 버튼은 그대로다", () => {
    startVerificationPage(document);
    startDemoPage(document);
    const real = getPageElement("#real", HTMLElement);
    const test = getPageElement("#test", HTMLTextAreaElement);
    const back = getPageElement("#back", HTMLButtonElement);
    const forward = getPageElement("#forward", HTMLButtonElement);
    test.value = test.value.replace("<li>운동</li>", "<li>산책</li>");
    getPageElement("#patch", HTMLButtonElement).click();
    test.value = test.value.replace("<li>산책</li>", "<li>수영</li>");
    getPageElement("#patch", HTMLButtonElement).click();
    back.click();
    expect(back.disabled).toBe(false);
    expect(forward.disabled).toBe(false);
    const realHtmlBefore = real.innerHTML;
    const testValueBefore = test.value;

    clickDemoButton();

    expect(real.innerHTML).toBe(realHtmlBefore);
    expect(test.value).toBe(testValueBefore);
    expect(back.disabled).toBe(false);
    expect(forward.disabled).toBe(false);
  });

  it("F110 검증 페이지의 실제 영역 안쪽 요소를 클릭해도 데모의 숫자는 그대로이고, 데모 버튼을 클릭해도 실제 영역은 그대로다", () => {
    startVerificationPage(document);
    startDemoPage(document);
    const real = getPageElement("#real", HTMLElement);
    const countBefore = getShownCount();
    const realHtmlBefore = real.innerHTML;

    getPageElement("#real li", HTMLElement).click();
    expect(getShownCount()).toBe(countBefore);
    clickDemoButton();

    expect(getShownCount()).toBe(countBefore + 1);
    expect(real.innerHTML).toBe(realHtmlBefore);
  });

  it("F111 데모 섹션을 더한 index.html에서도 검증 페이지가 Patch와 뒤로가기로 동작한다", () => {
    startVerificationPage(document);
    const test = getPageElement("#test", HTMLTextAreaElement);

    test.value = test.value.replace("<li>운동</li>", "<li>산책</li>");
    getPageElement("#patch", HTMLButtonElement).click();
    expect(getPageElement("#real", HTMLElement).textContent).toContain("산책");
    getPageElement("#back", HTMLButtonElement).click();

    expect(getPageElement("#real", HTMLElement).textContent).toContain("운동");
    expect(getPageElement("#back", HTMLButtonElement).disabled).toBe(true);
  });

  it("F112 index.html의 데모 컨테이너에 공백이 있어도 시작 뒤 자식은 View 하나이고 클릭하면 숫자가 맞게 바뀐다", () => {
    const demo = getPageElement("#demo", HTMLElement);
    expect(demo.textContent).toMatch(/^\s+$/);

    startDemoPage(document);
    const countBefore = getShownCount();
    clickDemoButton();

    expect(demo.childNodes).toHaveLength(1);
    expect(getShownCount()).toBe(countBefore + 1);
  });

  it("F113 두 시작 함수를 같은 문서에 차례로 불러도 두 페이지가 모두 시작된다", () => {
    startVerificationPage(document);
    startDemoPage(document);

    expect(getPageElement("#test", HTMLTextAreaElement).value).toContain(
      "<h3>할 일</h3>",
    );
    expect(getShownCount()).toBeGreaterThanOrEqual(0);
  });

  it.todo(
    "F113a 근거 없음: jsdom에서 main.ts를 직접 불러오는 테스트는 두지 않습니다 (제안: 위의 두 시작 함수 테스트로 대신함)",
  );
});
