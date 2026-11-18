import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENDA_DAYS,
  buildAgenda,
  dayDate,
  dayDateLabel,
  isDayToday,
  normalizeDayOfWeek,
  normalizeDaysOfWeek,
  planAutoSchedule,
  toggleAgendaDay,
  weekdayIndex,
  withDaysOfWeek,
} from "../lib/weekAgenda.ts";

const groups = [
  { id: "ja", name: "Tiếng Nhật", color: "#16A34A", displayOrder: 1 },
  { id: "gym", name: "Gym", color: "#D97706", displayOrder: 2 },
];

const work = (id, taskGroupId, daysOfWeek, status = "TODO", content = `việc ${id}`) => ({
  id,
  taskGroupId,
  weekStartDate: "2026-11-09",
  content,
  status,
  note: "",
  daysOfWeek,
});

test("only whole numbers 1..7 count as a weekday; legacy or broken values are rejected", () => {
  assert.equal(normalizeDayOfWeek(1), 1);
  assert.equal(normalizeDayOfWeek(7), 7);
  assert.equal(normalizeDayOfWeek("3"), 3);
  assert.equal(normalizeDayOfWeek(0), null);
  assert.equal(normalizeDayOfWeek(8), null);
  assert.equal(normalizeDayOfWeek(2.5), null);
  assert.equal(normalizeDayOfWeek(""), null);
  assert.equal(normalizeDayOfWeek(undefined), null);
  assert.equal(normalizeDayOfWeek(null), null);
});

test("days of week dedupe, sort and accept the legacy single day field", () => {
  assert.deepEqual(normalizeDaysOfWeek(undefined), []);
  assert.deepEqual(normalizeDaysOfWeek(null), []);
  assert.deepEqual(normalizeDaysOfWeek(3), [3]);
  assert.deepEqual(normalizeDaysOfWeek("2"), [2]);
  assert.deepEqual(normalizeDaysOfWeek([4, 2, 4, 0, 8, "7"]), [2, 4, 7]);
  assert.deepEqual(normalizeDaysOfWeek([null, undefined, "x"]), []);
});

test("toggling a day on and off keeps the list sorted", () => {
  assert.deepEqual(toggleAgendaDay([], 5), [5]);
  assert.deepEqual(toggleAgendaDay([5], 2), [2, 5]);
  assert.deepEqual(toggleAgendaDay([2, 5], 5), [2]);
  assert.deepEqual(toggleAgendaDay([3], 3), []);
});

test("a task can appear on several days but counts once in progress", () => {
  const agenda = buildAgenda(
    [
      work("repeat", "ja", [2, 4, 6], "IN_PROGRESS"),
      work("one", "gym", [3]),
      work("later", "ja", []),
    ],
    groups,
  );

  assert.deepEqual(agenda.days[2].map((task) => task.id), ["repeat"]);
  assert.deepEqual(agenda.days[3].map((task) => task.id), ["one"]);
  assert.deepEqual(agenda.days[4].map((task) => task.id), ["repeat"]);
  assert.deepEqual(agenda.days[6].map((task) => task.id), ["repeat"]);
  assert.deepEqual(agenda.unscheduled.map((task) => task.id), ["later"]);
  assert.deepEqual(agenda.stats, { total: 3, todo: 2, inProgress: 1, done: 0, pending: 3 });
});

test("agenda splits a week into seven days and an unscheduled queue", () => {
  const agenda = buildAgenda(
    [
      work("1", "ja", [2]),
      work("2", "gym", [7], "IN_PROGRESS"),
      work("3", "ja", []),
      work("4", "gym", [9]),
    ],
    groups,
  );

  assert.deepEqual(agenda.days[1], []);
  assert.deepEqual(agenda.days[2].map((task) => task.id), ["1"]);
  assert.deepEqual(agenda.days[7].map((task) => task.id), ["2"]);
  assert.deepEqual(agenda.unscheduled.map((task) => task.id), ["3", "4"]);
  assert.deepEqual(agenda.stats, { total: 4, todo: 3, inProgress: 1, done: 0, pending: 4 });
});

test("tasks show planner group name and colour and put done work last", () => {
  const agenda = buildAgenda(
    [
      work("done", "ja", [2], "DONE"),
      work("doing", "gym", [2], "IN_PROGRESS"),
      work("later", "ja", [2], "TODO"),
    ],
    groups,
  );

  assert.deepEqual(agenda.days[2].map((task) => task.id), ["later", "doing", "done"]);
  assert.equal(agenda.days[2][0].groupName, "Tiếng Nhật");
  assert.equal(agenda.days[2][0].groupColor, "#16A34A");
  assert.equal(agenda.stats.done, 1);
  assert.equal(agenda.stats.pending, 2);
});

test("a missing (hidden) group still renders instead of dropping the task", () => {
  const agenda = buildAgenda([work("x", "gone", [1])], groups);
  assert.equal(agenda.days[1][0].groupName, "");
  assert.equal(agenda.days[1][0].groupColor, "#A1A1AA");
});

