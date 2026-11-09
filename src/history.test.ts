// M4 공통 테스트입니다. 동작의 근거는 ADR 0007입니다.
import { describe, expect, it } from "vitest";
import { StateHistory } from "./history";
import type { VNode } from "./vnode";

type ElementVNode = Exclude<VNode, string>;

function createView(label: string): ElementVNode {
  return {
    type: "div",
    props: { id: label },
    children: [
      {
        type: "p",
        props: { class: "text" },
        children: [{ type: "span", props: {}, children: [label] }],
      },
    ],
  };
}

function getElementVNode(view: VNode | null | undefined): ElementVNode {
  if (view === null || view === undefined || typeof view === "string") {
    throw new Error(`View is not an element: ${String(view)}`);
  }
  return view;
}

function changeViewDeeply(view: VNode | null): void {
  const element = getElementVNode(view);
  element.props.id = "changed";
  const paragraph = getElementVNode(element.children[0]);
  paragraph.props.class = "changed";
  const span = getElementVNode(paragraph.children[0]);
  span.children[0] = "changed";
  element.children.push("added");
}

function createHistoryWithViews(labels: string[]): StateHistory {
  const history = new StateHistory();
  for (const label of labels) {
    history.push(createView(label));
  }
  return history;
}

describe("StateHistory", () => {
  describe("초기와 현재 조회", () => {
    it("H1 새 이력은 현재 View가 없고 앞뒤로 갈 수 없습니다", () => {
      const history = new StateHistory();
      expect(history.current()).toBeNull();
      expect(history.canBack()).toBe(false);
      expect(history.canForward()).toBe(false);
      expect(history.size).toBe(0);
    });

    it("H2 View 하나를 저장하면 그 View가 현재가 됩니다", () => {
      const history = createHistoryWithViews(["A"]);
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.canBack()).toBe(false);
      expect(history.canForward()).toBe(false);
      expect(history.size).toBe(1);
    });

    it("H3 빈 이력에서 앞뒤로 여러 번 가도 null이고 이후 저장이 정상입니다", () => {
      const history = new StateHistory();
      for (let call = 0; call < 3; call += 1) {
        expect(history.back()).toBeNull();
        expect(history.forward()).toBeNull();
      }
      expect(history.current()).toBeNull();
      expect(history.size).toBe(0);
      expect(history.canBack()).toBe(false);
      expect(history.canForward()).toBe(false);

      history.push(createView("A"));
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.size).toBe(1);
      expect(history.canBack()).toBe(false);
      expect(history.canForward()).toBe(false);
    });
  });

  describe("이동과 경계", () => {
    it("H4 뒤로 가면 이전 View를 돌려주고 앞으로 갈 수 있게 됩니다", () => {
      const history = createHistoryWithViews(["A", "B"]);
      expect(history.back()).toStrictEqual(createView("A"));
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.canForward()).toBe(true);
      expect(history.canBack()).toBe(false);
    });

    it("H5 뒤로 갔다가 앞으로 가면 최신 View로 돌아옵니다", () => {
      const history = createHistoryWithViews(["A", "B"]);
      history.back();
      expect(history.forward()).toStrictEqual(createView("B"));
      expect(history.current()).toStrictEqual(createView("B"));
      expect(history.canForward()).toBe(false);
      expect(history.canBack()).toBe(true);
    });

    it("H6 첫 View에서 뒤로 가면 null이고 현재는 그대로입니다", () => {
      const history = createHistoryWithViews(["A"]);
      expect(history.back()).toBeNull();
      expect(history.current()).toStrictEqual(createView("A"));
    });

    it("H7 마지막 View에서 앞으로 가면 null이고 현재는 그대로입니다", () => {
      const history = createHistoryWithViews(["A", "B"]);
      expect(history.forward()).toBeNull();
      expect(history.current()).toStrictEqual(createView("B"));
    });

    it("H8 View 하나에서 앞뒤로 여러 번 가도 현재와 개수가 그대로입니다", () => {
      const history = createHistoryWithViews(["A"]);
      for (let call = 0; call < 3; call += 1) {
        expect(history.back()).toBeNull();
      }
      for (let call = 0; call < 3; call += 1) {
        expect(history.forward()).toBeNull();
      }
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.size).toBe(1);
    });

    it("H9 경계에서 여러 번 더 가도 반대 방향 이동은 한 칸씩 정상입니다", () => {
      const history = createHistoryWithViews(["A", "B", "C"]);
      history.back();
      history.back();
      for (let call = 0; call < 3; call += 1) {
        expect(history.back()).toBeNull();
      }
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.forward()).toStrictEqual(createView("B"));

      history.forward();
      for (let call = 0; call < 3; call += 1) {
        expect(history.forward()).toBeNull();
      }
      expect(history.current()).toStrictEqual(createView("C"));
      expect(history.back()).toStrictEqual(createView("B"));
      expect(history.size).toBe(3);
    });

    it("H10 여러 번 저장하고 이동해도 돌려준 View와 현재와 개수가 맞습니다", () => {
      const history = new StateHistory();
      for (const label of ["A", "B", "C"]) {
        history.push(createView(label));
        expect(history.current()).toStrictEqual(createView(label));
      }

      expect(history.back()).toStrictEqual(createView("B"));
      expect(history.current()).toStrictEqual(createView("B"));
      expect(history.canBack()).toBe(true);
      expect(history.canForward()).toBe(true);

      expect(history.back()).toStrictEqual(createView("A"));
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.canBack()).toBe(false);
      expect(history.canForward()).toBe(true);

      expect(history.forward()).toStrictEqual(createView("B"));
      expect(history.current()).toStrictEqual(createView("B"));
      expect(history.canBack()).toBe(true);
      expect(history.canForward()).toBe(true);

      expect(history.forward()).toStrictEqual(createView("C"));
      expect(history.current()).toStrictEqual(createView("C"));
      expect(history.canBack()).toBe(true);
      expect(history.canForward()).toBe(false);
      expect(history.size).toBe(3);
    });
  });

  describe("새 저장과 분기", () => {
    it("H11 뒤로 간 뒤 저장하면 앞쪽 View를 지웁니다", () => {
      const history = createHistoryWithViews(["A", "B", "C"]);
      history.back();
      history.back();
      history.push(createView("D"));
      expect(history.current()).toStrictEqual(createView("D"));
      expect(history.size).toBe(2);
      expect(history.canForward()).toBe(false);
      expect(history.canBack()).toBe(true);
    });

    it("H12 분기한 뒤에는 이전 View와 새 View 사이만 오갑니다", () => {
      const history = createHistoryWithViews(["A", "B", "C"]);
      history.back();
      history.back();
      history.push(createView("D"));

      expect(history.forward()).toBeNull();
      expect(history.back()).toStrictEqual(createView("A"));
      expect(history.back()).toBeNull();
      expect(history.forward()).toStrictEqual(createView("D"));
      expect(history.forward()).toBeNull();
      expect(history.size).toBe(2);
    });

    it("H13 현재와 내용이 같은 View도 저장합니다", () => {
      const history = new StateHistory();
      const view = createView("A");
      history.push(view);
      history.push(view);
      expect(history.size).toBe(2);
      history.push(createView("A"));
      expect(history.size).toBe(3);
      expect(history.current()).toStrictEqual(createView("A"));
      expect(history.canBack()).toBe(true);
    });

    it("H14 뒤로 간 뒤 같은 내용을 저장해도 앞쪽 View를 지웁니다", () => {
      const history = createHistoryWithViews(["A", "B"]);
      history.back();
      history.push(createView("A"));
      expect(history.size).toBe(2);
      expect(history.canForward()).toBe(false);
      expect(history.back()).toStrictEqual(createView("A"));
    });
  });

  describe("저장된 View의 격리", () => {
    it("H15 저장한 뒤 원본 View를 고쳐도 저장된 View는 그대로입니다", () => {
      const history = new StateHistory();
      const viewA = createView("A");
      const viewB = createView("B");
      history.push(viewA);
      history.push(viewB);

      changeViewDeeply(viewA);
      changeViewDeeply(viewB);

      expect(history.current()).toStrictEqual(createView("B"));
      expect(history.back()).toStrictEqual(createView("A"));
    });

    it("H16 current로 받은 View를 고쳐도 저장된 View는 그대로입니다", () => {
      const history = createHistoryWithViews(["A"]);
      changeViewDeeply(history.current());
      expect(history.current()).toStrictEqual(createView("A"));
    });

    it("H17 back과 forward로 받은 View를 고쳐도 다시 가면 저장된 View 그대로입니다", () => {
      const history = createHistoryWithViews(["A", "B"]);
      changeViewDeeply(history.back());
      expect(history.current()).toStrictEqual(createView("A"));

      changeViewDeeply(history.forward());
      expect(history.current()).toStrictEqual(createView("B"));

      expect(history.back()).toStrictEqual(createView("A"));
      expect(history.forward()).toStrictEqual(createView("B"));
    });
  });

  describe("선택: 용량 제한", () => {
    it.todo("H18 선택 사항: 용량 제한은 구현하지 않음 (Lark 69행 선택)");
  });
});
