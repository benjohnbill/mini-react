// 테스트는 #30의 seam A로 확인합니다. 입구는 mount와 data-action 요소의 click이고, 출구는 컨테이너 DOM과 함수가 불린 횟수입니다.
// 예외: Hook 호출 위치(F15, F43~F45), mount 전 update()(F7), 첫 렌더링에서 잡아 둔 오래된 setter(F26, F38, F40), 다른 Root Instance에서 부르는 setter(F14a), 렌더링 밖의 on(F64), Error 뒤의 update()와 잡아 둔 setter(F117, F118, F119~F121, F125~F127, F129, F130, F140, F142)는 그 호출 자체가 대상이므로 useState, setter, update()를 직접 부릅니다.
// 테스트 ID FN의 N은 #30 표의 행 번호입니다. 같은 행의 두 번째 테스트는 F104a처럼 소문자를 붙입니다.
import { describe, expect, it } from "vitest";
import {
  FunctionComponent,
  type RootComponent,
  type RootComponentProps,
  type StateSetter,
  useEffect,
  useMemo,
  useState,
} from "./function-component";
import type { VNode } from "./vnode";

const HOOK_OUTSIDE_RENDER_MESSAGE =
  "Hooks can only be called while Root Component renders";

function createContainer(html = ""): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

function clickButton(container: Element): void {
  const button = container.querySelector("button");
  if (button === null) {
    throw new Error("container has no button");
  }
  button.click();
}

function createIncrementButton(
  on: RootComponentProps["on"],
  count: number,
  setCount: (nextCount: number) => void,
  props: Record<string, string> = {},
): VNode {
  on("inc", () => setCount(count + 1));
  return {
    type: "button",
    props: { "data-action": "inc", ...props },
    children: [String(count)],
  };
}

// 0에서 시작해 클릭할 때마다 1씩 늘리는 버튼 하나를 그립니다.
function createCounterRootComponent(): RootComponent {
  return ({ on }) => {
    const [count, setCount] = useState(0);
    return createIncrementButton(on, count, setCount);
  };
}

describe("FunctionComponent mount", () => {
  it("F1 Root Component의 View를 컨테이너에 그리고 Root Component는 한 번만 부른다", () => {
    const container = createContainer();
    let renderCount = 0;
    const rootComponent = (): VNode => {
      renderCount++;
      return { type: "p", props: {}, children: ["hi"] };
    };

    new FunctionComponent(rootComponent).mount(container);

    expect(container.innerHTML).toBe("<p>hi</p>");
    expect(renderCount).toBe(1);
  });

  it("F2 자식이 이미 있는 컨테이너에 mount하면 새 View의 DOM만 남는다", () => {
    const container = createContainer("<span>old</span>");

    new FunctionComponent(createCounterRootComponent()).mount(container);

    expect(container.childNodes).toHaveLength(1);
    expect(container.innerHTML).toBe('<button data-action="inc">0</button>');
  });

  it("F3 공백 글자만 든 컨테이너에 mount한 뒤 클릭해도 DOM이 새 View와 같다", () => {
    const container = createContainer("\n  ");
    new FunctionComponent(createCounterRootComponent()).mount(container);

    clickButton(container);

    expect(container.innerHTML).toBe('<button data-action="inc">1</button>');
  });

  it("F4 문자열 View를 mount하면 글자 노드 하나가 된다", () => {
    const container = createContainer();

    new FunctionComponent(() => "hello").mount(container);

    expect(container.textContent).toBe("hello");
    expect(container.childNodes).toHaveLength(1);
    expect(container.firstChild).toBeInstanceOf(Text);
  });

  it("F5 View의 글자에 든 HTML은 해석하지 않고 글자 그대로 보인다", () => {
    const container = createContainer();
    const text = "<img src=x onerror=alert(1)>";

    new FunctionComponent(() => ({
      type: "p",
      props: {},
      children: [text],
    })).mount(container);

    expect(container.textContent).toBe(text);
    expect(container.querySelector("img")).toBeNull();
  });

  it("F6 같은 인스턴스에 mount를 두 번 부르면 Error를 던지고 클릭은 한 번만 처리된다", () => {
    const container = createContainer();
    const component = new FunctionComponent(createCounterRootComponent());
    component.mount(container);

    expect(() => component.mount(container)).toThrow(
      "mount() can be called only once",
    );
    clickButton(container);
    expect(readButtonText(container)).toBe("1");
  });
});

describe("FunctionComponent update", () => {
  it("F8 클릭으로 상태를 바꾸면 버튼 글자가 1이 되고 Root Component는 모두 두 번 불린다", () => {
    const container = createContainer();
    let renderCount = 0;
    const rootComponent: RootComponent = ({ on }) => {
      renderCount++;
      const [count, setCount] = useState(0);
      return createIncrementButton(on, count, setCount);
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(container.querySelector("button")?.textContent).toBe("1");
    expect(renderCount).toBe(2);
  });

  it("F9 바뀐 글자만 반영하고 버튼 요소와 글자 노드는 같은 객체로 남는다", () => {
    const container = createContainer();
    new FunctionComponent(createCounterRootComponent()).mount(container);
    const button = container.querySelector("button");
    const textNode = button?.firstChild;

    clickButton(container);

    expect(container.querySelector("button")).toBe(button);
    expect(button?.firstChild).toBe(textNode);
    expect((textNode as Text).data).toBe("1");
  });

  it("F10 매번 직전 화면과 비교하므로, 처음 화면과 같은 글자로 돌아와도 DOM이 그 글자로 바뀌고 버튼은 같은 요소다", () => {
    const container = createContainer();
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCount] = useState(0);
      on("inc", () => setCount(count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [count % 2 === 0 ? "even" : "odd"],
      };
    };
    new FunctionComponent(rootComponent).mount(container);
    const button = container.querySelector("button");

    clickButton(container);
    expect(button?.textContent).toBe("odd");
    clickButton(container);

    expect(button?.textContent).toBe("even");
    expect(container.querySelector("button")).toBe(button);
  });

  it("F11 최상위 요소의 종류가 바뀐 뒤에도 클릭 함수가 불린다", () => {
    const container = createContainer();
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCount] = useState(0);
      return {
        type: count % 2 === 0 ? "div" : "section",
        props: {},
        children: [createIncrementButton(on, count, setCount)],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);
    expect(container.children[0]?.tagName).toBe("SECTION");
    clickButton(container);

    expect(container.children).toHaveLength(1);
    expect(container.children[0]?.tagName).toBe("DIV");
  });

  it("F12 목록 항목이 3개에서 1개, 4개로 바뀌면 li가 View와 같다", () => {
    const container = createContainer();
    const itemTexts = [["a", "b", "c"], ["a"], ["a", "b", "c", "d"]];
    const rootComponent: RootComponent = ({ on }) => {
      const [step, setStep] = useState(0);
      return {
        type: "div",
        props: {},
        children: [
          createIncrementButton(on, step, setStep),
          {
            type: "ul",
            props: {},
            children: (itemTexts[step] ?? []).map(
              (text): VNode => ({ type: "li", props: {}, children: [text] }),
            ),
          },
        ],
      };
    };
    const readItemTexts = () =>
      [...container.querySelectorAll("li")].map((li) => li.textContent);
    new FunctionComponent(rootComponent).mount(container);
    const firstItem = container.querySelector("li");
    expect(readItemTexts()).toEqual(["a", "b", "c"]);

    clickButton(container);
    expect(readItemTexts()).toEqual(["a"]);
    clickButton(container);

    expect(container.querySelector("ul")?.innerHTML).toBe(
      "<li>a</li><li>b</li><li>c</li><li>d</li>",
    );
    expect(container.querySelector("li")).toBe(firstItem);
  });

  it("F13 class 속성이 생기고 사라져도 버튼은 같은 요소 객체다", () => {
    const container = createContainer();
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCount] = useState(0);
      return createIncrementButton(
        on,
        count,
        setCount,
        count % 2 === 1 ? { class: "on" } : {},
      );
    };
    new FunctionComponent(rootComponent).mount(container);
    const button = container.querySelector("button");

    clickButton(container);
    expect(button?.getAttribute("class")).toBe("on");
    clickButton(container);

    expect(button?.hasAttribute("class")).toBe(false);
    expect(container.querySelector("button")).toBe(button);
  });

  it("F14 Root Instance 두 개를 mount하고 한쪽만 클릭하면 그쪽만 바뀐다", () => {
    const first = createContainer();
    const second = createContainer();
    new FunctionComponent(createCounterRootComponent()).mount(first);
    new FunctionComponent(createCounterRootComponent()).mount(second);

    clickButton(first);

    expect(readButtonText(first)).toBe("1");
    expect(readButtonText(second)).toBe("0");
    clickButton(second);
    expect(readButtonText(first)).toBe("1");
    expect(readButtonText(second)).toBe("1");
  });

  it("F14a 한 Root Instance의 setter를 다른 Root Instance의 클릭 함수에서 불러도, setter를 만든 쪽 화면만 다시 그려진다", () => {
    const first = createContainer();
    const second = createContainer();
    let setFirstCount: StateSetter<number> | undefined;
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      setFirstCount = setCount;
      return createIncrementButton(on, count, setCount);
    }).mount(first);
    let secondRenderCount = 0;
    new FunctionComponent(({ on }) => {
      secondRenderCount++;
      on("inc", () => setFirstCount?.((count) => count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: ["+"],
      };
    }).mount(second);

    clickButton(second);

    expect(readButtonText(first)).toBe("1");
    expect(readButtonText(second)).toBe("+");
    expect(secondRenderCount).toBe(1);
  });

  it("F144 Root Component 본문이 DOM을 직접 고치면, 다음 update()의 Patch는 그 변경을 모르고 바뀐 곳만 고쳐 화면이 View와 어긋난다", () => {
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      if (count === 1) {
        const title = container.querySelector("h1");
        if (title !== null) {
          title.textContent = "edited";
        }
      }
      return {
        type: "div",
        props: {},
        children: [
          { type: "h1", props: {}, children: ["title"] },
          createIncrementButton(on, count, setCount),
        ],
      };
    }).mount(container);

    clickButton(container);

    expect(readButtonText(container)).toBe("1");
    expect(container.querySelector("h1")?.textContent).toBe("edited");
  });

  it("F15 Root Component가 렌더링 중 Error를 던지면 Error가 나가고 화면은 직전 View로 남으며, 그 뒤 렌더링 밖 Hook 호출도 Error다", () => {
    const container = createContainer();
    let setCount: StateSetter<number> | undefined;
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCountOfRender] = useState(0);
      setCount = setCountOfRender;
      if (count === 3) {
        throw new Error("render failed");
      }
      return createIncrementButton(on, count, setCountOfRender);
    };
    new FunctionComponent(rootComponent).mount(container);

    expect(() => setCount?.(3)).toThrow("render failed");

    expect(container.innerHTML).toBe('<button data-action="inc">0</button>');
    expect(() => useState(0)).toThrow(HOOK_OUTSIDE_RENDER_MESSAGE);
  });

  it("F116 렌더링이 Error로 끝난 뒤에도 직전 렌더링의 클릭 함수가 남아 클릭하면 다시 그린다", () => {
    const container = createContainer();
    let setCount: StateSetter<number> | undefined;
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCountOfRender] = useState(0);
      setCount = setCountOfRender;
      if (count === 3) {
        throw new Error("render failed");
      }
      return createIncrementButton(on, count, setCountOfRender);
    };
    new FunctionComponent(rootComponent).mount(container);
    expect(() => setCount?.(3)).toThrow("render failed");

    clickButton(container);

    expect(readButtonText(container)).toBe("1");
  });

  // 근거: update-before-mount-throws-error
  it("F7 mount 전에 update()를 부르면 Root Component를 부르지 않고 Error를 던진다", () => {
    let renderCount = 0;
    const component = new FunctionComponent((): VNode => {
      renderCount++;
      return { type: "p", props: {}, children: ["hi"] };
    });

    expect(() => component.update()).toThrow("update() needs mount() first");
    expect(renderCount).toBe(0);
  });
});

