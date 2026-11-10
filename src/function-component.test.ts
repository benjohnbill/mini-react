// 테스트는 #30의 seam A로 확인합니다. 입구는 mount와 data-action 요소의 click이고, 출구는 컨테이너 DOM과 함수가 불린 횟수입니다.
// 예외: Hook 호출 위치(F15, F43~F45), mount 전 update()(F7), 첫 렌더링에서 잡아 둔 오래된 setter(F38, F40)는 그 호출 자체가 대상이므로 useState, setter, update()를 직접 부릅니다.
// 테스트 ID FN의 N은 #30 표의 행 번호입니다. 같은 행의 두 번째 테스트는 F104a처럼 소문자를 붙입니다.
import { describe, expect, it } from "vitest";
import {
  FunctionComponent,
  type RootComponent,
  type RootComponentProps,
  type StateSetter,
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

  // 같은 인스턴스에 mount를 두 번 부르면 리스너가 두 개 붙습니다. 어떻게 할지 정해진 근거가 없습니다.
  it.todo("F6 근거 없음: 같은 인스턴스에 mount를 두 번 부르면 Error");
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

  // 두 Root Instance가 서로 다른 컨테이너에 있을 때 서로 섞이지 않아야 하는지 정해진 근거가 없습니다.
  it.todo(
    "F14 근거 없음: Root Instance 두 개를 mount하고 한쪽만 클릭하면 그쪽만 바뀐다",
  );

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

  it.todo(
    "F26 근거 없음: 갱신 함수가 Error를 던지면 Error가 나가고 칸과 화면과 렌더링 횟수는 그대로다",
  );

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

  it.todo("F39 근거 없음: setter는 렌더링마다 같은 함수 객체다");

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

  it.todo(
    "F41 근거 없음: Root Component 본문에서 setter를 새 값으로 부르면 Error",
  );

  it.todo(
    "F42 근거 없음: 조건에 따라 useState를 건너뛰면 칸이 밀리는 결과를 보인다",
  );
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

  it.todo(
    "F34 근거 없음: 같은 배열을 고쳐 넘긴 뒤 다른 칸을 바꾸면 고쳐 둔 배열이 늦게 나타난다",
  );
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

  it.todo(
    "F46 effect 함수 안에서 useState를 부르면 Error (useEffect 티켓 #34 뒤에 쓴다)",
  );

  it.todo(
    "F47 렌더링 밖에서 useEffect와 useMemo를 부르면 각각 Error (티켓 #34와 #35 뒤에 쓴다)",
  );

  it.todo(
    "F48 근거 없음: useMemo의 계산 함수 안에서 useState를 부르면 칸을 하나 쓴다 (티켓 #35 뒤에 쓴다)",
  );
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

  it.todo(
    "F51 근거 없음: 버튼 안의 글자 노드를 대상으로 click 이벤트를 보내면 부모 요소에서 찾아 함수가 한 번 불린다",
  );

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

  it.todo('F54 근거 없음: data-action=""을 클릭하면 아무 일도 일어나지 않는다');

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

  it.todo(
    "F61 근거 없음: 한 렌더링에서 같은 이름을 두 번 등록하면 나중에 등록한 함수만 불린다",
  );

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

  it.todo("F64 근거 없음: 클릭 함수나 effect 안에서 잡아 둔 on을 부르면 Error");

  it.todo(
    "F65 근거 없음: 클릭 함수가 Error를 던진 뒤 다른 버튼 클릭도 정상으로 처리된다",
  );

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
