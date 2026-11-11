// 결정은 ADR에, 그 결정을 지키는 기대값은 테스트에 있어서 한쪽만 바뀌면 어긋납니다.
// 이 검사는 어긋남 중 ID가 끊긴 것만 잡습니다. 뜻이 같은지는 새 세션 리뷰가 봅니다(ADR 0009).
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "src";
const ADR_DIR = "docs/adr";
const BASE_REF = "origin/main";
const TEST_ID = /^[A-Z][A-Z-]*\d+[a-z]?$/;
const TEST_CALL = /\b(it|test)((?:\.\w+)*)\(\s*["'`]([^"'`]*)/g;
const TEST_ID_AT_START = /^([A-Z][A-Z-]*\d+[a-z]?)(?=[\s:]|$)/;
const CITATION_LOOSE = /[(（]\s*테스트\s*[:：]([^)）]*)[)）]/g;
const CITATION_STRICT = /^\(테스트: [^)]*\)$/;
const INLINE_CODE = /`[^`\n]*`/g;
const SUPERSEDED_STATUS = /^status:\s*superseded/m;

function createFileListFromDir(dir, suffix) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => join(entry.parentPath, entry.name));
}

function createTestNamesFromSource(source, file) {
  return [...source.matchAll(TEST_CALL)].map((match) => ({
    id: TEST_ID_AT_START.exec(match[3])?.[1],
    name: match[3],
    file,
    todo: match[2].includes(".todo"),
  }));
}

function createTestIdsFromBaseRef() {
  try {
    const gitOptions = {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    };
    const files = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", BASE_REF, TEST_DIR],
      gitOptions,
    )
      .split("\n")
      .filter((file) => file.endsWith(".test.ts"));
    const testNames = files.flatMap((file) =>
      createTestNamesFromSource(
        execFileSync("git", ["show", `${BASE_REF}:${file}`], gitOptions),
        file,
      ),
    );
    return new Set(testNames.map(({ id }) => id).filter(Boolean));
  } catch {
    return undefined;
  }
}

function createCitationsFromAdrFile(file) {
  // 인라인 코드 안의 인용은 형식을 설명하는 예시이므로 읽지 않습니다.
  const text = readFileSync(file, "utf8").replace(INLINE_CODE, "");
  const superseded = SUPERSEDED_STATUS.test(text);
  return [...text.matchAll(CITATION_LOOSE)].flatMap((match) => {
    const wellFormed = CITATION_STRICT.test(match[0]);
    return match[1]
      .split(",")
      .map((part) => ({ id: part.trim(), file, superseded, wellFormed }));
  });
}

const testNames = createFileListFromDir(TEST_DIR, ".test.ts").flatMap((file) =>
  createTestNamesFromSource(readFileSync(file, "utf8"), file),
);
const testIdList = testNames.map(({ id }) => id).filter(Boolean);
const testIds = new Set(testIdList);
const todoIds = new Set(
  testNames.filter(({ todo }) => todo).map(({ id }) => id),
);
const citations = createFileListFromDir(ADR_DIR, ".md").flatMap(
  createCitationsFromAdrFile,
);

const duplicatedIds = [
  ...new Set(
    testIdList.filter((id, index) => testIdList.indexOf(id) !== index),
  ),
];
const malformedCitations = citations.filter(
  ({ id, wellFormed }) => !wellFormed || !TEST_ID.test(id),
);
const missingCitations = citations.filter(
  ({ id, wellFormed }) => wellFormed && TEST_ID.test(id) && !testIds.has(id),
);
const todoCitations = citations.filter(({ id }) => todoIds.has(id));
const liveIds = new Set(
  citations.filter(({ superseded }) => !superseded).map(({ id }) => id),
);
const supersededOnlyIds = [
  ...new Set(
    citations
      .filter(
        ({ id, superseded }) =>
          superseded && testIds.has(id) && !liveIds.has(id),
      )
      .map(({ id }) => id),
  ),
];
const citedIds = new Set(
  citations.map(({ id }) => id).filter((id) => testIds.has(id)),
);
const uncitedCount = [...testIds].filter((id) => !citedIds.has(id)).length;
const namesWithoutId = testNames.filter(({ id }) => id === undefined);

console.log(
  `결정 인용 검사: 테스트 ${testIds.size}개, ADR이 인용한 테스트 ${citedIds.size}개, 인용되지 않은 테스트 ${uncitedCount}개`,
);
if (duplicatedIds.length > 0) {
  console.log(
    `[실패] 두 테스트가 같은 ID를 씁니다: ${duplicatedIds.join(", ")}`,
  );
}
for (const { id, file } of malformedCitations) {
  console.log(
    `[실패] ${file}: "${id}" 인용의 형식이 "(테스트: T9, T26)"과 다릅니다`,
  );
}
for (const { id, file } of missingCitations) {
  console.log(`[실패] ${file}: 테스트에 없는 ID를 인용했습니다: ${id}`);
}
for (const { id, file } of todoCitations) {
  console.log(`[확인] ${file}: 아직 it.todo인 테스트를 인용했습니다: ${id}`);
}
if (supersededOnlyIds.length > 0) {
  console.log(
    `[확인] 대체된 ADR만 인용하는 테스트: ${supersededOnlyIds.join(", ")}`,
  );
}
for (const { name, file } of namesWithoutId) {
  console.log(`[확인] ${file}: ID로 시작하지 않는 테스트 "${name}"`);
}

const baseTestIds = createTestIdsFromBaseRef();
if (baseTestIds === undefined) {
  console.log(
    `[건너뜀] ${BASE_REF}을 읽지 못해 새 테스트 목록을 만들지 않았습니다`,
  );
} else {
  const newUncitedIds = [...testIds].filter(
    (id) => !baseTestIds.has(id) && !citedIds.has(id),
  );
  if (newUncitedIds.length > 0) {
    console.log(
      `[확인] ${BASE_REF} 이후 새로 생겼고 어느 ADR도 인용하지 않은 테스트: ${newUncitedIds.join(", ")}`,
    );
  }
}

if (
  duplicatedIds.length > 0 ||
  malformedCitations.length > 0 ||
  missingCitations.length > 0
) {
  process.exitCode = 1;
}