type StateButton = {
  container: HTMLElement;
  renders: { count: number };
  click: () => void;
};

// 값 하나를 글자로 그리는 버튼을 mount합니다. 클릭하면 handleClick이 그 렌더링의 값과 setter를 받습니다.
function mountStateButton<T>(
  initialValue: T | (() => T),
  handleClick: (value: T, setValue: StateSetter<T>) => void,
): StateButton {
  const container = createContainer();
  const renders = { count: 0 };
  const rootComponent: RootComponent = ({ on }) => {
    renders.count++;
    const [value, setValue] = useState(initialValue);
    on("click", () => handleClick(value, setValue));
    return {
      type: "button",
      props: { "data-action": "click" },
      children: [String(value)],
    };
  };
  new FunctionComponent(rootComponent).mount(container);
  return { container, renders, click: () => clickButton(container) };
}

function createActionButton(actionName: string): VNode {
  return {
    type: "button",
    props: { "data-action": actionName },
    children: [actionName],
  };
}

const readButtonText = (container: Element) =>
  container.querySelector("button")?.textContent;

describe("useState 초깃값과 여러 칸", () => {
  it("F16 useState(5)의 값이 mount 직후 글자로 보인다", () => {
    const { container } = mountStateButton(5, () => {});

    expect(readButtonText(container)).toBe("5");
  });

  it("F17 초깃값 인자가 렌더링마다 달라도 첫 초깃값이 남는다", () => {
    const container = createContainer();
    let renderCount = 0;
    const rootComponent: RootComponent = ({ on }) => {
      renderCount++;
      const [firstRenderCount] = useState(renderCount);
      const [clicks, setClicks] = useState(0);
      on("inc", () => setClicks(clicks + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [`${firstRenderCount}/${renderCount}`],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(readButtonText(container)).toBe("1/2");
  });

  it("F20 칸 두 개 중 두 번째 칸만 바꾸면 첫 칸은 그대로다", () => {
    const container = createContainer();
    const rootComponent: RootComponent = ({ on }) => {
      const [first] = useState("a");
      const [second, setSecond] = useState("b");
      on("change", () => setSecond("B"));
      return {
        type: "button",
        props: { "data-action": "change" },
        children: [first + second],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(readButtonText(container)).toBe("aB");
  });

  it("F21 칸 세 개를 각자의 버튼으로 바꾸면 클릭마다 자기 칸의 글자만 바뀐다", () => {
    const container = createContainer();
    const rootComponent: RootComponent = ({ on }) => {
      const [first, setFirst] = useState(0);
      const [second, setSecond] = useState(0);
      const [third, setThird] = useState(0);
      on("first", () => setFirst(first + 1));
      on("second", () => setSecond(second + 1));
      on("third", () => setThird(third + 1));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("first"),
          createActionButton("second"),
          createActionButton("third"),
          { type: "p", props: {}, children: [`${first}${second}${third}`] },
        ],
      };
    };
    new FunctionComponent(rootComponent).mount(container);
    const [first, second, third] = container.querySelectorAll("button");

    first?.click();
    expect(container.querySelector("p")?.textContent).toBe("100");
    second?.click();
    expect(container.querySelector("p")?.textContent).toBe("110");
    third?.click();
    expect(container.querySelector("p")?.textContent).toBe("111");
  });
});

describe("useState setter", () => {
  it("F22 값을 넘기면 글자가 바뀌고 렌더링이 한 번 늘어난다", () => {
    const { container, renders, click } = mountStateButton(
      0,
      (_value, setValue) => setValue(7),
    );

    click();

    expect(readButtonText(container)).toBe("7");
    expect(renders.count).toBe(2);
  });

  it("F23 함수를 넘기면 칸의 현재 값을 받아 그 결과를 쓴다", () => {
    const receivedValues: number[] = [];
    const { container, click } = mountStateButton(0, (_value, setValue) =>
      setValue((currentValue) => {
        receivedValues.push(currentValue);
        return currentValue + 1;
      }),
    );

    click();
    click();
    click();

    expect(readButtonText(container)).toBe("3");
    expect(receivedValues).toEqual([0, 1, 2]);
  });

  it("F24 함수가 받은 값을 그대로 돌려주면 렌더링이 늘지 않는다", () => {
    const { renders, click } = mountStateButton(4, (_value, setValue) =>
      setValue((currentValue) => currentValue),
    );

    click();

    expect(renders.count).toBe(1);
  });

  it("F25 함수를 setter에 넘기면 저장되지 않고 갱신 함수로 불리며, () => 함수로 감싸야 저장된다", () => {
    const container = createContainer();
    const receivedFunctions: Array<() => string> = [];
    let clickCount = 0;
    const rootComponent: RootComponent = ({ on }) => {
      const [fn, setFn] = useState(() => () => "first");
      on("replace", () => {
        clickCount++;
        if (clickCount === 1) {
          setFn((currentFn) => {
            receivedFunctions.push(currentFn);
            return () => "from updater result";
          });
        } else {
          setFn(() => () => "stored function");
        }
      });
      return {
        type: "button",
        props: { "data-action": "replace" },
        children: [fn()],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);
    expect(readButtonText(container)).toBe("from updater result");
    expect(receivedFunctions.map((fn) => fn())).toEqual(["first"]);
    clickButton(container);

    expect(readButtonText(container)).toBe("stored function");
  });

  it("F26 갱신 함수가 Error를 던지면 Error가 나가고 칸과 화면과 렌더링 횟수는 그대로다", () => {
    const container = createContainer();
    let renderCount = 0;
    let setValue: StateSetter<number> | undefined;
    new FunctionComponent(({ on }) => {
      renderCount++;
      const [value, setValueOfRender] = useState(5);
      setValue = setValueOfRender;
      return createIncrementButton(on, value, setValueOfRender);
    }).mount(container);

    expect(() =>
      setValue?.(() => {
        throw new Error("updater failed");
      }),
    ).toThrow("updater failed");

    expect(readButtonText(container)).toBe("5");
    expect(renderCount).toBe(1);
    setValue?.((current) => current + 1);
    expect(readButtonText(container)).toBe("6");
  });

  it("F38 첫 렌더링의 setter에 함수를 넘기면 칸의 최신 값에서 시작한다", () => {
    const container = createContainer();
    let firstSetter: StateSetter<number> | undefined;
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCount] = useState(0);
      firstSetter ??= setCount;
      on("inc", () => setCount(count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [String(count)],
      };
    };
    new FunctionComponent(rootComponent).mount(container);
    for (let clickCount = 0; clickCount < 5; clickCount++) {
      clickButton(container);
    }

    firstSetter?.((currentValue) => currentValue + 1);

    expect(readButtonText(container)).toBe("6");
  });

  it("F39 setter는 렌더링마다 같은 함수 객체다", () => {
    const setters: StateSetter<number>[] = [];
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      setters.push(setCount);
      return createIncrementButton(on, count, setCount);
    }).mount(container);

    clickButton(container);

    expect(setters).toHaveLength(2);
    expect(setters[1]).toBe(setters[0]);
  });

  it("F40 첫 렌더링의 count로 만든 값 형태 함수는 칸을 오래된 값에서 1 더한 값으로 돌린다", () => {
    const container = createContainer();
    let staleClick: (() => void) | undefined;
    const rootComponent: RootComponent = ({ on }) => {
      const [count, setCount] = useState(0);
      staleClick ??= () => setCount(count + 1);
      on("inc", () => setCount(count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [String(count)],
      };
    };
    new FunctionComponent(rootComponent).mount(container);
    clickButton(container);
    clickButton(container);
    clickButton(container);

    staleClick?.();

    expect(readButtonText(container)).toBe("1");
  });

  it("F41 Root Component 본문에서 setter를 부르면 Error를 던진다", () => {
    const component = new FunctionComponent((): VNode => {
      const [count, setCount] = useState(0);
      setCount(count + 1);
      return String(count);
    });

    expect(() => component.mount(createContainer())).toThrow(
      "setters cannot be called while Root Component renders",
    );
  });

  it("F42 조건에 따라 useState를 건너뛰면 뒤쪽 Hook이 앞쪽 칸의 값을 받는다", () => {
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [show, setShow] = useState(true);
      // biome-ignore lint/correctness/useHookAtTopLevel: 조건부 Hook이 칸을 밀어내는 CAUTION을 보여 주는 테스트입니다
      const first = show ? useState("first")[0] : "skipped";
      const [second] = useState("second");
      on("hide", () => setShow(false));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("hide"),
          { type: "p", props: {}, children: [`${first},${second}`] },
        ],
      };
    }).mount(container);
    expect(container.querySelector("p")?.textContent).toBe("first,second");

    clickButton(container);

    expect(container.querySelector("p")?.textContent).toBe("skipped,first");
  });
});

