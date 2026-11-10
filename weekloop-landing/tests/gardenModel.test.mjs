import assert from "node:assert/strict";
import test from "node:test";
import {
  cycleStatus,
  moodFor,
  shiftWeek,
  speciesForGroup,
  visibleGroups,
  weekCounts,
  weekLabel,
} from "../lib/garden/model.ts";

test("species follows the live task names", () => {
  assert.equal(speciesForGroup("Tiếng nhật"), "fox");
  assert.equal(speciesForGroup("thiết kế nghiệp vụ kiến nest"), "ant");
  assert.equal(speciesForGroup("FPT"), "penguin");
  assert.equal(speciesForGroup("học cách chiến đấu"), "tiger");
  assert.equal(speciesForGroup("Học bằng lái xe"), "dog");
  assert.equal(speciesForGroup("Tiếng Anh"), "parrot");
  assert.equal(speciesForGroup("học nấu ăn"), "cook");
  assert.equal(speciesForGroup("cờ vua"), "chesscat");
  assert.equal(speciesForGroup("Thú vui"), "tanuki");
  assert.equal(speciesForGroup("Nghiên cứu đh nhật"), "crane");
  assert.equal(speciesForGroup("Page MBTI"), "moth");
  assert.equal(speciesForGroup("việc lạ"), "hare");
});

test("university research is a crane, not the Japanese fox", () => {
  assert.equal(speciesForGroup("Nghiên cứu đh nhật"), "crane");
});

test("mood follows the week's items", () => {
  assert.equal(moodFor([]), "sleep");
  assert.equal(moodFor([{ status: "DONE" }, { status: "DONE" }]), "sleep");
  assert.equal(moodFor([{ status: "TODO" }]), "wait");
  assert.equal(moodFor([{ status: "TODO" }, { status: "IN_PROGRESS" }]), "work");
});

test("archived groups stay out unless this week still has work", () => {
  const groups = [
    { id: "a", name: "Mở", color: "#111", displayOrder: 2, isArchived: false },
    { id: "b", name: "Cất", color: "#222", displayOrder: 1, isArchived: true },
    { id: "c", name: "Cất nhưng còn việc", color: "#333", displayOrder: 3, isArchived: true },
  ];
  const works = [
    {
      id: "w",
      taskGroupId: "c",
      weekStartDate: "2026-11-09",
      content: "đăng video",
      status: "IN_PROGRESS",
      note: "",
    },
  ];
  const visible = visibleGroups(groups, works, "2026-11-09");
  assert.deepEqual(
    visible.map((group) => group.id),
    ["a", "c"]
  );
});

test("week counts and shifting stay on Mondays", () => {
  const works = [
    { id: "1", taskGroupId: "a", weekStartDate: "2026-11-09", content: "a", status: "TODO", note: "" },
    { id: "2", taskGroupId: "a", weekStartDate: "2026-11-09", content: "b", status: "IN_PROGRESS", note: "" },
    { id: "3", taskGroupId: "a", weekStartDate: "2026-11-02", content: "c", status: "DONE", note: "" },
  ];
  assert.deepEqual(weekCounts(works, "2026-11-09"), { todo: 1, doing: 1, done: 0, total: 2 });
  assert.equal(shiftWeek("2026-11-09", 1), "2026-11-16");
  assert.equal(shiftWeek("2026-11-09", -1), "2026-11-02");
  assert.equal(weekLabel("2026-11-09"), "9 thg 11 – 15 thg 11");
  assert.equal(cycleStatus("TODO"), "IN_PROGRESS");
  assert.equal(cycleStatus("IN_PROGRESS"), "DONE");
  assert.equal(cycleStatus("DONE"), "TODO");
});

test("note category changes keep the cover and icon", async () => {
  const { parseNoteColor, withNoteCategory, filterNotes } = await import("../lib/garden/model.ts");
  assert.deepEqual(parseNoteColor("sky:Học tập:🎯"), { cover: "sky", category: "Học tập", icon: "🎯" });
  assert.deepEqual(parseNoteColor("stone"), { cover: "stone", category: "Ý tưởng", icon: "📝" });
  assert.equal(withNoteCategory("sky:Học tập:🎯", "Dự án"), "sky:Dự án:🎯");
  const notes = [
    { title: "Cờ", content: "khai cuộc", color: "stone:Học tập:📝", updatedAt: "2026-11-01T00:00:00Z" },
    { title: "Mua đồ", content: "bóng đèn", color: "stone:Cá nhân:📝", updatedAt: "2026-11-05T00:00:00Z" },
  ];
  assert.deepEqual(filterNotes(notes, "", null).map((n) => n.title), ["Mua đồ", "Cờ"]);
  assert.deepEqual(filterNotes(notes, "KHAI", null).map((n) => n.title), ["Cờ"]);
  assert.deepEqual(filterNotes(notes, "", "Cá nhân").map((n) => n.title), ["Mua đồ"]);
});

test("resources group by yard order with loose ones last", async () => {
  const { groupResources, normalizeLink, isWebLink } = await import("../lib/garden/model.ts");
  const groups = [
    { id: "b", name: "B", color: "#111", displayOrder: 2, isArchived: false },
    { id: "a", name: "A", color: "#111", displayOrder: 1, isArchived: false },
  ];
  const resources = [
    { id: "1", taskGroupId: "b" },
    { id: "2", taskGroupId: null },
    { id: "3", taskGroupId: "a" },
    { id: "4", taskGroupId: "gone" },
  ];
  const sections = groupResources(resources, groups);
  assert.deepEqual(sections.map((s) => s.name), ["A", "B", "Chung"]);
  assert.deepEqual(sections[2].items.map((r) => r.id), ["2", "4"]);
  assert.equal(normalizeLink(" example.com/a "), "https://example.com/a");
  assert.equal(normalizeLink("http://x.vn"), "http://x.vn");
  assert.equal(normalizeLink("tủ sách ở nhà"), "tủ sách ở nhà");
  assert.equal(isWebLink("javascript:alert(1)"), false);
});

test("staff are the week's tasks, busiest first, three at most", async () => {
  const { staffFor } = await import("../lib/garden/model.ts");
  assert.deepEqual(staffFor([]), ["sleep"]);
  assert.deepEqual(staffFor([{ status: "DONE" }, { status: "TODO" }, { status: "IN_PROGRESS" }]), ["work", "wait", "sleep"]);
  assert.deepEqual(
    staffFor([{ status: "TODO" }, { status: "TODO" }, { status: "TODO" }, { status: "IN_PROGRESS" }]),
    ["work", "wait", "wait"]
  );
});