test("week dates run Monday to Sunday in local time", () => {
  const monday = dayDate("2026-11-09", 1);
  const sunday = dayDate("2026-11-09", 7);
  assert.ok(monday && sunday);
  assert.equal(monday.getDay(), 1);
  assert.equal(sunday.getDay(), 0);
  assert.equal(dayDateLabel("2026-11-09", 1), "09/11");
  assert.equal(dayDateLabel("2026-11-09", 7), "15/11");
  assert.equal(dayDate("2026-11-09", 8), null);
  assert.equal(dayDate("nope", 1), null);
});

test("today highlight matches the real weekday of the selected week", () => {
  const now = new Date(2026, 10, 11, 9, 30); // Wed 11/11/2026
  assert.equal(isDayToday("2026-11-09", 3, now), true);
  assert.equal(isDayToday("2026-11-09", 2, now), false);
  assert.equal(isDayToday("2026-11-16", 3, now), false);
});

test("changing the days of one task keeps the other tasks untouched", () => {
  const items = [work("1", "ja", [2]), work("2", "ja", [])];
  const changed = withDaysOfWeek(items, "2", [2, 4, 6]);
  assert.deepEqual(changed[1].daysOfWeek, [2, 4, 6]);
  assert.deepEqual(items[1].daysOfWeek, []);
  assert.deepEqual(withDaysOfWeek(items, "missing", 3), items);
  // Việc của người khác vẫn nguyên ngày.
  assert.deepEqual(changed[0].daysOfWeek, [2]);
});

// ─── Xếp lịch tự động ────────────────────────────────────────────────────────
const emptyDays = () =>
  Object.fromEntries(AGENDA_DAYS.map((day) => [day, []]));

const agendaTask = (id, taskGroupId, status = "TODO") => ({
  id,
  taskGroupId,
  content: `việc ${id}`,
  status,
  note: "",
  daysOfWeek: [],
  groupName: "",
  groupColor: "#A1A1AA",
});

test("weekdayIndex counts Monday as 1 and Sunday as 7", () => {
  assert.equal(weekdayIndex(new Date(2026, 10, 16)), 1); // Mon
  assert.equal(weekdayIndex(new Date(2026, 10, 18)), 3); // Wed
  assert.equal(weekdayIndex(new Date(2026, 10, 22)), 7); // Sun
});

test("auto schedule fills from the chosen start day and never touches earlier days", () => {
  const plan = planAutoSchedule({
    unscheduled: [agendaTask("a", "ja"), agendaTask("b", "ja")],
    days: emptyDays(),
    startDay: 4,
  });
  assert.equal(plan.assignments.length, 2);
  assert.ok(plan.assignments.every((item) => item.daysOfWeek[0] >= 4));
});

test("auto schedule balances load across days, earliest day wins ties", () => {
  const plan = planAutoSchedule({
    unscheduled: ["a", "b", "c", "d", "e"].map((id) => agendaTask(id, "ja")),
    days: emptyDays(),
    startDay: 2,
  });
  assert.deepEqual(
    plan.assignments.map((item) => item.daysOfWeek[0]),
    [2, 3, 4, 5, 6],
  );
});

test("auto schedule counts existing tasks as load", () => {
  const days = emptyDays();
  days[2] = [agendaTask("x", "ja"), agendaTask("y", "ja")];
  const plan = planAutoSchedule({
    unscheduled: [agendaTask("a", "ja")],
    days,
    startDay: 2,
  });
  assert.equal(plan.assignments[0].daysOfWeek[0], 3);
});

test("auto schedule has no daily limit — all work lands even on the last day", () => {
  const plan = planAutoSchedule({
    unscheduled: ["a", "b", "c", "d", "e"].map((id) => agendaTask(id, "ja")),
    days: emptyDays(),
    startDay: 7,
  });
  assert.equal(plan.assignments.length, 5);
  assert.ok(plan.assignments.every((item) => item.daysOfWeek[0] === 7));
});

test("auto schedule puts in-progress work first, then higher-priority groups", () => {
  const plan = planAutoSchedule({
    unscheduled: [
      agendaTask("todo-low", "gym"),
      agendaTask("doing", "gym", "IN_PROGRESS"),
      agendaTask("todo-high", "ja"),
    ],
    days: emptyDays(),
    startDay: 1,
    groupIdOrder: ["ja", "gym"],
  });
  assert.deepEqual(
    plan.assignments.map((item) => item.taskId),
    ["doing", "todo-high", "todo-low"],
  );
  assert.deepEqual(plan.assignments.map((item) => item.daysOfWeek[0]), [1, 2, 3]);
});

test("auto schedule keeps in-progress work on the earliest day, not the emptiest", () => {
  const days = emptyDays();
  days[3] = [agendaTask("x", "ja"), agendaTask("y", "ja")];
  const plan = planAutoSchedule({
    unscheduled: [agendaTask("doing", "ja", "IN_PROGRESS")],
    days,
    startDay: 3,
  });
  assert.equal(plan.assignments[0].daysOfWeek[0], 3);
});

test("auto schedule ignores finished work and leaves the input untouched", () => {
  const days = emptyDays();
  const unscheduled = [agendaTask("done", "ja", "DONE"), agendaTask("open", "ja")];
  const snapshot = JSON.stringify({ days, unscheduled });
  const plan = planAutoSchedule({ unscheduled, days, startDay: 1 });
  assert.deepEqual(plan.assignments.map((item) => item.taskId), ["open"]);
  assert.equal(JSON.stringify({ days, unscheduled }), snapshot);
});