describe("useState 초깃값 함수", () => {
  it("F19 초깃값이 함수이면 첫 렌더링에서 한 번 불러 그 결과를 쓴다", () => {
    let initializerCount = 0;
    const { container, click } = mountStateButton(
      () => {
        initializerCount++;
        return 10;
      },
      (_value, setValue) => setValue((currentValue) => currentValue + 1),
    );

    click();
    click();

    expect(readButtonText(container)).toBe("12");
    expect(initializerCount).toBe(1);
  });
});

describe("useState Batching 없음", () => {
  it("F35 한 클릭에서 setCount(c => c + 1)을 두 번 부르면 글자가 2이고 렌더링이 두 번 늘어난다", () => {
    const { container, renders, click } = mountStateButton(
      0,
      (_value, setValue) => {
        setValue((currentValue) => currentValue + 1);
        setValue((currentValue) => currentValue + 1);
      },
    );

    click();

    expect(readButtonText(container)).toBe("2");
    expect(renders.count).toBe(3);
  });

  it("F36 한 클릭에서 setCount(count + 1)을 두 번 부르면 글자가 1이고 렌더링이 한 번만 늘어난다", () => {
    const { container, renders, click } = mountStateButton(
      0,
      (count, setValue) => {
        setValue(count + 1);
        setValue(count + 1);
      },
    );

    click();

    expect(readButtonText(container)).toBe("1");
    expect(renders.count).toBe(2);
  });

  it("F37 서로 다른 칸 두 개의 setter를 부르면 첫 setter 직후에 첫 칸만 바뀐 화면을 거친다", () => {
    const container = createContainer();
    const renderedPairs: string[] = [];
    let textBetweenSetters: string | null = null;
    const rootComponent: RootComponent = ({ on }) => {
      const [first, setFirst] = useState(0);
      const [second, setSecond] = useState(0);
      renderedPairs.push(`${first},${second}`);
      on("both", () => {
        setFirst(1);
        textBetweenSetters = container.textContent;
        setSecond(1);
      });
      return {
        type: "button",
        props: { "data-action": "both" },
        children: [`${first}${second}`],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(renderedPairs).toEqual(["0,0", "1,0", "1,1"]);
    expect(textBetweenSetters).toBe("10");
    expect(container.textContent).toBe("11");
  });
});

describe("useState 같은 값 건너뛰기", () => {
  it("F18 칸이 5일 때 undefined를 넘기면 undefined 값이 보이고, 같은 undefined를 다시 넘기면 렌더링이 늘지 않는다", () => {
    const { container, renders, click } = mountStateButton<number | undefined>(
      5,
      (_value, setValue) => setValue(undefined),
    );

    click();

    expect(readButtonText(container)).toBe("undefined");
    expect(renders.count).toBe(2);
    click();
    expect(readButtonText(container)).toBe("undefined");
    expect(renders.count).toBe(2);
  });

  it("F27 칸이 1일 때 1을 넘기면 렌더링이 늘지 않고 DOM도 그대로다", () => {
    const { container, renders, click } = mountStateButton(
      1,
      (_value, setValue) => setValue(1),
    );
    const button = container.querySelector("button");

    click();

    expect(renders.count).toBe(1);
    expect(container.innerHTML).toBe('<button data-action="click">1</button>');
    expect(container.querySelector("button")).toBe(button);
  });

  it("F28 칸이 NaN일 때 NaN을 넘기면 렌더링이 늘지 않는다", () => {
    const { renders, click } = mountStateButton(
      Number.NaN,
      (_value, setValue) => setValue(Number.NaN),
    );

    click();

    expect(renders.count).toBe(1);
  });

  it("F29 칸이 0일 때 -0을 넘기면 렌더링이 한 번 늘지만 DOM은 그대로다", () => {
    const { container, renders, click } = mountStateButton(
      0,
      (_value, setValue) => setValue(-0),
    );
    const textNode = container.querySelector("button")?.firstChild;

    click();

    expect(renders.count).toBe(2);
    expect(container.innerHTML).toBe('<button data-action="click">0</button>');
    expect(container.querySelector("button")?.firstChild).toBe(textNode);
  });

  it("F30 칸이 -0일 때 0을 넘기면 렌더링이 한 번 늘지만 DOM은 그대로다", () => {
    const { container, renders, click } = mountStateButton(
      -0,
      (_value, setValue) => setValue(0),
    );
    const textNode = container.querySelector("button")?.firstChild;

    click();

    expect(renders.count).toBe(2);
    expect(container.innerHTML).toBe('<button data-action="click">0</button>');
    expect(container.querySelector("button")?.firstChild).toBe(textNode);
  });

  it("F31 칸이 문자열 1일 때 숫자 1을 넘기면 다른 값이므로 렌더링이 한 번 늘어난다", () => {
    const { renders, click } = mountStateButton<string | number>(
      "1",
      (_value, setValue) => setValue(1),
    );

    click();

    expect(renders.count).toBe(2);
  });
});

describe("useState 배열 함정", () => {
  function mountTodoList(
    handleClick: (todos: string[], setTodos: StateSetter<string[]>) => void,
  ): StateButton {
    const container = createContainer();
    const renders = { count: 0 };
    const rootComponent: RootComponent = ({ on }) => {
      renders.count++;
      const [todos, setTodos] = useState(["sleep"]);
      on("add", () => handleClick(todos, setTodos));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("add"),
          {
            type: "ul",
            props: {},
            children: todos.map(
              (todo): VNode => ({ type: "li", props: {}, children: [todo] }),
            ),
          },
        ],
      };
    };
    new FunctionComponent(rootComponent).mount(container);
    return { container, renders, click: () => clickButton(container) };
  }
  const readTodos = (container: Element) =>
    [...container.querySelectorAll("li")].map((li) => li.textContent);

  it("F32 칸의 배열을 push로 고쳐 같은 배열을 넘기면 렌더링도 DOM도 그대로다", () => {
    const { container, renders, click } = mountTodoList((todos, setTodos) => {
      todos.push("walk");
      setTodos(todos);
    });

    click();

    expect(renders.count).toBe(1);
    expect(readTodos(container)).toEqual(["sleep"]);
  });

  it("F33 새 배열을 만들어 넘기면 렌더링이 한 번 늘고 li가 하나 더 생긴다", () => {
    const { container, renders, click } = mountTodoList((todos, setTodos) =>
      setTodos([...todos, "walk"]),
    );

    click();

    expect(renders.count).toBe(2);
    expect(readTodos(container)).toEqual(["sleep", "walk"]);
  });

  it("F34 같은 배열을 고쳐 넘긴 뒤 다른 칸을 바꾸면 고쳐 둔 배열이 그때 나타난다", () => {
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [todos, setTodos] = useState(["sleep"]);
      const [count, setCount] = useState(0);
      on("push", () => {
        todos.push("walk");
        setTodos(todos);
      });
      on("count", () => setCount(count + 1));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("push"),
          createActionButton("count"),
          {
            type: "ul",
            props: {},
            children: todos.map(
              (todo): VNode => ({ type: "li", props: {}, children: [todo] }),
            ),
          },
        ],
      };
    }).mount(container);
    const clickAction = (actionName: string) =>
      container
        .querySelector<HTMLElement>(`[data-action="${actionName}"]`)
        ?.click();

    clickAction("push");
    expect(readTodos(container)).toEqual(["sleep"]);
    clickAction("count");

    expect(readTodos(container)).toEqual(["sleep", "walk"]);
  });
});

