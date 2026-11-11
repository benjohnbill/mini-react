import {
  FunctionComponent,
  type RootComponent,
  useEffect,
  useMemo,
  useState,
} from "../function-component";
import type { VNode } from "../vnode";

// 버튼 안쪽에 span을 두어, 안쪽 글자를 클릭해도 data-action을 찾는지 함께 보여 줍니다.
const counterRootComponent: RootComponent = ({ on }): VNode => {
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
      {
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
      },
      {
        type: "button",
        props: { type: "button", "data-action": "increment" },
        children: [{ type: "span", props: {}, children: ["늘리기"] }],
      },
    ],
  };
};

export function startDemoPage(page: ParentNode): void {
  const demo = page.querySelector("#demo");
  if (demo === null) {
    throw new Error("Demo page has no #demo");
  }
  new FunctionComponent(counterRootComponent).mount(demo);
}
