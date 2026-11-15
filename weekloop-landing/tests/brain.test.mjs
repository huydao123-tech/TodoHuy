import assert from "node:assert/strict";
import test from "node:test";
import { entryPlainText, foldText, plainToDoc, textMatches } from "../lib/brain.ts";

test("search ignores Vietnamese accents and đ", () => {
  assert.equal(foldText("Lập trình"), "lap trinh");
  assert.equal(textMatches("lap trinh", "Ghi chú", "Lập trình Firebase"), true);
  assert.equal(textMatches("kanji", "Học tiếng Nhật", "ngữ pháp"), false);
  assert.equal(textMatches("   ", "bất kỳ"), true);
});

test("a dated entry keeps plain text and reads Tiptap JSON back out", () => {
  const stored = plainToDoc("Học kanji\nN4");
  assert.equal(entryPlainText(stored), "Học kanji\nN4");
  assert.equal(entryPlainText("ghi chú thường"), "ghi chú thường");
  assert.equal(entryPlainText("{không phải json"), "{không phải json");
  const parsed = JSON.parse(stored);
  assert.equal(parsed.type, "doc");
  assert.equal(parsed.content[0].content[0].text, "Học kanji");
});
