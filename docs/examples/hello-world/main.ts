import { FunctionComponent } from "../../../src/function-component";

const container = document.querySelector("#app");
if (container === null) {
  throw new Error("#app 요소가 필요합니다");
}

new FunctionComponent(() => "Hello World").mount(container);
