import {
  FunctionComponent,
  type RootComponent,
  useMemo,
  useState,
} from "../../../src/function-component";
import type { VNode } from "../../../src/vnode";

// 계산 횟수를 눈으로 확인하기 위한 기록이며, 화면 갱신은 State가 담당합니다.
let computationCount = 0;

const memo: RootComponent = ({ on }): VNode => {
  const [number, setNumber] = useState(3);
  const [count, setCount] = useState(0);
  const square = useMemo(() => {
    computationCount++;
    return number * number;
  }, [number]);
  on("number", () => setNumber((currentValue) => currentValue + 1));
  on("count", () => setCount((currentValue) => currentValue + 1));

  return {
    type: "section",
    props: {},
    children: [
      {
        type: "p",
        props: { role: "status" },
        children: [`${number} × ${number} = ${square}`],
      },
      {
        type: "p",
        props: { id: "computations" },
        children: [`계산 실행: ${computationCount}회`],
      },
      {
        type: "p",
        props: { id: "unrelated" },
        children: [`별도 카운터: ${count}`],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "number" },
        children: ["계산 입력값 증가"],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "count" },
        children: ["별도 카운터 증가"],
      },
    ],
  };
};

const container = document.querySelector("#app");
if (container === null) throw new Error("#app 요소가 필요합니다");
new FunctionComponent(memo).mount(container);
