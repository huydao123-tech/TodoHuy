import assert from "node:assert/strict";
import test from "node:test";
import { foldText, textMatches } from "../lib/brain.ts";

test("search ignores Vietnamese accents and đ", () => {
  assert.equal(foldText("Lập trình"), "lap trinh");
  assert.equal(textMatches("lap trinh", "Ghi chú", "Lập trình Firebase"), true);
  assert.equal(textMatches("kanji", "Học tiếng Nhật", "ngữ pháp"), false);
});
