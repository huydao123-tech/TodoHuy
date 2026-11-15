import assert from "node:assert/strict";
import test from "node:test";
import { emptyNoteDoc, entryPlainText, foldText, formatEntryDate, linkHref, plainToDoc, textMatches } from "../lib/brain.ts";

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

test("marks in one paragraph stay on the same line", () => {
  const stored = JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Lấy " },
          { type: "text", marks: [{ type: "bold" }], text: "used_count" },
          { type: "text", text: " < total" },
        ],
      },
      {
        type: "callout",
        attrs: { color: "vang" },
        content: [
          { type: "paragraph", content: [{ type: "text", text: "dòng trong khung" }] },
          { type: "paragraph", content: [{ type: "text", text: "dòng hai" }] },
        ],
      },
    ],
  });
  assert.equal(entryPlainText(stored), "Lấy used_count < total\ndòng trong khung\ndòng hai");
  assert.equal(JSON.parse(emptyNoteDoc()).content[0].type, "paragraph");
  assert.equal(formatEntryDate("2026-10-20"), "Thứ Ba, 20/10/2026");
  assert.equal(linkHref(" https://weekloop.app/note "), "https://weekloop.app/note");
  assert.equal(linkHref("javascript:alert(1)"), null);
});
