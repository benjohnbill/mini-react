import { diffViews } from "../../src/diff";
import { StateHistory } from "../../src/history";
import { applyPatchesToDom } from "../../src/patch";
import { createVNodeFromDom, type VNode } from "../../src/vnode";

const app = document.querySelector("#app");
if (app === null) throw new Error("#app 요소가 필요합니다");
app.innerHTML = `
  <button id="change" type="button">화면 변경</button>
  <button id="back" type="button">뒤로</button>
  <button id="forward" type="button">앞으로</button>
  <p id="position" role="status"></p>
  <div id="view"></div>
  <h2>마지막 Patch</h2><pre id="patches"></pre>
`;

const container = app.querySelector("#view");
const changeButton = document.querySelector("#change");
const backButton = document.querySelector("#back");
const forwardButton = document.querySelector("#forward");
const position = document.querySelector("#position");
const patchOutput = document.querySelector("#patches");
if (
  container === null ||
  !(changeButton instanceof HTMLButtonElement) ||
  !(backButton instanceof HTMLButtonElement) ||
  !(forwardButton instanceof HTMLButtonElement) ||
  position === null ||
  patchOutput === null
) {
  throw new Error("화면 변경과 되돌리기 예제의 HTML 요소가 필요합니다");
}

const history = new StateHistory();
let currentIndex = 0;
let revision = 0;
const initialParagraph = document.createElement("p");
initialParagraph.textContent = "첫 화면";
container.replaceChildren(initialParagraph);
let currentView = createVNodeFromDom(initialParagraph);
history.push(currentView);
patchOutput.textContent = "[]";

const applyView = (newView: VNode): void => {
  const patches = diffViews(currentView, newView);
  applyPatchesToDom(container, patches);
  currentView = newView;
  patchOutput.textContent = JSON.stringify(patches, null, 2);
};

const applyHistoryStatus = (): void => {
  backButton.disabled = !history.canBack();
  forwardButton.disabled = !history.canForward();
  position.textContent = `이력: ${currentIndex + 1} / ${history.size}`;
};

changeButton.addEventListener("click", () => {
  revision++;
  const newView: VNode = {
    type: "p",
    props: {},
    children: [`변경한 화면 ${revision}`],
  };
  applyView(newView);
  history.push(newView);
  currentIndex = history.size - 1;
  applyHistoryStatus();
});
backButton.addEventListener("click", () => {
  const view = history.back();
  if (view === null) return;
  currentIndex--;
  applyView(view);
  applyHistoryStatus();
});
forwardButton.addEventListener("click", () => {
  const view = history.forward();
  if (view === null) return;
  currentIndex++;
  applyView(view);
  applyHistoryStatus();
});
applyHistoryStatus();
