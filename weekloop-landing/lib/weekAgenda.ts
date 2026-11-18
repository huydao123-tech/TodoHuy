/**
 * "Việc cần làm" của từng thứ trong tuần.
 *
 * Một công việc (WorkItem) thuộc một tuần và có thể được làm vào NHIỀU thứ
 * (`daysOfWeek`: 1 = Thứ 2 … 7 = Chủ nhật) — ví dụ việc lặp lại hằng ngày.
 * Việc chưa gán thứ nào nằm trong hàng đợi "Chưa xếp thứ".
 *
 * File này chỉ chứa logic thuần để test bằng node (xem tests/weekAgenda.test.mjs).
 */
import type { TaskGroup, WorkItemData, WorkItemStatus } from "./mockData";

export const AGENDA_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export type AgendaDay = (typeof AGENDA_DAYS)[number];
export type AgendaDayMap = Record<AgendaDay, AgendaTask[]>;

const STATUS_RANK: Record<WorkItemStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  DONE: 2,
};

/** Một thứ đọc được từ dữ liệu: số 1…7 hoặc chuỗi số. Còn lại coi là không hợp lệ. */
export function normalizeDayOfWeek(value: unknown): AgendaDay | null {
  const numeric = typeof value === "string" ? Number(value) : value;
  if (typeof numeric !== "number" || !Number.isInteger(numeric)) return null;
  return numeric >= 1 && numeric <= 7 ? (numeric as AgendaDay) : null;
}

export function isAgendaDay(value: unknown): value is AgendaDay {
  return normalizeDayOfWeek(value) !== null;
}

/**
 * Danh sách thứ của một việc: bỏ trùng, sắp tăng dần.
 * Đọc được cả dữ liệu cũ chỉ có một `dayOfWeek` (số hoặc chuỗi) lẫn mảng mới.
 */
export function normalizeDaysOfWeek(value: unknown): AgendaDay[] {
  const raw = Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
  const days = new Set<AgendaDay>();
  for (const item of raw) {
    const day = normalizeDayOfWeek(item);
    if (day !== null) days.add(day);
  }
  return AGENDA_DAYS.filter((day) => days.has(day));
}

/** Bật/tắt một thứ trong danh sách — dùng cho ô chọn nhiều thứ trên từng việc. */
export function toggleAgendaDay(days: AgendaDay[], day: AgendaDay): AgendaDay[] {
  const next = days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
  return normalizeDaysOfWeek(next);
}

/**
 * Bỏ một thứ khỏi việc mà không xoá việc: việc vẫn nằm trong Planner,
 * các thứ khác giữ nguyên; bỏ hết thứ thì việc về hàng đợi "Chưa xếp thứ".
 */
export function removeAgendaDay(days: AgendaDay[], day: AgendaDay): AgendaDay[] {
  return normalizeDaysOfWeek(days.filter((item) => item !== day));
}

/** Thứ tự kéo-thả theo từng thứ, key "1".."7"; bỏ key/giá trị không hợp lệ. */
export function normalizeDayOrder(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, order] of Object.entries(value as Record<string, unknown>)) {
    const day = normalizeDayOfWeek(key);
    if (day !== null && typeof order === "number" && Number.isFinite(order)) {
      result[String(day)] = order;
    }
  }
  return result;
}

export interface AgendaTask {
  id: string | number;
  taskGroupId: string;
  content: string;
  status: WorkItemStatus;
  note: string;
  daysOfWeek: AgendaDay[];
  dayOrder: Record<string, number>;
  groupName: string;
  groupColor: string;
}

/**
 * Sắp việc trong một ngày.
 * `day` có truyền thì thứ tự kéo-thả (`dayOrder`) thắng trước; việc chưa có thứ tự
 * xếp theo trạng thái rồi theo thứ tự Planner. Không truyền `day` (hàng đợi) thì
 * xếp theo trạng thái.
 */
