// ADR 항목이 인용한 테스트 ID와 실제 테스트 이름이 이어져 있는지 확인합니다.
// 뜻이 같은지는 보지 않습니다. 그 일은 PR의 새 세션 리뷰가 맡습니다(ADR 0009).
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = "src";
const ADR_DIR = "docs/adr";
const BASE_REF = "origin/main";
const TEST_ID_PATTERN = /^[A-Z][A-Z-]*\d+[a-z]?$/;
const TEST_NAME = /\b(?:it|test)(?:\.\w+)?\(\s*["'`]([A-Z][A-Z-]*\d+[a-z]?) /g;
const CITATION = /\(테스트: ([^)]*)\)/g;
const SUPERSEDED_STATUS = /^status:\s*superseded/m;

function createFileList(dir, suffix) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => join(entry.parentPath, entry.name));
}

function createTestIdList(sources) {
  return sources.flatMap((source) =>
    [...source.matchAll(TEST_NAME)].map((match) => match[1]),
  );
}

function createBaseTestIds() {
  try {
    const files = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", BASE_REF, TEST_DIR],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .split("\n")
      .filter((file) => file.endsWith(".test.ts"));
    const sources = files.map((file) =>
      execFileSync("git", ["show", `${BASE_REF}:${file}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
    return new Set(createTestIdList(sources));
  } catch {
    return undefined;
  }
}

function createCitations(adrFiles) {
  const citations = [];
  for (const file of adrFiles) {
    const text = readFileSync(file, "utf8");
    const superseded = SUPERSEDED_STATUS.test(text);
    for (const match of text.matchAll(CITATION)) {
      for (const id of match[1].split(",").map((part) => part.trim())) {
        citations.push({ id, file, superseded });
      }
    }
  }
  return citations;
}

const testSources = createFileList(TEST_DIR, ".test.ts").map((file) =>
  readFileSync(file, "utf8"),
);
const testIdList = createTestIdList(testSources);
const testIds = new Set(testIdList);
const duplicated = [
  ...new Set(
    testIdList.filter((id, index) => testIdList.indexOf(id) !== index),
  ),
];
const citations = createCitations(createFileList(ADR_DIR, ".md"));

const malformed = citations.filter(({ id }) => !TEST_ID_PATTERN.test(id));
const missing = citations.filter(
  ({ id }) => TEST_ID_PATTERN.test(id) && !testIds.has(id),
);
const liveIds = new Set(
  citations.filter(({ superseded }) => !superseded).map(({ id }) => id),
);
const supersededOnly = [
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

console.log(
  `결정 인용 검사: 테스트 ${testIds.size}개, ADR이 인용한 테스트 ${citedIds.size}개, 인용되지 않은 테스트 ${uncitedCount}개`,
);
if (duplicated.length > 0) {
  console.log(`[실패] 두 테스트가 같은 ID를 씁니다: ${duplicated.join(", ")}`);
}
for (const { id, file } of malformed) {
  console.log(`[실패] ${file}: "${id}"는 테스트 ID 형식이 아닙니다`);
}
for (const { id, file } of missing) {
  console.log(`[실패] ${file}: 인용한 ${id}가 테스트에 없습니다`);
}
if (supersededOnly.length > 0) {
  console.log(
    `[확인] 대체된 ADR만 인용하는 테스트: ${supersededOnly.join(", ")}`,
  );
}

const baseTestIds = createBaseTestIds();
if (baseTestIds === undefined) {
  console.log(
    `[건너뜀] ${BASE_REF}을 읽지 못해 새 테스트 목록을 만들지 않았습니다`,
  );
} else {
  const newUncited = [...testIds].filter(
    (id) => !baseTestIds.has(id) && !citedIds.has(id),
  );
  if (newUncited.length > 0) {
    console.log(
      `[확인] ${BASE_REF} 이후 새로 생겼고 어느 ADR도 인용하지 않은 테스트: ${newUncited.join(", ")}`,
    );
  }
}

if (duplicated.length > 0 || malformed.length > 0 || missing.length > 0) {
  process.exitCode = 1;
}
