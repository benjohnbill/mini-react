import {
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from "../function-component";
import { createVNode, type VNode } from "../vnode";

function Greeting(props: { name: string }): VNode {
  return createVNode("p", {}, `안녕, ${props.name}`);
}

function TodoItem(props: { title: string }): VNode {
  return createVNode("li", {}, props.title);
}

function App(): VNode {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");
  const [todos, setTodos] = useState<string[]>([]);

  const parity = useMemo(() => (count % 2 === 0 ? "짝수" : "홀수"), [count]);

  useEffect(() => {
    document.title = `할 일 ${todos.length}개`;
  }, [todos]);

  function applyInputToText(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      setText(event.target.value);
    }
  }

  function pushTodo(): void {
    if (text === "") {
      return;
    }
    setTodos([...todos, text]);
    setText("");
  }

  return createVNode(
    "div",
    {},
    createVNode("h1", {}, "데모"),
    Greeting({ name: "다빈" }),

    createVNode("h2", {}, "카운터"),
    createVNode("p", {}, `눌린 횟수: ${count} (${parity})`),
    createVNode("button", { onClick: () => setCount(count + 1) }, "+1"),

    createVNode("h2", {}, "할 일 목록"),
    createVNode("input", {
      type: "text",
      value: text,
      placeholder: "할 일을 입력하세요",
      onInput: applyInputToText,
    }),
    createVNode("button", { onClick: pushTodo }, "추가"),
    createVNode("p", {}, `총 ${todos.length}개`),
    createVNode("ul", {}, ...todos.map((title) => TodoItem({ title }))),
  );
}

export function startDemoPage(document: Document): void {
  const container = document.getElementById("app");
  if (container === null) {
    throw new Error("#app element is missing");
  }
  new FunctionComponent(App).mount(container);
}
