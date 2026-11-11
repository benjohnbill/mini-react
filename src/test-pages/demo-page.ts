import {
  FunctionComponent,
  type RootComponent,
  useEffect,
  useMemo,
  useState,
} from "../function-component";
import type { VNode } from "../vnode";

// 자식 Component: 상태 없이 props로 받은 숫자와 짝수/홀수를 그립니다.
function createCountLine({
  count,
  parity,
}: {
  count: number;
  parity: string;
}): VNode {
  return {
    type: "p",
    props: {},
    children: [
      "숫자: ",
      {
        type: "strong",
        props: { id: "demo-count" },
        children: [String(count)],
      },
      " (",
      { type: "span", props: { id: "demo-parity" }, children: [parity] },
      ")",
    ],
  };
}

// 자식 Component: 클릭을 알릴 data-action 이름만 받습니다. 함수는 Root Component가 on으로 등록합니다.
// 버튼 안쪽에 span을 두어, 안쪽 글자를 클릭해도 data-action을 찾는지 함께 보여 줍니다.
function createActionButton({
  actionName,
  label,
}: {
  actionName: string;
  label: string;
}): VNode {
  return {
    type: "button",
    props: { type: "button", "data-action": actionName },
    children: [{ type: "span", props: {}, children: [label] }],
  };
}

const CounterRootComponent: RootComponent = ({ on }): VNode => {
  const [count, setCount] = useState(0);
  const parity = useMemo(() => (count % 2 === 0 ? "짝수" : "홀수"), [count]);
  useEffect(() => {
    document.title = `숫자 ${count}`;
  }, [count]);
  on("increment", () => setCount(count + 1));
  return {
    type: "div",
    props: {},
    children: [
      createCountLine({ count, parity }),
      createActionButton({ actionName: "increment", label: "늘리기" }),
    ],
  };
};

export function startDemoPage(page: ParentNode): void {
  const demo = page.querySelector("#demo");
  if (demo === null) {
    throw new Error("Demo page has no #demo");
  }
  new FunctionComponent(CounterRootComponent).mount(demo);
}