describe("Hook 호출 위치", () => {
  it("F43 아무 인스턴스도 mount하지 않고 useState를 부르면 Error가 난다", () => {
    expect(() => useState(0)).toThrow(HOOK_OUTSIDE_RENDER_MESSAGE);
  });

  it("F44 mount가 끝난 뒤 테스트 본문에서 useState를 부르면 Error가 난다", () => {
    new FunctionComponent(createCounterRootComponent()).mount(
      createContainer(),
    );

    expect(() => useState(0)).toThrow(HOOK_OUTSIDE_RENDER_MESSAGE);
  });

  it("F45 클릭 함수 안에서 useState를 부르면 Error가 나고 화면과 렌더링 횟수는 그대로다", () => {
    const container = createContainer();
    let renderCount = 0;
    let errorFromClick: unknown;
    const rootComponent: RootComponent = ({ on }) => {
      renderCount++;
      on("inc", () => {
        try {
          // biome-ignore lint/correctness/useHookAtTopLevel: 렌더링 밖 Hook 호출이 Error인지 확인하는 테스트입니다
          useState(0);
        } catch (error) {
          errorFromClick = error;
        }
      });
      return createActionButton("inc");
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(errorFromClick).toBeInstanceOf(Error);
    expect((errorFromClick as Error).message).toBe(HOOK_OUTSIDE_RENDER_MESSAGE);
    expect(readButtonText(container)).toBe("inc");
    expect(renderCount).toBe(1);
  });

  it("F46 effect 함수 안에서 useState를 부르면 Error가 난다", () => {
    const component = new FunctionComponent((): VNode => {
      useEffect(() => {
        useState(0);
      }, []);
      return "view";
    });

    expect(() => component.mount(createContainer())).toThrow(
      HOOK_OUTSIDE_RENDER_MESSAGE,
    );
  });

  it("F47 렌더링 밖에서 useEffect와 useMemo를 부르면 각각 Error가 난다", () => {
    expect(() => useEffect(() => {})).toThrow(HOOK_OUTSIDE_RENDER_MESSAGE);
    expect(() => useMemo(() => 1, [])).toThrow(HOOK_OUTSIDE_RENDER_MESSAGE);
  });
});

describe("FunctionComponent click wiring", () => {
  // Root Component를 mount하고 렌더링 횟수를 셉니다.
  function mountActionTree(createView: (props: RootComponentProps) => VNode): {
    container: HTMLElement;
    renders: { count: number };
  } {
    const container = createContainer();
    const renders = { count: 0 };
    new FunctionComponent((props) => {
      renders.count++;
      return createView(props);
    }).mount(container);
    return { container, renders };
  }

  it("F49 data-action 버튼을 클릭하면 on으로 등록한 함수가 한 번 불린다", () => {
    const container = createContainer();
    let clickCount = 0;
    const rootComponent = ({ on }: RootComponentProps): VNode => {
      on("inc", () => {
        clickCount++;
      });
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: ["+"],
      };
    };
    new FunctionComponent(rootComponent).mount(container);

    clickButton(container);

    expect(clickCount).toBe(1);
  });

  it("F50 data-action 버튼 안쪽 요소를 클릭해도 등록한 함수가 한 번 불린다", () => {
    let clickCount = 0;
    const { container } = mountActionTree(({ on }) => {
      on("inc", () => clickCount++);
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [{ type: "span", props: {}, children: ["+"] }],
      };
    });

    container.querySelector("span")?.click();

    expect(clickCount).toBe(1);
  });

  it("F52 data-action이 겹치면 가장 가까운 안쪽 이름의 함수만 불린다", () => {
    const calledNames: string[] = [];
    const { container } = mountActionTree(({ on }) => {
      on("outer", () => calledNames.push("outer"));
      on("inner", () => calledNames.push("inner"));
      return {
        type: "div",
        props: { "data-action": "outer" },
        children: [createActionButton("inner")],
      };
    });

    clickButton(container);

    expect(calledNames).toEqual(["inner"]);
  });

  it("F53 등록하지 않은 이름의 data-action을 클릭해도 Error가 나지 않고 렌더링과 DOM이 그대로다", () => {
    const { container, renders } = mountActionTree(() =>
      createActionButton("nope"),
    );

    expect(() => clickButton(container)).not.toThrow();

    expect(renders.count).toBe(1);
    expect(container.innerHTML).toBe(
      '<button data-action="nope">nope</button>',
    );
  });

  it("F55 data-action이 없는 요소를 클릭하면 등록한 함수가 불리지 않는다", () => {
    let clickCount = 0;
    const { container } = mountActionTree(({ on }) => {
      on("inc", () => clickCount++);
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("inc"),
          { type: "p", props: {}, children: ["plain"] },
        ],
      };
    });

    container.querySelector("p")?.click();

    expect(clickCount).toBe(0);
  });

  it("F56 컨테이너 자신을 클릭하면 등록한 함수가 불리지 않는다", () => {
    let clickCount = 0;
    const { container } = mountActionTree(({ on }) => {
      on("inc", () => clickCount++);
      return createActionButton("inc");
    });

    container.click();

    expect(clickCount).toBe(0);
  });

  it("F57 컨테이너를 감싼 바깥 요소의 data-action은 찾지 않는다", () => {
    let clickCount = 0;
    const outside = document.createElement("section");
    outside.setAttribute("data-action", "inc");
    const container = document.createElement("div");
    outside.append(container);
    new FunctionComponent(({ on }) => {
      on("inc", () => clickCount++);
      return { type: "p", props: {}, children: ["plain"] };
    }).mount(container);

    container.querySelector("p")?.click();

    expect(clickCount).toBe(0);
  });

  it("F58 컨테이너 밖의 data-action 버튼을 클릭하면 등록한 함수가 불리지 않는다", () => {
    let clickCount = 0;
    const container = createContainer();
    const outsideButton = document.createElement("button");
    outsideButton.setAttribute("data-action", "inc");
    document.body.append(container, outsideButton);
    new FunctionComponent(({ on }) => {
      on("inc", () => clickCount++);
      return createActionButton("inc");
    }).mount(container);

    outsideButton.click();

    expect(clickCount).toBe(0);
    container.remove();
    outsideButton.remove();
  });

  it("F59 클릭 함수는 매번 최신 렌더링의 count를 본다", () => {
    const seenCounts: number[] = [];
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      on("inc", () => {
        seenCounts.push(count);
        setCount(count + 1);
      });
      return createActionButton("inc");
    }).mount(container);

    clickButton(container);
    clickButton(container);
    clickButton(container);

    expect(seenCounts).toEqual([0, 1, 2]);
  });

  it("F60 첫 렌더링에서만 등록한 이름은 다시 그린 뒤 불리지 않는다", () => {
    let onceCount = 0;
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      if (count === 0) {
        on("once", () => onceCount++);
      }
      on("inc", () => setCount(count + 1));
      return {
        type: "div",
        props: {},
        children: [createActionButton("inc"), createActionButton("once")],
      };
    }).mount(container);
    const [incButton, onceButton] = container.querySelectorAll("button");

    incButton?.click();
    onceButton?.click();

    expect(onceCount).toBe(0);
  });

  it("F61 한 렌더링에서 같은 이름을 두 번 등록하면 나중에 등록한 함수만 불린다", () => {
    const calls: string[] = [];
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      on("go", () => calls.push("first"));
      on("go", () => calls.push("second"));
      return createActionButton("go");
    }).mount(container);

    clickButton(container);

    expect(calls).toEqual(["second"]);
  });

  it("F62 다섯 번 다시 그린 뒤 클릭하면 클릭 함수가 정확히 한 번 불린다", () => {
    let targetCount = 0;
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      on("inc", () => setCount(count + 1));
      on("target", () => targetCount++);
      return {
        type: "div",
        props: {},
        children: [createActionButton("inc"), createActionButton("target")],
      };
    }).mount(container);
    const [incButton, targetButton] = container.querySelectorAll("button");
    for (let clickCount = 0; clickCount < 5; clickCount++) {
      incButton?.click();
    }

    targetButton?.click();

    expect(targetCount).toBe(1);
  });

  it("F63 같은 버튼의 data-action이 a에서 b로 바뀌면 b의 함수만 불린다", () => {
    const calledNames: string[] = [];
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [useB, setUseB] = useState(false);
      on("a", () => {
        calledNames.push("a");
        setUseB(true);
      });
      on("b", () => calledNames.push("b"));
      return createActionButton(useB ? "b" : "a");
    }).mount(container);

    clickButton(container);
    clickButton(container);

    expect(calledNames).toEqual(["a", "b"]);
  });

  it("F64 렌더링 밖에서 잡아 둔 on을 부르면 Error를 던진다", () => {
    let capturedOn: RootComponentProps["on"] | undefined;
    new FunctionComponent(({ on }) => {
      capturedOn = on;
      return "view";
    }).mount(createContainer());

    expect(() => capturedOn?.("late", () => {})).toThrow(
      "on() can only be called while Root Component renders",
    );
  });

  it("F66 data-action 요소에 dblclick과 input 이벤트를 보내도 등록한 함수가 불리지 않는다", () => {
    let calledCount = 0;
    const { container } = mountActionTree(({ on }) => {
      on("inc", () => calledCount++);
      return createActionButton("inc");
    });
    const button = container.querySelector("button");

    button?.dispatchEvent(new Event("dblclick", { bubbles: true }));
    button?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(calledCount).toBe(0);
  });
});

