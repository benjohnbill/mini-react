import {
  FunctionComponent,
  type RootComponent,
  useState,
} from "../../../src/function-component";
import type { VNode } from "../../../src/vnode";

function createCountLine({ count }: { count: number }): VNode {
  return { type: "p", props: { role: "status" }, children: [`숫자: ${count}`] };
}

const counter: RootComponent = ({ on }): VNode => {
  const [count, setCount] = useState(0);
  on("increment", () => setCount((currentValue) => currentValue + 1));
  return {
    type: "section",
    props: {},
    children: [
      createCountLine({ count }),
      {
        type: "button",
        props: { type: "button", "data-action": "increment" },
        children: ["증가"],
      },
    ],
  };
};

const container = document.querySelector("#app");
if (container === null) throw new Error("#app 요소가 필요합니다");
container.innerHTML = `
  <h2>첫 번째 카운터</h2><div id="first"></div>
  <h2>두 번째 카운터</h2><div id="second"></div>
`;

const firstContainer = container.querySelector("#first");
const secondContainer = container.querySelector("#second");
if (firstContainer === null || secondContainer === null) {
  throw new Error("#first, #second 요소가 필요합니다");
}
new FunctionComponent(counter).mount(firstContainer);
new FunctionComponent(counter).mount(secondContainer);
