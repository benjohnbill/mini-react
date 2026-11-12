import { addedItem, getItemSum, initialItems } from "./items";

// 비교용 판입니다. 클릭마다 container의 내용을 처음부터 다시 만듭니다.
// 그래서 입력란에 친 글자와 버튼의 포커스처럼 DOM이 가진 상태가 사라집니다.
export function startVanillaShoppingList(container: Element): void {
  const items = [...initialItems];

  function render(): void {
    const lines = items
      .map(
        (item, index) => `
          <li>
            <span>${item.name} - ${item.price}원</span>
            <button type="button" data-action="delete" data-index="${index}">삭제</button>
            <input type="text" placeholder="메모" aria-label="${item.name} 메모" />
          </li>`,
      )
      .join("");
    container.innerHTML = `
      <ul>${lines}</ul>
      <p>합계: ${getItemSum(items)}원</p>
      <p>${items.length === 0 ? "목록이 비었어요" : ""}</p>
      <button type="button" data-action="add">항목 추가</button>`;
  }

  container.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const action = event.target.dataset.action;
    if (action === "add") {
      items.push(addedItem);
      render();
    }
    if (action === "delete") {
      items.splice(Number(event.target.dataset.index), 1);
      render();
    }
  });

  render();
}
