import assert from "node:assert/strict";
import test from "node:test";
import { compareTaskGroups, moveTaskGroup } from "../lib/taskGroupPriority.ts";

test("web follows Flutter displayOrder and ignores any old priority field", () => {
  const groups = [
    { id: "third", displayOrder: 3, priority: "HIGH" },
    { id: "first", displayOrder: 1, priority: "LOW" },
    { id: "second", displayOrder: 2 },
  ];
  assert.deepEqual(groups.sort(compareTaskGroups).map((g) => g.id), ["first", "second", "third"]);
});

test("moving a group to first or last preserves the other groups and source list", () => {
  const groups = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveTaskGroup(groups, "c", 0).map((g) => g.id), ["c", "a", "b"]);
  assert.deepEqual(moveTaskGroup(groups, "a", 2).map((g) => g.id), ["b", "c", "a"]);
  assert.deepEqual(groups.map((g) => g.id), ["a", "b", "c"]);
});

test("legacy missing order defaults to zero like Flutter and ties remain stable", () => {
  const groups = [{ id: "later", displayOrder: 1 }, { id: "legacy" }, { id: "tie", displayOrder: 0 }];
  assert.deepEqual(groups.sort(compareTaskGroups).map((g) => g.id), ["legacy", "tie", "later"]);
});

test("invalid moves leave the list unchanged", () => {
  const groups = [{ id: "a" }];
  assert.equal(moveTaskGroup(groups, "missing", 0), groups);
  assert.equal(moveTaskGroup(groups, "a", -1), groups);
  assert.equal(moveTaskGroup(groups, "a", 1), groups);
});
