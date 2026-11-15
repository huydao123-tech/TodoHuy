import assert from "node:assert/strict";
import test from "node:test";
import {
  attachGroupToVision,
  detachGroupFromVision,
  exclusiveVisions,
  excludedWeeksForGroup,
  formatHorizonDate,
  groupsForVisionFilter,
  groupsInVision,
  normalizeHorizon,
  normalizeTaskGroupIds,
  normalizeVisionStatus,
  parseVisionDraft,
  plannerWeekOffsets,
  sortVisions,
  stripGroupFromVisions,
  unassignedGroups,
  visionOwningGroup,
  visiblePlannerTasks,
  weekProgress,
  workItemsByWeek,
} from "../lib/visions.ts";

const japan = {
  id: "japan",
  title: "Du học Nhật",
  outcome: "",
  horizon: "tháng 4/2027",
  status: "active",
  displayOrder: 1,
  taskGroupIds: ["jp"],
};

const health = {
  id: "health",
  title: "Sức khỏe",
  outcome: "",
  horizon: "",
  status: "active",
  displayOrder: 2,
  taskGroupIds: ["gym"],
};

test("a vision draft needs a title and stores the horizon as a real date", () => {
  assert.equal(parseVisionDraft({ title: "   " }).ok, false);
  assert.equal(parseVisionDraft({ title: "Du học Nhật", horizon: "tháng 4/2027" }).ok, false);
  assert.equal(parseVisionDraft({ title: "Du học Nhật", horizon: "2027-02-31" }).ok, false);
  assert.equal(normalizeHorizon("2027-04-15"), "2027-04-15");
  const parsed = parseVisionDraft({ title: "  Du học Nhật  ", outcome: "  nhập học  ", horizon: "2027-04-15" });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.draft, { title: "Du học Nhật", outcome: "nhập học", horizon: "2027-04-15" });
  }
  const openEnded = parseVisionDraft({ title: "Du học Nhật", horizon: "   " });
  assert.equal(openEnded.ok && openEnded.draft.horizon, "");
});

test("the vision list keeps only open tasks from the three planner weeks", () => {
  const map = {
    "jp:-2": [{ content: "tuần đã khuất", status: "TODO" }],
    "jp:-1": [
      { content: "tuần trước còn làm", status: "TODO" },
      { content: "tuần trước đã xong", status: "DONE" },
    ],
    "jp:0": [
      { content: "tuần này", status: "IN_PROGRESS" },
      { content: "tuần này đã xong", status: "DONE" },
    ],
    "jp:1": [{ content: "tuần sau đã gỡ khỏi planner", status: "TODO" }],
    "jp:2": [{ content: "ngoài planner", status: "TODO" }],
  };
  const shown = visiblePlannerTasks("jp", map, { viewOffset: 0, excludedWeeks: [1] });
  assert.deepEqual(
    shown.map((week) => [week.weekOffset, week.items.map((item) => item.content)]),
    [
      [-1, ["tuần trước còn làm"]],
      [0, ["tuần này"]],
    ],
  );
});

test("attaching a group exposes every saved week of its tasks", () => {
  const weeks = workItemsByWeek("jp", {
    "jp:1": [{ content: "tuần sau", status: "TODO" }],
    "jp:-1": [{ content: "tuần trước", status: "DONE" }],
    "jp:0": [{ content: "tuần này", status: "TODO" }, { content: "thêm", status: "DONE" }],
    "gym:0": [{ content: "nhóm khác", status: "TODO" }],
    "jp:soon": [{ content: "không phải tuần", status: "TODO" }],
  });
  assert.deepEqual(weeks.map((week) => week.weekOffset), [-1, 0, 1]);
  assert.deepEqual(weeks[1].items.map((item) => item.content), ["tuần này", "thêm"]);
});

test("attaching a group to a vision removes it from every other vision", () => {
  const result = attachGroupToVision([japan, health], "japan", "gym");
  assert.equal(result.movedFromId, "health");
  assert.deepEqual(result.changedIds, ["japan", "health"]);
  const nextJapan = result.next.find((vision) => vision.id === "japan");
  const nextHealth = result.next.find((vision) => vision.id === "health");
  assert.deepEqual(nextJapan?.taskGroupIds, ["jp", "gym"]);
  assert.deepEqual(nextHealth?.taskGroupIds, []);
  assert.equal(visionOwningGroup(result.next, "gym")?.id, "japan");
});

test("attaching a group that is already on the vision does nothing", () => {
  const visions = [japan, health];
  const result = attachGroupToVision(visions, "japan", "jp");
  assert.equal(result.next, visions);
  assert.deepEqual(result.changedIds, []);
  assert.equal(result.movedFromId, null);
});

