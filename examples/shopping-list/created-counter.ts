// 클릭 한 번 뒤에 container 안에 새로 들어온 요소의 수를 output에 적습니다.
// 두 판이 DOM에 한 일을 같은 방법으로 세려고, 판의 코드 밖에서 MutationObserver로 셉니다.
export function startCreatedCounter(container: Element, output: Element): void {
  const observer = new MutationObserver((records) => {
    let createdCount = 0;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          createdCount += 1 + node.querySelectorAll("*").length;
        }
      }
    }
    output.textContent = `방금 새로 만든 요소: ${createdCount}개`;
  });
  observer.observe(container, { childList: true, subtree: true });
}
