import {
  FunctionComponent,
  type RootComponent,
  useState,
} from "../../src/function-component";
import type { VNode } from "../../src/vnode";
import { startCreatedCounter } from "./created-counter";
import { addedItem, getItemSum, type Item, initialItems } from "./items";
import { startVanillaShoppingList } from "./vanilla";

function createItemLine({ item, index }: { item: Item; index: number }): VNode {
  return {
    type: "li",
    props: {},
    children: [
      { type: "span", props: {}, children: [`${item.name} - ${item.price}원`] },
      {
        type: "button",
        props: { type: "button", "data-action": `delete-${index}` },
        children: ["삭제"],
      },
      {
        type: "input",
        props: {
          type: "text",
          placeholder: "메모",
          "aria-label": `${item.name} 메모`,
        },
        children: [],
      },
    ],
  };
}

const ShoppingListRootComponent: RootComponent = ({ on }): VNode => {
  const [items, setItems] = useState(initialItems);
  on("add", () => setItems((currentItems) => [...currentItems, addedItem]));
  items.forEach((_, index) => {
    on(`delete-${index}`, () =>
      setItems((currentItems) =>
        currentItems.filter((_, itemIndex) => itemIndex !== index),
      ),
    );
  });

  return {
    type: "div",
    props: {},
    children: [
      {
        type: "ul",
        props: {},
        children: items.map((item, index) => createItemLine({ item, index })),
      },
      { type: "p", props: {}, children: [`합계: ${getItemSum(items)}원`] },
      {
        type: "p",
        props: {},
        children: [items.length === 0 ? "목록이 비었어요" : ""],
      },
      {
        type: "button",
        props: { type: "button", "data-action": "add" },
        children: ["항목 추가"],
      },
    ],
  };
};

const vanillaContainer = document.querySelector("#vanilla");
const miniReactContainer = document.querySelector("#mini-react");
const vanillaCreated = document.querySelector("#vanilla-created");
const miniReactCreated = document.querySelector("#mini-react-created");
if (
  vanillaContainer === null ||
  miniReactContainer === null ||
  vanillaCreated === null ||
  miniReactCreated === null
) {
  throw new Error(
    "#vanilla, #mini-react, #vanilla-created, #mini-react-created 요소가 필요합니다",
  );
}
startVanillaShoppingList(vanillaContainer);
new FunctionComponent(ShoppingListRootComponent).mount(miniReactContainer);
startCreatedCounter(vanillaContainer, vanillaCreated);
startCreatedCounter(miniReactContainer, miniReactCreated);
