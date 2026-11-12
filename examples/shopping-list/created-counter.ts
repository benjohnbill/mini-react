// 클릭 한 번 뒤에 container 안에 새로 들어온 요소의 수를 countOutput에, 태그별 내역을 detailOutput에 적습니다.
// 두 판이 DOM에 한 일을 같은 방법으로 세려고, 판의 코드 밖에서 MutationObserver로 셉니다.
export function startCreatedCounter(
  container: Element,
  countOutput: Element,
  detailOutput: Element,
): void {
  const observer = new MutationObserver((records) => {
    const countByTag = new Map<string, number>();
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) {
          for (const element of [node, ...node.querySelectorAll("*")]) {
            const tag = element.localName;
            countByTag.set(tag, (countByTag.get(tag) ?? 0) + 1);
          }
        }
      }
    }
    let createdCount = 0;
    const details: string[] = [];
    for (const [tag, count] of countByTag) {
      createdCount += count;
      details.push(`${tag} ${count}`);
    }
    countOutput.textContent = `방금 새로 만든 요소: ${createdCount}개`;
    detailOutput.textContent = details.join(", ");
  });
  observer.observe(container, { childList: true, subtree: true });
}