describe("상태 없는 자식 Component", () => {
  const createLabel = ({ text }: { text: string }): VNode => ({
    type: "span",
    props: {},
    children: [text],
  });

  it("F67 자식 Component가 props로 받은 글자를 그리고 렌더링마다 한 번씩 불린다", () => {
    let labelCallCount = 0;
    const countedLabel = (props: { text: string }): VNode => {
      labelCallCount++;
      return createLabel(props);
    };
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      on("inc", () => setCount(count + 1));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("inc"),
          countedLabel({ text: String(count) }),
        ],
      };
    }).mount(container);

    clickButton(container);

    expect(container.querySelector("span")?.textContent).toBe("1");
    expect(labelCallCount).toBe(2);
  });

  it("F68 같은 자식을 다른 props로 두 번 부르면 상태가 바뀐 뒤에도 두 출력이 섞이지 않는다", () => {
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      on("inc", () => setCount(count + 1));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("inc"),
          createLabel({ text: "left" }),
          createLabel({ text: String(count) }),
        ],
      };
    }).mount(container);
    const readLabels = () =>
      [...container.querySelectorAll("span")].map((span) => span.textContent);
    expect(readLabels()).toEqual(["left", "0"]);

    clickButton(container);

    expect(readLabels()).toEqual(["left", "1"]);
  });

  it("F69 자식 Component가 그린 data-action 버튼을 눌러도 Root Component가 등록한 함수가 불리고 Root Component의 상태가 바뀐다", () => {
    const createCountButton = ({
      count,
      actionName,
    }: {
      count: number;
      actionName: string;
    }): VNode => ({
      type: "button",
      props: { "data-action": actionName },
      children: [{ type: "span", props: {}, children: [`count ${count}`] }],
    });
    const container = createContainer();
    new FunctionComponent(({ on }) => {
      const [count, setCount] = useState(0);
      on("child-action", () => setCount(count + 1));
      return {
        type: "div",
        props: {},
        children: [createCountButton({ count, actionName: "child-action" })],
      };
    }).mount(container);

    clickButton(container);

    expect(readButtonText(container)).toBe("count 1");
  });

  // 바라는 동작이 아니라 약속으로만 막는 한계를 확인합니다. 근거: hook-rule-kept-by-convention
  it("F70 한계 — 자식 Component의 useState는 Error 없이 Root Instance의 칸을 써서, 자식을 빼면 Root Component가 자식의 값을 받는다", () => {
    const container = createContainer();
    const createChildWithState = (): VNode => {
      // biome-ignore lint/correctness/useHookAtTopLevel: 자식 Component 안의 Hook이 막히지 않는 한계를 보여 주는 테스트입니다
      const [childValue] = useState("child");
      return { type: "span", props: {}, children: [childValue] };
    };
    new FunctionComponent(({ on }) => {
      const [step, setStep] = useState(0);
      on("next", () => setStep(step + 1));
      const childView = step === 0 ? createChildWithState() : "";
      const [name] = useState("a");
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("next"),
          childView,
          { type: "p", props: {}, children: [name] },
        ],
      };
    }).mount(container);
    expect(container.querySelector("p")?.textContent).toBe("a");

    clickButton(container);

    expect(container.querySelector("p")?.textContent).toBe("child");
  });
});

type EffectRoot = {
  container: HTMLElement;
  log: string[];
  renders: { count: number };
  click: (actionName: string) => void;
};

// Root Component를 mount하고, 이름을 넣는 기록 배열과 렌더링 횟수와 data-action 클릭 함수를 돌려줍니다.
function mountEffectRoot(
  createView: (
    props: RootComponentProps,
    log: string[],
    container: HTMLElement,
  ) => VNode,
): EffectRoot {
  const container = createContainer();
  const log: string[] = [];
  const renders = { count: 0 };
  new FunctionComponent((props) => {
    renders.count++;
    return createView(props, log, container);
  }).mount(container);
  const click = (actionName: string) => {
    const element = container.querySelector(`[data-action="${actionName}"]`);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`container has no ${actionName}`);
    }
    element.click();
  };
  return { container, log, renders, click };
}

// 칸 두 개(count와 other)와 각자를 1 늘리는 버튼 inc, other를 그립니다.
function createTwoCounterView(
  on: RootComponentProps["on"],
  count: number,
  setCount: StateSetter<number>,
  other: number,
  setOther: StateSetter<number>,
): VNode {
  on("inc", () => setCount(count + 1));
  on("other", () => setOther(other + 1));
  return {
    type: "div",
    props: {},
    children: [
      { type: "button", props: { "data-action": "inc" }, children: ["inc"] },
      {
        type: "button",
        props: { "data-action": "other" },
        children: ["other"],
      },
      { type: "p", props: {}, children: [`${count},${other}`] },
    ],
  };
}

describe("useEffect 실행 시점", () => {
  it("F71 effect는 mount 안에서 첫 View를 DOM에 반영한 직후 동기로 불린다", () => {
    const { log } = mountEffectRoot((_props, log, container) => {
      useEffect(() => {
        log.push(container.textContent ?? "");
      });
      return { type: "p", props: {}, children: ["first"] };
    });

    expect(log).toEqual(["first"]);
  });

  it("F72 deps 없는 effect는 클릭 뒤 새 화면을 본다", () => {
    const { log, click } = mountEffectRoot(({ on }, log, container) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push(container.textContent ?? "");
      });
      on("inc", () => setCount(count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [String(count)],
      };
    });

    click("inc");

    expect(log).toEqual(["0", "1"]);
  });

  it("F73 effect는 Root Component 본문이 끝난 뒤에 불린다", () => {
    const { log } = mountEffectRoot((_props, log) => {
      useEffect(() => {
        log.push("effect");
      });
      log.push("render");
      return "view";
    });

    expect(log).toEqual(["render", "effect"]);
  });

  it("F74 effect 두 개는 선언한 순서대로 불린다", () => {
    const { log } = mountEffectRoot((_props, log) => {
      useEffect(() => {
        log.push("a");
      });
      useEffect(() => {
        log.push("b");
      });
      return "view";
    });

    expect(log).toEqual(["a", "b"]);
  });
});

describe("useEffect deps", () => {
  it("F75 deps가 []이면 다섯 번 클릭해도 effect는 한 번만 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, []);
      on("inc", () => setCount(count + 1));
      return createActionButton("inc");
    });

    for (let clickCount = 0; clickCount < 5; clickCount++) {
      click("inc");
    }

    expect(log).toEqual(["effect"]);
  });

  it("F76 deps를 생략하면 세 번 클릭했을 때 effect가 모두 네 번 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
      });
      on("inc", () => setCount(count + 1));
      return createActionButton("inc");
    });

    click("inc");
    click("inc");
    click("inc");

    expect(log).toHaveLength(4);
  });

  it("F77 deps의 값이 바뀌면 effect가 다시 불리고 새 값을 본다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      useEffect(() => {
        log.push(`effect ${count}`);
      }, [count]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("inc");

    expect(log).toEqual(["effect 0", "effect 1"]);
  });

  it("F78 deps의 값이 같으면 렌더링은 늘어도 effect는 다시 불리지 않는다", () => {
    const { log, renders, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, [count]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("other");

    expect(renders.count).toBe(2);
    expect(log).toEqual(["effect"]);
  });

  it("F79 deps의 값이 NaN으로 남으면 effect가 다시 불리지 않는다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, [Number.NaN]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("other");

    expect(log).toEqual(["effect"]);
  });

  it("F80 deps의 값이 0에서 -0으로 바뀌면 effect가 다시 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [zero, setZero] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, [zero]);
      on("negative", () => setZero(-0));
      return createActionButton("negative");
    });

    click("negative");

    expect(log).toEqual(["effect", "effect"]);
  });

  it("F81 deps의 길이가 늘거나 줄면 앞 칸이 같아도 effect가 다시 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [step, setStep] = useState(0);
      useEffect(
        () => {
          log.push("effect");
        },
        step % 2 === 0 ? ["a"] : ["a", "b"],
      );
      on("next", () => setStep(step + 1));
      return createActionButton("next");
    });

    click("next");
    click("next");

    expect(log).toEqual(["effect", "effect", "effect"]);
  });

  it("F82 deps가 []와 생략 사이에서 바뀌면 바뀐 렌더링마다 effect가 다시 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [step, setStep] = useState(0);
      useEffect(
        () => {
          log.push(`effect ${step}`);
        },
        step % 2 === 0 ? [] : undefined,
      );
      on("next", () => setStep(step + 1));
      return createActionButton("next");
    });

    click("next");
    click("next");

    expect(log).toEqual(["effect 0", "effect 1", "effect 2"]);
  });

  it("F88 같은 값 setter로 렌더링이 없으면 deps 없는 effect도 불리지 않는다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
      });
      on("same", () => setCount(count));
      return createActionButton("same");
    });

    click("same");

    expect(log).toEqual(["effect"]);
  });
});

