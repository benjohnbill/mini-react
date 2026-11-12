import {
  FunctionComponent,
  type RootComponent,
  useEffect,
  useState,
} from "../../src/function-component";
import type { VNode } from "../../src/vnode";

const theme: RootComponent = ({ on }): VNode => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, [isDark]);
  on("toggle", () => setIsDark((currentValue) => !currentValue));

  return {
    type: "section",
    props: {},
    children: [
      {
        type: "p",
        props: { role: "status" },
        children: [`현재 테마: ${isDark ? "어두움" : "밝음"}`],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "toggle" },
        children: ["테마 전환"],
      },
    ],
  };
};

const container = document.querySelector("#app");
if (container === null) throw new Error("#app 요소가 필요합니다");
new FunctionComponent(theme).mount(container);
