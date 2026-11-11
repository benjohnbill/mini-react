import { describe, expect, it } from "vitest";
import {
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from "./function-component";
import { createVNode, type VNode } from "./vnode";

function createContainer(): Element {
  document.body.innerHTML = "";
  return document.body.appendChild(document.createElement("div"));
}

describe("useState", () => {
  it("값을 바꾸면 화면이 바뀌고, 요소는 새로 만들어지지 않는다", () => {
    let setCount: (newValue: number) => void = () => {};
    function Counter(): VNode {
      const [count, setter] = useState(0);
      setCount = setter;
      return createVNode("p", {}, `count: ${count}`);
    }
    const container = createContainer();
    new FunctionComponent(Counter).mount(container);
    const paragraph = container.firstElementChild;

    setCount(1);

    expect(container.innerHTML).toBe("<p>count: 1</p>");
    expect(container.firstElementChild).toBe(paragraph);
  });

  it("같은 값으로 바꾸면 다시 그리지 않는다", () => {
    let renderCount = 0;
    let setCount: (newValue: number) => void = () => {};
    function Counter(): VNode {
      const [count, setter] = useState(0);
      setCount = setter;
      renderCount += 1;
      return createVNode("p", {}, `count: ${count}`);
    }
    new FunctionComponent(Counter).mount(createContainer());

    setCount(0);

    expect(renderCount).toBe(1);
  });

  it("컴포넌트 함수 밖에서 부르면 에러를 던진다", () => {
    expect(() => useState(0)).toThrow();
  });
});

describe("useEffect", () => {
  it("deps가 바뀔 때만 실행하고, 실행 전에 지난번 정리 함수를 부른다", () => {
    const log: string[] = [];
    let setCount: (newValue: number) => void = () => {};
    function Counter(): VNode {
      const [count, setter] = useState(0);
      setCount = setter;
      useEffect(() => {
        log.push(`run ${count}`);
        return () => log.push(`cleanup ${count}`);
      }, [count]);
      return createVNode("p", {}, `count: ${count}`);
    }
    new FunctionComponent(Counter).mount(createContainer());

    setCount(1);

    expect(log).toEqual(["run 0", "cleanup 0", "run 1"]);
  });

  it("deps가 []이면 처음 한 번만 실행한다", () => {
    let runCount = 0;
    let setCount: (newValue: number) => void = () => {};
    function Counter(): VNode {
      const [count, setter] = useState(0);
      setCount = setter;
      useEffect(() => {
        runCount += 1;
      }, []);
      return createVNode("p", {}, `count: ${count}`);
    }
    new FunctionComponent(Counter).mount(createContainer());

    setCount(1);
    setCount(2);

    expect(runCount).toBe(1);
  });

  it("effect가 실행될 때 화면은 이미 그려져 있다", () => {
    let seen = "";
    const container = createContainer();
    function App(): VNode {
      useEffect(() => {
        seen = container.innerHTML;
      }, []);
      return createVNode("p", {}, "hi");
    }

    new FunctionComponent(App).mount(container);

    expect(seen).toBe("<p>hi</p>");
  });
});

describe("useMemo", () => {
  it("deps가 같으면 다시 계산하지 않는다", () => {
    let computeCount = 0;
    let setCount: (newValue: number) => void = () => {};
    function Counter(): VNode {
      const [count, setter] = useState(0);
      setCount = setter;
      const doubled = useMemo(() => {
        computeCount += 1;
        return count * 2;
      }, [Math.floor(count / 10)]);
      return createVNode("p", {}, `doubled: ${doubled}`);
    }
    new FunctionComponent(Counter).mount(createContainer());

    setCount(1); // deps는 [0] 그대로 -> 계산 안 함
    expect(computeCount).toBe(1);

    setCount(10); // deps가 [1]로 바뀜 -> 다시 계산
    expect(computeCount).toBe(2);
  });
});