describe("useEffect 정리 함수", () => {
  it("F83 deps가 바뀌면 이전 effect의 정리 함수가 이전 값으로 불린 뒤 effect가 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      useEffect(() => {
        log.push(`effect ${count}`);
        return () => log.push(`cleanup ${count}`);
      }, [count]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("inc");

    expect(log).toEqual(["effect 0", "cleanup 0", "effect 1"]);
  });

  it("F84 deps가 같으면 정리 함수가 불리지 않는다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      useEffect(() => {
        log.push("effect");
        return () => log.push("cleanup");
      }, [count]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("other");

    expect(log).toEqual(["effect"]);
  });

  it("F85 deps가 []인 effect의 정리 함수는 여러 번 클릭해도 불리지 않는다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
        return () => log.push("cleanup");
      }, []);
      on("inc", () => setCount(count + 1));
      return createActionButton("inc");
    });

    click("inc");
    click("inc");
    click("inc");

    expect(log).toEqual(["effect"]);
  });

  it("F86 다시 불릴 effect 두 개는 정리 함수를 모두 먼저 부른 뒤 effect를 부른다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect1");
        return () => log.push("cleanup1");
      }, [count]);
      useEffect(() => {
        log.push("effect2");
        return () => log.push("cleanup2");
      }, [count]);
      on("inc", () => setCount(count + 1));
      return createActionButton("inc");
    });
    log.length = 0;

    click("inc");

    expect(log).toEqual(["cleanup1", "cleanup2", "effect1", "effect2"]);
  });

  it("F87 effect가 함수가 아닌 값을 돌려주면 다시 불릴 때 Error 없이 effect만 불린다", () => {
    const returnNumber = (() => 1) as unknown as () => undefined;
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
        return returnNumber();
      }, [count]);
      on("inc", () => setCount(count + 1));
      return createActionButton("inc");
    });

    click("inc");

    expect(log).toEqual(["effect", "effect"]);
  });
});

describe("useEffect 안의 setter와 오류", () => {
  it("F89 []인 effect에서 setter를 부르면 mount가 끝났을 때 새 화면이고, 렌더링은 두 번, effect는 한 번이다", () => {
    const { container, log, renders } = mountEffectRoot((_props, log) => {
      const [ready, setReady] = useState(false);
      useEffect(() => {
        log.push("effect");
        setReady(true);
      }, []);
      return { type: "p", props: {}, children: [ready ? "ready" : "wait"] };
    });

    expect(container.textContent).toBe("ready");
    expect(renders.count).toBe(2);
    expect(log).toEqual(["effect"]);
  });

  it("F90 [count]인 effect가 count가 3이 될 때까지 늘리면 mount가 끝났을 때 3이고 effect는 네 번 불린다", () => {
    const { container, log } = mountEffectRoot((_props, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push(`effect ${count}`);
        if (count < 3) {
          setCount((currentCount) => currentCount + 1);
        }
      }, [count]);
      return { type: "p", props: {}, children: [String(count)] };
    });

    expect(container.textContent).toBe("3");
    expect(log).toHaveLength(4);
  });

  it("F91 []인 effect A가 setter를 부르고 deps 없는 effect B가 뒤에 있으면, 최종 화면은 새 값이고 B는 새 값으로 한 번만 불린다", () => {
    const { container, log } = mountEffectRoot((_props, log) => {
      const [value, setValue] = useState("old");
      useEffect(() => {
        setValue("new");
      }, []);
      useEffect(() => {
        log.push(`b ${value}`);
      });
      return { type: "p", props: {}, children: [value] };
    });

    expect(container.textContent).toBe("new");
    expect(log).toEqual(["b new"]);
  });

  it("F91a 중첩 update()가 다시 예약한 effect의 정리 함수는 다음 렌더링에서 새 값으로 불린다", () => {
    const container = createContainer();
    const log: string[] = [];
    const component = new FunctionComponent((): VNode => {
      const [value, setValue] = useState("old");
      useEffect(() => {
        setValue("new");
      }, []);
      useEffect(() => {
        log.push(`b ${value}`);
        return () => {
          log.push(`cleanup ${value}`);
        };
      });
      return { type: "p", props: {}, children: [value] };
    });
    component.mount(container);

    component.update();

    expect(log).toEqual(["b new", "cleanup new", "b new"]);
  });

  it("F93 effect가 Error를 던지면 mount에서 그 Error가 나가고 DOM은 이미 첫 View다", () => {
    const container = createContainer();
    const component = new FunctionComponent((): VNode => {
      useEffect(() => {
        throw new Error("effect failed");
      });
      return { type: "p", props: {}, children: ["first"] };
    });

    expect(() => component.mount(container)).toThrow("effect failed");
    expect(container.textContent).toBe("first");
  });
});

describe("useMemo", () => {
  function mountMemoRoot(
    computeFromCount: (count: number) => unknown,
    createDeps: (count: number) => readonly unknown[] | undefined,
  ): EffectRoot & { values: unknown[] } {
    const values: unknown[] = [];
    const root = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      const value = useMemo(() => {
        log.push("compute");
        return computeFromCount(count);
      }, createDeps(count));
      values.push(value);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });
    return { ...root, values };
  }

  it("F94 첫 렌더링에서 계산 함수를 한 번 불러 그 값을 첫 View에 쓴다", () => {
    const { log, values } = mountMemoRoot(
      (count) => count * 2,
      (count) => [count],
    );

    expect(values).toEqual([0]);
    expect(log).toEqual(["compute"]);
  });

  it("F95 deps가 같으면 세 번 다시 그려도 계산 함수는 한 번이고 같은 객체를 돌려준다", () => {
    const { log, values, click } = mountMemoRoot(
      (count) => ({ double: count * 2 }),
      (count) => [count],
    );

    click("other");
    click("other");
    click("other");

    expect(log).toEqual(["compute"]);
    expect(values).toHaveLength(4);
    expect(values.every((value) => value === values[0])).toBe(true);
  });

  it("F96 deps가 바뀌면 계산 함수가 다시 불리고 새 값을 돌려준다", () => {
    const { log, values, click } = mountMemoRoot(
      (count) => count * 2,
      (count) => [count],
    );

    click("inc");

    expect(log).toEqual(["compute", "compute"]);
    expect(values).toEqual([0, 2]);
  });

  it("F97 deps의 값이 NaN으로 남으면 계산 함수가 다시 불리지 않는다", () => {
    const { log, click } = mountMemoRoot(
      () => "value",
      () => [Number.NaN],
    );

    click("other");

    expect(log).toEqual(["compute"]);
  });

  it("F98 deps가 []이면 여러 번 클릭해도 계산 함수는 한 번만 불린다", () => {
    const { log, click } = mountMemoRoot(
      () => "value",
      () => [],
    );

    click("inc");
    click("other");
    click("inc");

    expect(log).toEqual(["compute"]);
  });

  it("F99 deps를 생략하면 세 번 클릭했을 때 계산 함수가 모두 네 번 불린다", () => {
    const { log, click } = mountMemoRoot(
      () => "value",
      () => undefined,
    );

    click("other");
    click("other");
    click("other");

    expect(log).toHaveLength(4);
  });

  it("F100 계산 결과가 undefined여도 deps가 같으면 다시 계산하지 않는다", () => {
    const { log, values, click } = mountMemoRoot(
      () => undefined,
      () => [],
    );

    click("other");

    expect(log).toEqual(["compute"]);
    expect(values).toEqual([undefined, undefined]);
  });
});

describe("Hook 섞어 부르기", () => {
  function mountMixedRoot(): EffectRoot {
    return mountEffectRoot(({ on }, log) => {
      const [first, setFirst] = useState(1);
      const memo = useMemo(() => {
        log.push("compute");
        return first * 10;
      }, [first]);
      useEffect(() => {
        log.push("effect");
      }, [first]);
      const [last, setLast] = useState("a");
      on("first", () => setFirst(first + 1));
      on("last", () => setLast(`${last}a`));
      return {
        type: "div",
        props: {},
        children: [
          createActionButton("first"),
          createActionButton("last"),
          { type: "p", props: {}, children: [`${first},${memo},${last}`] },
        ],
      };
    });
  }
  const readText = (container: Element) =>
    container.querySelector("p")?.textContent;

  it("F101 useState, useMemo, useEffect, useState 순서에서 마지막 칸만 바꾸면 memo와 effect는 그대로다", () => {
    const { container, log, click } = mountMixedRoot();

    click("last");

    expect(readText(container)).toBe("1,10,aa");
    expect(log).toEqual(["compute", "effect"]);
  });

  it("F102 같은 순서에서 첫 칸을 바꾸면 memo가 다시 계산되고 effect가 다시 불리며 마지막 칸은 그대로다", () => {
    const { container, log, click } = mountMixedRoot();

    click("first");

    expect(readText(container)).toBe("2,20,a");
    expect(log).toEqual(["compute", "effect", "compute", "effect"]);
  });

  it("F103 useMemo의 결과를 useEffect의 deps에 넣으면 memo가 같은 값일 때 effect도 다시 불리지 않는다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);
      const parity = useMemo(() => count % 2, [count]);
      useEffect(() => {
        log.push(`effect ${parity}`);
      }, [parity]);
      return createTwoCounterView(on, count, setCount, other, setOther);
    });

    click("other");
    click("inc");

    expect(log).toEqual(["effect 0", "effect 1"]);
  });
});

