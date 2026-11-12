import { addedItem, getItemSum, type Item, initialItems } from "./items";

function createLineFromItem(item: Item): HTMLLIElement {
  const line = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = `${item.name} - ${item.price}원`;
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "삭제";
  const memo = document.createElement("input");
  memo.type = "text";
  memo.placeholder = "메모";
  memo.setAttribute("aria-label", `${item.name} 메모`);
  line.append(label, deleteButton, memo);
  return line;
}

// 비교용 판입니다. 화면은 처음 한 번만 만들고, 클릭마다 바뀌는 곳을 손으로 하나씩 고칩니다.
// 그래서 클릭을 처리하는 곳마다 그 클릭이 바꾸는 곳(줄, 합계, 빈 목록 문구)을 모두 적어야 합니다.
export function startManualShoppingList(container: Element): void {
  const items = [...initialItems];
  const list = document.createElement("ul");
  const sum = document.createElement("p");
  const emptyMessage = document.createElement("p");
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.dataset.action = "add";
  addButton.textContent = "항목 추가";
  list.append(...items.map(createLineFromItem));
  sum.textContent = `합계: ${getItemSum(items)}원`;
  container.replaceChildren(list, sum, emptyMessage, addButton);

  container.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const action = event.target.dataset.action;
    if (action === "add") {
      items.push(addedItem);
      list.append(createLineFromItem(addedItem));
      sum.textContent = `합계: ${getItemSum(items)}원`;
      emptyMessage.textContent = "";
    }
    if (action === "delete") {
      const line = event.target.closest("li");
      if (line === null) return;
      items.splice([...list.children].indexOf(line), 1);
      line.remove();
      sum.textContent = `합계: ${getItemSum(items)}원`;
      emptyMessage.textContent = items.length === 0 ? "목록이 비었어요" : "";
    }
  });
}
