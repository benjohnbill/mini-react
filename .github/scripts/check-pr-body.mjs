// Fails when the PR body does not follow .github/pull_request_template.md.
// It checks that the required parts exist. People judge their quality in review.

const REQUIRED_SECTIONS = [
  "변경 요약",
  "구조 변화",
  "검증",
  "논의할 점",
  "작성자 확인",
];
const NO_CHANGE = "없음";

/** Returns a map of H2 title to section text. A "## " line in a code block is not a title. */
export function parseSections(body) {
  const sections = new Map();
  let title = null;
  let inFence = false;

  for (const line of body.replace(/<!--[\s\S]*?-->/g, "").split(/\r?\n/)) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    const heading = inFence ? null : line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      title = heading[1];
      sections.set(title, "");
    } else if (title !== null) {
      sections.set(title, `${sections.get(title)}${line}\n`);
    }
  }
  return sections;
}

/** Returns one Korean message for each failed rule. An empty list means the body passes. */
export function findProblems(body) {
  const sections = parseSections(body);
  const problems = REQUIRED_SECTIONS.filter((name) => !sections.has(name)).map(
    (name) => `"${name}" 섹션이 없습니다.`,
  );

  const summary = sections.get("변경 요약");
  if (summary !== undefined && !/^\s*```/m.test(summary)) {
    problems.push('"변경 요약"에 코드 블록(diff 또는 코드 조각)이 없습니다.');
  }

  const structure = sections.get("구조 변화");
  if (
    structure !== undefined &&
    !/^\s*```mermaid\s*$/m.test(structure) &&
    !structure.includes(NO_CHANGE)
  ) {
    problems.push(
      `"구조 변화"에 mermaid 코드 블록 또는 "${NO_CHANGE}"이 없습니다.`,
    );
  }

  return problems;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const problems = findProblems(process.env.PR_BODY ?? "");
  for (const problem of problems) {
    console.error(`::error::${problem}`);
  }
  process.exitCode = problems.length > 0 ? 1 : 0;
}