type ErrorMode = "ok" | "render-error" | "effect-error";

// 매 렌더링의 결과를 control이 정합니다. effect와 정리 함수가 불린 순서는 log에 남습니다.
function mountErrorModeRoot() {
  const container = createContainer();
  const log: string[] = [];
  const control = { mode: "ok" as ErrorMode, label: "v1" };
  const component = new FunctionComponent((): VNode => {
    log.push("render");
    useEffect(() => {
      log.push("effect");
      if (control.mode === "effect-error") {
        throw new Error("effect failed");
      }
      return () => {
        log.push("cleanup");
      };
    });
    if (control.mode === "render-error") {
      throw new Error("render failed");
    }
    return { type: "p", props: {}, children: [control.label] };
  });
  component.mount(container);
  return { container, log, control, component };
}

describe("Error 뒤의 화면과 effect", () => {
  it("F117 update()에서 effect가 Error를 던지면 update()가 그 Error를 던지고 DOM은 이미 새 View다", () => {
    const { container, control, component } = mountErrorModeRoot();
    control.mode = "effect-error";
    control.label = "v2";

    expect(() => component.update()).toThrow("effect failed");

    expect(container.textContent).toBe("v2");
  });

  it("F118 setter가 시작한 update()에서 effect가 Error를 던지면 setter가 그 Error를 던지고 DOM은 이미 새 View다", () => {
    const container = createContainer();
    let setCount: StateSetter<number> | undefined;
    new FunctionComponent((): VNode => {
      const [count, setCountOfRender] = useState(0);
      setCount = setCountOfRender;
      useEffect(() => {
        if (count === 1) {
          throw new Error("effect failed");
        }
      }, [count]);
      return { type: "p", props: {}, children: [String(count)] };
    }).mount(container);

    expect(() => setCount?.(1)).toThrow("effect failed");

    expect(container.textContent).toBe("1");
  });

  it("F119 effect 세 개 중 두 번째가 Error를 던지면 첫 번째는 불리고 세 번째는 불리지 않는다", () => {
    const container = createContainer();
    const log: string[] = [];
    const control = { fail: false };
    const component = new FunctionComponent((): VNode => {
      useEffect(() => {
        log.push("e1");
      });
      useEffect(() => {
        log.push("e2");
        if (control.fail) {
          throw new Error("e2 failed");
        }
      });
      useEffect(() => {
        log.push("e3");
      });
      return "view";
    });
    component.mount(container);
    log.length = 0;
    control.fail = true;

    expect(() => component.update()).toThrow("e2 failed");

    expect(log).toEqual(["e1", "e2"]);
  });

  it("F120 render가 Error를 던지면 effect도 정리 함수도 불리지 않는다", () => {
    const { log, control, component } = mountErrorModeRoot();
    log.length = 0;
    control.mode = "render-error";

    expect(() => component.update()).toThrow("render failed");

    expect(log).toEqual(["render"]);
  });

  it("F121 다시 불릴 effect가 Error를 던져도 그 전에 정리 함수는 모두 불려 있다", () => {
    const container = createContainer();
    const log: string[] = [];
    const control = { fail: false };
    const component = new FunctionComponent((): VNode => {
      useEffect(() => {
        log.push("e1");
        return () => {
          log.push("c1");
        };
      });
      useEffect(() => {
        log.push("e2");
        if (control.fail) {
          throw new Error("e2 failed");
        }
        return () => {
          log.push("c2");
        };
      });
      return "view";
    });
    component.mount(container);
    log.length = 0;
    control.fail = true;

    expect(() => component.update()).toThrow("e2 failed");

    expect(log).toEqual(["c1", "c2", "e1", "e2"]);
  });

  it("F122 render Error 다음 effect Error가 나도 DOM은 마지막으로 그린 View이고, 그 다음 update()는 정상이다", () => {
    const { container, control, component } = mountErrorModeRoot();

    control.mode = "render-error";
    control.label = "v2";
    expect(() => component.update()).toThrow("render failed");
    expect(container.textContent).toBe("v1");

    control.mode = "effect-error";
    control.label = "v3";
    expect(() => component.update()).toThrow("effect failed");
    expect(container.textContent).toBe("v3");

    control.mode = "ok";
    control.label = "v4";
    component.update();
    expect(container.textContent).toBe("v4");
  });

  it("F123 effect Error 다음 render Error가 나면 DOM은 effect가 던지기 전에 반영한 View로 남는다", () => {
    const { container, control, component } = mountErrorModeRoot();

    control.mode = "effect-error";
    control.label = "v2";
    expect(() => component.update()).toThrow("effect failed");

    control.mode = "render-error";
    control.label = "v3";
    expect(() => component.update()).toThrow("render failed");

    expect(container.textContent).toBe("v2");
  });

  it("F124 render가 Error를 던지기 전에 on으로 등록한 함수는 남지 않고 직전 렌더링의 함수가 불린다", () => {
    const container = createContainer();
    const calls: string[] = [];
    const control = { version: "v1", fail: false };
    const component = new FunctionComponent(({ on }): VNode => {
      const version = control.version;
      on("x", () => {
        calls.push(version);
      });
      if (control.fail) {
        throw new Error("render failed");
      }
      return createActionButton("x");
    });
    component.mount(container);
    control.version = "v2";
    control.fail = true;
    expect(() => component.update()).toThrow("render failed");

    clickButton(container);

    expect(calls).toEqual(["v1"]);
  });

  it("F125 render가 Error를 던진 뒤에도 칸은 새 값으로 남아, 다음 갱신 함수는 그 값에서 시작하고 DOM은 직전에 그린 View와 비교된다", () => {
    const container = createContainer();
    let setCount: StateSetter<number> | undefined;
    new FunctionComponent((): VNode => {
      const [count, setCountOfRender] = useState(2);
      setCount = setCountOfRender;
      if (count === 3) {
        throw new Error("render failed");
      }
      return { type: "p", props: {}, children: [String(count)] };
    }).mount(container);

    expect(() => setCount?.(3)).toThrow("render failed");
    expect(container.textContent).toBe("2");

    setCount?.((count) => count + 1);

    expect(container.textContent).toBe("4");
  });

  it("F126 render가 Error를 던진 뒤 칸과 같은 값을 넘기면 다시 그리지 않는다", () => {
    const container = createContainer();
    const renders = { count: 0 };
    let setCount: StateSetter<number> | undefined;
    new FunctionComponent((): VNode => {
      renders.count++;
      const [count, setCountOfRender] = useState(2);
      setCount = setCountOfRender;
      if (count === 3) {
        throw new Error("render failed");
      }
      return { type: "p", props: {}, children: [String(count)] };
    }).mount(container);
    expect(() => setCount?.(3)).toThrow("render failed");
    const rendersBefore = renders.count;

    setCount?.(3);

    expect(renders.count).toBe(rendersBefore);
    expect(container.textContent).toBe("2");
  });

  it("F127 한 클릭 안에서 두 번째 갱신 함수가 Error를 던지면 첫 setter의 결과는 이미 그려졌고 세 번째는 불리지 않으며, 그 뒤 setter는 정상이다", () => {
    const container = createContainer();
    let setA: StateSetter<number> | undefined;
    let setB: StateSetter<number> | undefined;
    let setC: StateSetter<number> | undefined;
    new FunctionComponent((): VNode => {
      const [a, setAOfRender] = useState(0);
      const [b, setBOfRender] = useState(0);
      const [c, setCOfRender] = useState(0);
      setA = setAOfRender;
      setB = setBOfRender;
      setC = setCOfRender;
      return { type: "p", props: {}, children: [`${a},${b},${c}`] };
    }).mount(container);

    expect(() => {
      setA?.(1);
      setB?.(() => {
        throw new Error("updater failed");
      });
      setC?.(1);
    }).toThrow("updater failed");
    expect(container.textContent).toBe("1,0,0");

    setB?.((current) => current + 5);

    expect(container.textContent).toBe("1,5,0");
  });

  it("F128 자식 Component 본문이 Error를 던지면 Error가 나가고 화면은 직전 View로 남는다", () => {
    const container = createContainer();
    const control = { fail: false };
    const component = new FunctionComponent((): VNode => {
      const child = (): VNode => {
        if (control.fail) {
          throw new Error("child failed");
        }
        return { type: "span", props: {}, children: ["child"] };
      };
      return { type: "p", props: {}, children: [child()] };
    });
    component.mount(container);
    control.fail = true;

    expect(() => component.update()).toThrow("child failed");

    expect(container.innerHTML).toBe("<p><span>child</span></p>");
  });

  it("F129 Root Component 본문에서 setter를 부르면 Error가 나가고, 화면과 클릭 함수는 직전 렌더링의 것이며 칸은 쓰이지 않는다", () => {
    const container = createContainer();
    const calls: string[] = [];
    const control = { callSetter: false };
    let setCount: StateSetter<number> | undefined;
    const component = new FunctionComponent(({ on }): VNode => {
      const [count, setCountOfRender] = useState(0);
      setCount = setCountOfRender;
      if (control.callSetter) {
        setCount(9);
      }
      on("x", () => {
        calls.push(`click ${count}`);
      });
      return {
        type: "button",
        props: { "data-action": "x" },
        children: [String(count)],
      };
    });
    component.mount(container);
    control.callSetter = true;

    expect(() => component.update()).toThrow(
      "setters cannot be called while Root Component renders",
    );
    clickButton(container);
    control.callSetter = false;
    component.update();

    expect(calls).toEqual(["click 0"]);
    expect(container.textContent).toBe("0");
  });

  it("F130 자식 Component 본문과 useMemo의 계산 함수에서 setter를 불러도 Error가 나고 칸은 쓰이지 않는다", () => {
    const container = createContainer();
    const control = { inChild: false, inMemo: false };
    const component = new FunctionComponent((): VNode => {
      const [count, setCountOfRender] = useState(0);
      useMemo(() => {
        if (control.inMemo) {
          setCountOfRender(9);
        }
      });
      const child = (): VNode => {
        if (control.inChild) {
          setCountOfRender(9);
        }
        return { type: "span", props: {}, children: [String(count)] };
      };
      return { type: "p", props: {}, children: [child()] };
    });
    component.mount(container);

    control.inChild = true;
    expect(() => component.update()).toThrow(
      "setters cannot be called while Root Component renders",
    );
    control.inChild = false;
    control.inMemo = true;
    expect(() => component.update()).toThrow(
      "setters cannot be called while Root Component renders",
    );
    control.inMemo = false;
    component.update();

    expect(container.textContent).toBe("0");
  });

  it("F131 effect 안의 setter가 시작한 render가 Error를 던지면 그 Error가 mount 밖으로 나가고 뒤의 effect는 불리지 않는다", () => {
    const container = createContainer();
    const log: string[] = [];
    const component = new FunctionComponent((): VNode => {
      const [value, setValue] = useState(0);
      useEffect(() => {
        log.push("a");
        setValue(1);
      }, []);
      useEffect(() => {
        log.push("b");
      }, []);
      if (value === 1) {
        throw new Error("render failed");
      }
      return "view";
    });

    expect(() => component.mount(container)).toThrow("render failed");

    expect(log).toEqual(["a"]);
  });

  it("F132 effect 안에서 부른 갱신 함수가 Error를 던지면 그 Error가 mount 밖으로 나가고 뒤의 effect는 불리지 않는다", () => {
    const container = createContainer();
    const log: string[] = [];
    const component = new FunctionComponent((): VNode => {
      const [, setValue] = useState(0);
      useEffect(() => {
        log.push("a");
        setValue(() => {
          throw new Error("updater failed");
        });
      }, []);
      useEffect(() => {
        log.push("b");
      }, []);
      return "view";
    });

    expect(() => component.mount(container)).toThrow("updater failed");

    expect(log).toEqual(["a"]);
  });

  it("F139 render가 Hook 호출 중간에 Error를 던진 뒤 다음 렌더링도 Hook 번호를 0부터 다시 센다", () => {
    const container = createContainer();
    const control = { fail: false };
    let setA: StateSetter<number> | undefined;
    const component = new FunctionComponent((): VNode => {
      const [a, setAOfRender] = useState(1);
      setA = setAOfRender;
      const [b] = useState(2);
      if (control.fail) {
        throw new Error("render failed");
      }
      const [c] = useState(3);
      return { type: "p", props: {}, children: [`${a},${b},${c}`] };
    });
    component.mount(container);
    setA?.(10);
    control.fail = true;
    expect(() => component.update()).toThrow("render failed");
    control.fail = false;

    component.update();

    expect(container.textContent).toBe("10,2,3");
  });
});

