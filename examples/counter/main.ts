import {
  FunctionComponent,
  type RootComponent,
  useState,
} from "../../src/function-component";
import type { VNode } from "../../src/vnode";

const counter: RootComponent = ({ on }): VNode => {
  const [count, setCount] = useState(0);
  on("increment", () => setCount((currentValue) => currentValue + 1));
  on("decrement", () => setCount((currentValue) => currentValue - 1));
  on("reset", () => setCount(0));

  return {
    type: "section",
    props: {},
    children: [
      { type: "p", props: { role: "status" }, children: [`숫자: ${count}`] },
      {
        type: "button",
        props: { type: "button", "data-action": "decrement" },
        children: ["감소"],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "increment" },
        children: ["증가"],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "reset" },
        children: ["초기화"],
      },
    ],
  };
};

const container = document.querySelector("#app");
if (container === null) throw new Error("#app 요소가 필요합니다");
new FunctionComponent(counter).mount(container);
