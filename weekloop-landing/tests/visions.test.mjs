import assert from "node:assert/strict";
import test from "node:test";
import {
  attachGroupToVision,
  detachGroupFromVision,
  exclusiveVisions,
  groupsInVision,
  parseVisionDraft,
  stripGroupFromVisions,
  unassignedGroups,
  visionOwningGroup,
  weekProgress,
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

test("a vision draft needs a title and trims the outcome", () => {
  assert.equal(parseVisionDraft({ title: "   " }).ok, false);
  const parsed = parseVisionDraft({ title: "  Du học Nhật  ", outcome: "  nhập học  ", horizon: " 2027 " });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.deepEqual(parsed.draft, { title: "Du học Nhật", outcome: "nhập học", horizon: "2027" });
  }
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

test("week progress counts only the groups that belong to the vision", () => {
  const progress = weekProgress(["jp", "ielts"], {
    "jp:0": [{ status: "DONE" }, { status: "TODO" }],
    "ielts:0": [{ status: "DONE" }],
    "gym:0": [{ status: "DONE" }, { status: "DONE" }],
    "jp:1": [{ status: "DONE" }],
  });
  assert.deepEqual(progress, { done: 2, total: 3 });
});