describe("함정 한 줄짜리 CAUTION", () => {
  it("F133 deps에 setter를 넣은 effect는 몇 번을 다시 그려도 한 번만 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, [setCount]);
      return createIncrementButton(on, count, setCount);
    });

    click("inc");
    click("inc");

    expect(log).toEqual(["effect"]);
  });

  it("F134 계산 함수가 쓰는 값을 deps에서 빼면 값이 바뀌어도 화면에 옛 결과가 남는다", () => {
    const { container, click } = mountEffectRoot(({ on }) => {
      const [count, setCount] = useState(0);
      const doubled = useMemo(() => count * 2, []);
      on("inc", () => setCount(count + 1));
      return {
        type: "button",
        props: { "data-action": "inc" },
        children: [`${count},${doubled}`],
      };
    });

    click("inc");

    expect(container.textContent).toBe("1,0");
  });

  it("F135 deps에 매번 새 객체를 넣은 effect는 deps를 생략한 것처럼 다시 그릴 때마다 불린다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect(() => {
        log.push("effect");
      }, [{}]);
      return createIncrementButton(on, count, setCount);
    });

    click("inc");
    click("inc");

    expect(log).toEqual(["effect", "effect", "effect"]);
  });

  it("F136 deps에 매번 새 배열을 넣은 useMemo는 다시 그릴 때마다 다시 계산한다", () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useMemo(() => {
        log.push("compute");
      }, [[]]);
      return createIncrementButton(on, count, setCount);
    });

    click("inc");
    click("inc");

    expect(log).toEqual(["compute", "compute", "compute"]);
  });

  it("F137 async effect는 Error 없이 불리고, Promise가 돌려준 함수는 정리 함수로 불리지 않는다", async () => {
    const { log, click } = mountEffectRoot(({ on }, log) => {
      const [count, setCount] = useState(0);
      useEffect((async () => {
        log.push("effect");
        return () => {
          log.push("cleanup");
        };
      }) as unknown as () => undefined);
      return createIncrementButton(on, count, setCount);
    });

    click("inc");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(log).toEqual(["effect", "effect"]);
  });
});

describe("Error 뒤의 인스턴스 상태", () => {
  it("F140 render가 Error를 던지기 전에 부른 useEffect는 deps를 기록하지 않아, 다음에 성공한 렌더링에서 불린다", () => {
    const container = createContainer();
    const log: string[] = [];
    const control = { fail: false };
    let setCount: StateSetter<number> | undefined;
    const component = new FunctionComponent((): VNode => {
      const [count, setCountOfRender] = useState(0);
      setCount = setCountOfRender;
      useEffect(() => {
        log.push(`effect ${count}`);
      }, [count]);
      if (control.fail) {
        throw new Error("render failed");
      }
      return { type: "p", props: {}, children: [String(count)] };
    });
    component.mount(container);
    control.fail = true;
    expect(() => setCount?.(1)).toThrow("render failed");
    control.fail = false;

    component.update();

    expect(log).toEqual(["effect 0", "effect 1"]);
  });

  it("F141 effect가 Error를 던지면 그 effect와 뒤의 effect는 deps가 같은 동안 다시 불리지 않는다", () => {
    const container = createContainer();
    const log: string[] = [];
    const control = { fail: true };
    const component = new FunctionComponent((): VNode => {
      useEffect(() => {
        log.push("a");
        if (control.fail) {
          throw new Error("a failed");
        }
      }, []);
      useEffect(() => {
        log.push("b");
      }, []);
      return "view";
    });
    expect(() => component.mount(container)).toThrow("a failed");
    control.fail = false;

    component.update();

    expect(log).toEqual(["a"]);
  });

  it("F142 첫 mount()가 render Error로 끝나면 컨테이너는 그대로이고, 같은 인스턴스로 다시 mount()하면 그려지고 update()도 된다", () => {
    const container = createContainer("<i>old</i>");
    const control = { fail: true };
    const component = new FunctionComponent((): VNode => {
      if (control.fail) {
        throw new Error("render failed");
      }
      return "view";
    });
    expect(() => component.mount(container)).toThrow("render failed");
    expect(container.innerHTML).toBe("<i>old</i>");
    expect(() => component.update()).toThrow("update() needs mount() first");
    control.fail = false;

    component.mount(container);

    expect(container.innerHTML).toBe("view");
    expect(() => component.update()).not.toThrow();
  });

  it("F143 Root Component 본문에서 다른 Root Instance를 mount()하면 그 렌더링이 currentComponent를 비워, 본문의 뒤쪽 Hook 호출은 Error다", () => {
    const outer = createContainer();
    const inner = createContainer();
    const component = new FunctionComponent((): VNode => {
      useState(0);
      new FunctionComponent((): VNode => "inner").mount(inner);
      useState(1);
      return "outer";
    });

    expect(() => component.mount(outer)).toThrow(
      "Hooks can only be called while Root Component renders",
    );
    expect(inner.textContent).toBe("inner");
    expect(outer.textContent).toBe("");
  });

  it("F142a 실패한 첫 mount()는 칸도 비우므로, 다시 mount()하면 초깃값 함수를 한 번 더 불러 새 값으로 그린다", () => {
    const container = createContainer();
    const saved: { text: string | undefined } = { text: undefined };
    let initialValueCount = 0;
    const component = new FunctionComponent((): VNode => {
      const [text] = useState(() => {
        initialValueCount++;
        return saved.text;
      });
      if (text === undefined) {
        throw new Error("render failed");
      }
      return text;
    });
    expect(() => component.mount(container)).toThrow("render failed");
    saved.text = "loaded";

    component.mount(container);

    expect(container.textContent).toBe("loaded");
    expect(initialValueCount).toBe(2);
  });
});