test("detaching a group leaves the group available and keeps the other groups", () => {
  const result = detachGroupFromVision([japan], "japan", "jp");
  assert.deepEqual(result.next[0].taskGroupIds, []);
  assert.deepEqual(unassignedGroups(result.next, [{ id: "jp" }, { id: "gym" }]).map((group) => group.id), ["jp", "gym"]);
});

test("permanent removal strips the group from every vision", () => {
  const duplicated = [{ ...japan, taskGroupIds: ["jp", "gym"] }, health];
  const result = stripGroupFromVisions(duplicated, "gym");
  assert.deepEqual(result.changedIds, ["japan", "health"]);
  assert.deepEqual(result.next.map((vision) => vision.taskGroupIds), [["jp"], []]);
});

test("exclusive ownership keeps the active vision when a group was stored twice", () => {
  const paused = { ...health, id: "old", status: "paused", displayOrder: 0, taskGroupIds: ["jp", "gym"] };
  const active = { ...japan, taskGroupIds: ["jp"] };
  const cleaned = exclusiveVisions([paused, active]);
  assert.deepEqual(cleaned.find((vision) => vision.id === "japan")?.taskGroupIds, ["jp"]);
  assert.deepEqual(cleaned.find((vision) => vision.id === "old")?.taskGroupIds, ["gym"]);
});

test("the planner filter only hides groups and never renames them", () => {
  const groups = [
    { id: "jp", name: "Tiếng Nhật" },
    { id: "gym", name: "Thể hình" },
  ];
  const visions = [{ id: "study", taskGroupIds: ["jp"] }];
  assert.deepEqual(groupsForVisionFilter(groups, visions, "all"), groups);
  assert.deepEqual(groupsForVisionFilter(groups, visions, "missing"), groups);
  assert.deepEqual(groupsForVisionFilter(groups, visions, "study").map((group) => group.name), ["Tiếng Nhật"]);
});

test("groups inside a vision follow the weekly display order", () => {
  const vision = { taskGroupIds: ["b", "a", "missing"] };
  const groups = [
    { id: "b", displayOrder: 2 },
    { id: "a", displayOrder: 1 },
    { id: "c", displayOrder: 0 },
  ];
  assert.deepEqual(groupsInVision(vision, groups).map((group) => group.id), ["a", "b"]);
  assert.deepEqual(unassignedGroups([vision], groups).map((group) => group.id), ["c"]);
});

test("unknown vision status falls back to active and ids are deduped", () => {
  assert.equal(normalizeVisionStatus("paused"), "paused");
  assert.equal(normalizeVisionStatus("nope"), "active");
  assert.deepEqual(normalizeTaskGroupIds([" jp ", "jp", "", null, "gym"]), ["jp", "gym"]);
  assert.deepEqual(normalizeTaskGroupIds("jp"), []);
});

test("a horizon date formats for display and rejects text", () => {
  assert.equal(formatHorizonDate("2027-04-15", "vi-VN"), "15/4/2027");
  assert.equal(formatHorizonDate("tháng 4/2027", "vi-VN"), "");
  assert.equal(normalizeHorizon("2027-04-31"), "");
});

test("visions sort active first, then by display order", () => {
  const sorted = sortVisions([
    { id: "done", status: "achieved", displayOrder: 0 },
    { id: "later", status: "active", displayOrder: 2 },
    { id: "paused", status: "paused", displayOrder: 0 },
    { id: "first", status: "active", displayOrder: 1 },
  ]);
  assert.deepEqual(sorted.map((vision) => vision.id), ["first", "later", "paused", "done"]);
});

test("planner weeks follow the viewed week and remember groups removed from a week", () => {
  assert.deepEqual(plannerWeekOffsets(3), [2, 3, 4]);
  assert.deepEqual(excludedWeeksForGroup("jp", { 0: ["gym"], 1: ["jp", "gym"], 2: [] }), [1]);
  assert.deepEqual(excludedWeeksForGroup(12, { "-1": [12] }), [-1]);
});

test("attaching to a missing vision leaves every list untouched", () => {
  const visions = [japan];
  const result = attachGroupToVision(visions, "missing", "gym");
  assert.equal(result.next, visions);
  assert.deepEqual(result.changedIds, []);
});

test("week progress counts only the groups that belong to the vision", () => {
  const progress = weekProgress(["jp", "ielts"], {
    "jp:0": [{ status: "DONE" }, { status: "TODO" }],
    "ielts:0": [{ status: "DONE" }],
    "gym:0": [{ status: "DONE" }, { status: "DONE" }],
    "jp:1": [{ status: "DONE" }],
  });
  assert.deepEqual(progress, { done: 2, total: 3 });
});
