import { createDom, type VNode } from "./vdom";

const newNode: VNode = { type: "b", props: {}, children: ["new"] };

const view: VNode = {
  type: "ul",
  props: { id: "list" },
  children: [
    { type: "li", props: {}, children: ["milk"] },
    { type: "li", props: {}, children: ["bread", newNode] },
  ],
};

const app = document.querySelector("#app");
if (!app) throw new Error("There's no element in #app");
app.append(createDom(view));