export function sortAgendaTasks(tasks: AgendaTask[], day?: AgendaDay): AgendaTask[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      if (day !== undefined) {
        const orderA = a.task.dayOrder[String(day)];
        const orderB = b.task.dayOrder[String(day)];
        const hasA = typeof orderA === "number";
        const hasB = typeof orderB === "number";
        if (hasA && hasB && orderA !== orderB) return orderA - orderB;
        if (hasA !== hasB) return hasA ? -1 : 1;
      }
      return (
        STATUS_RANK[a.task.status] - STATUS_RANK[b.task.status] || a.index - b.index
      );
    })
    .map(({ task }) => task);
}

export interface AgendaStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  pending: number;
}

export interface AgendaResult {
  days: AgendaDayMap;
  unscheduled: AgendaTask[];
  stats: AgendaStats;
}

export interface AgendaSourceWork extends WorkItemData {
  taskGroupId: string;
}

/**
 * Gom công việc của một tuần thành 7 danh sách theo thứ + hàng đợi chưa xếp.
 * Việc làm nhiều thứ xuất hiện ở mọi thứ đã chọn nhưng chỉ tính MỘT lần vào tiến độ.
 * `groups` giữ thứ tự ưu tiên của Planner để việc quan trọng lên trước.
 */
export function buildAgenda(items: AgendaSourceWork[], groups: TaskGroup[]): AgendaResult {
  const groupInfo = new Map(
    groups.map((group) => [String(group.id), { name: group.name, color: group.color }]),
  );

  const days = Object.fromEntries(
    AGENDA_DAYS.map((day) => [day, [] as AgendaTask[]]),
  ) as AgendaDayMap;
  const unscheduled: AgendaTask[] = [];

  for (const item of items) {
    const groupId = String(item.taskGroupId);
    const info = groupInfo.get(groupId);
    const daysOfWeek = normalizeDaysOfWeek(item.daysOfWeek);
    const task: AgendaTask = {
      id: item.id,
      taskGroupId: groupId,
      content: item.content,
      status: item.status,
      note: item.note || "",
      daysOfWeek,
      dayOrder: normalizeDayOrder(item.dayOrder),
      groupName: info?.name ?? "",
      groupColor: info?.color ?? "#A1A1AA",
    };
    if (daysOfWeek.length === 0) {
      unscheduled.push(task);
      continue;
    }
    for (const day of daysOfWeek) days[day].push(task);
  }

  for (const day of AGENDA_DAYS) days[day] = sortAgendaTasks(days[day], day);

  const done = items.filter((item) => item.status === "DONE").length;
  const inProgress = items.filter((item) => item.status === "IN_PROGRESS").length;

  return {
    days,
    unscheduled: sortAgendaTasks(unscheduled),
    stats: {
      total: items.length,
      todo: items.length - done - inProgress,
      inProgress,
      done,
      pending: items.length - done,
    },
  };
}

/** Ngày thật của một thứ trong tuần (tuần bắt đầu bằng thứ 2, dạng YYYY-MM-DD). */
export function dayDate(weekStart: string, day: number): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStart.trim());
  const normalizedDay = normalizeDayOfWeek(day);
  if (!match || normalizedDay === null) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + normalizedDay - 1);
  return date;
}

/** "09/11" — nhãn ngày gọn cho thẻ từng thứ. */
export function formatDayNumber(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function dayDateLabel(weekStart: string, day: number): string {
  const date = dayDate(weekStart, day);
  return date ? formatDayNumber(date) : "";
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Thứ của `now` có trùng với ngày đang xem không — để tô thẻ "Hôm nay". */
export function isDayToday(weekStart: string, day: number, now: Date = new Date()): boolean {
  const date = dayDate(weekStart, day);
  return date !== null && isSameDate(date, now);
}

/** Đổi danh sách thứ của một việc. Trả về mảng mới, không sửa mảng cũ. */
export function withDaysOfWeek(
  items: WorkItemData[],
  itemId: string | number,
  daysOfWeek: AgendaDay[],
): WorkItemData[] {
  const normalized = normalizeDaysOfWeek(daysOfWeek);
  return items.map((item) => (item.id === itemId ? { ...item, daysOfWeek: normalized } : item));
}

// ─── XẾP LỊCH TỰ ĐỘNG ─────────────────────────────────────────────────────────

export interface DayAssignment {
  taskId: string | number;
  taskGroupId: string;
  /** Danh sách thứ được gán (rỗng = bỏ về "Chưa xếp thứ"). */
  daysOfWeek: AgendaDay[];
}

export interface AutoSchedulePlan {
  assignments: DayAssignment[];
}

/** 1 = Thứ 2 … 7 = Chủ nhật, đọc từ Date thật (Chủ nhật của JS là 0). */
export function weekdayIndex(date: Date = new Date()): AgendaDay {
  return (((date.getDay() + 6) % 7) + 1) as AgendaDay;
}

const AUTO_SCHEDULE_RANK: Record<WorkItemStatus, number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  DONE: 2,
};

/**
 * Rải việc chưa xếp vào các thứ còn lại của tuần — KHÔNG giới hạn số việc mỗi ngày.
 *
 * Luật:
 * - Chỉ xếp việc chưa xong, bắt đầu từ `startDay` (tuần này = hôm nay, tuần sau = Thứ 2).
 * - Việc đang làm trước, rồi việc cần làm; trong cùng trạng thái ưu tiên đầu việc
 *   đứng trước ở Planner.
 * - Việc đang làm vào ngày sớm nhất (để làm tiếp); việc cần làm rải sang ngày ít việc
 *   nhất, bằng nhau thì lấy ngày sớm hơn. Không cắt bớt khi một ngày đã nhiều việc.
 * - Việc đã xếp sẵn trong ngày vẫn được tính vào tải của ngày đó, nên lịch đang có
 *   không bị dồn thêm.
 * - Việc làm nhiều thứ vẫn được tính tải ở từng thứ.
 * - Không sửa dữ liệu đầu vào.
 */
export function planAutoSchedule(input: {
  unscheduled: AgendaTask[];
  days: AgendaDayMap;
  startDay: AgendaDay;
  groupIdOrder?: string[];
}): AutoSchedulePlan {
  const groupRank = new Map((input.groupIdOrder ?? []).map((id, index) => [String(id), index]));

  const candidates = input.unscheduled
    .filter((task) => task.status !== "DONE")
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const byStatus = AUTO_SCHEDULE_RANK[a.task.status] - AUTO_SCHEDULE_RANK[b.task.status];
      if (byStatus !== 0) return byStatus;
      const byGroup =
        (groupRank.get(a.task.taskGroupId) ?? Number.MAX_SAFE_INTEGER) -
        (groupRank.get(b.task.taskGroupId) ?? Number.MAX_SAFE_INTEGER);
      if (byGroup !== 0) return byGroup;
      return a.index - b.index;
    })
    .map(({ task }) => task);

  const openDays = AGENDA_DAYS.filter((day) => day >= input.startDay);
  const load = new Map<AgendaDay, number>();
  for (const day of openDays) {
    load.set(day, input.days[day].filter((task) => task.status !== "DONE").length);
  }

  const assignments: DayAssignment[] = [];
  for (const task of candidates) {
    let target = openDays[0];
    if (task.status !== "IN_PROGRESS") {
      let targetLoad = Number.POSITIVE_INFINITY;
      for (const day of openDays) {
        const current = load.get(day) ?? 0;
        if (current < targetLoad) {
          target = day;
          targetLoad = current;
        }
      }
    }
    load.set(target, (load.get(target) ?? 0) + 1);
    assignments.push({ taskId: task.id, taskGroupId: task.taskGroupId, daysOfWeek: [target] });
  }

  return { assignments };
}
