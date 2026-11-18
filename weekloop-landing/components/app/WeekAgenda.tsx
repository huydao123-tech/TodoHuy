"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  ArrowsClockwise,
  CalendarBlank,
  CalendarX,
  CheckCircle,
  Circle,
  Clock,
  ClockCounterClockwise,
  DotsSixVertical,
  FileText,
  Plus,
  Sparkle,
  Tray,
  X,
} from "@phosphor-icons/react";
import type { TaskGroup, WorkItemData, WorkItemStatus } from "@/lib/mockData";
import { getNavLabel, getWeekDateStr, getWeekRange } from "@/lib/mockData";
import {
  AGENDA_DAYS,
  buildAgenda,
  dayDateLabel,
  isDayToday,
  normalizeDaysOfWeek,
  planAutoSchedule,
  toggleAgendaDay,
  weekdayIndex,
  type AgendaDay,
  type AgendaSourceWork,
  type AgendaTask,
  type DayAssignment,
} from "@/lib/weekAgenda";
import { useLanguage } from "@/lib/languageContext";
import TaskDetailModal from "@/components/app/TaskDetailModal";

// ─── CẤU HÌNH TRẠNG THÁI (giống Planner để hai màn đọc như một app) ──────────
const STATUS_ICON: Record<WorkItemStatus, ReactNode> = {
  DONE: <CheckCircle size={18} weight="fill" color="var(--accent)" />,
  IN_PROGRESS: <Clock size={18} weight="regular" color="var(--warning)" />,
  TODO: <Circle size={18} weight="thin" color="var(--text-faint)" />,
};

interface DragState {
  day: AgendaDay;
  taskId: string | number;
  originalIds: (string | number)[];
  ids: (string | number)[];
}

// ─── CHỌN NHIỀU THỨ CHO MỘT VIỆC (việc lặp lại nhiều ngày) ───────────────────
function DayPicker({
  days,
  dayLabel,
  onChange,
  disabled,
}: {
  days: AgendaDay[];
  dayLabel: (day: AgendaDay) => string;
  onChange: (days: AgendaDay[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AgendaDay[]>(days);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Đóng popover là chốt luôn lựa chọn (bấm ra ngoài / bấm lại nút / bấm Áp dụng). Esc là huỷ.
  const commitDraft = useCallback(() => {
    onChange(normalizeDaysOfWeek(draft));
    setOpen(false);
  }, [draft, onChange]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) commitDraft();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, commitDraft]);

  const openPicker = () => {
    setDraft(days);
    setOpen(true);
  };

  const summary =
    days.length === 0
      ? t.agendaNoDay
      : days.length === AGENDA_DAYS.length
        ? t.agendaAllWeek
        : days.map(dayLabel).join(" · ");

  return (
    <div className="agenda-daypick" ref={wrapRef}>
      <button
        type="button"
        className="agenda-daypick-btn"
        onClick={() => (open ? commitDraft() : openPicker())}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="true"
        title={t.agendaPickDays}
      >
        <CalendarBlank size={13} />
        <span>{summary}</span>
      </button>

      {open && (
        <div className="agenda-daypick-menu" role="group" aria-label={t.agendaPickDays}>
          <div className="agenda-daypick-grid">
            {AGENDA_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className="agenda-daypick-day"
                aria-pressed={draft.includes(day)}
                onClick={() => setDraft((prev) => toggleAgendaDay(prev, day))}
              >
                {dayLabel(day)}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="agenda-daypick-quick"
            onClick={() => setDraft([...AGENDA_DAYS])}
          >
            <ArrowsClockwise size={11} />
            {t.agendaEveryDay}
          </button>

          <div className="agenda-daypick-actions">
            <button type="button" className="agenda-daypick-clear" onClick={() => setDraft([])}>
              {t.agendaClearDays}
            </button>
            <button
              type="button"
              className="agenda-daypick-apply"
              onClick={commitDraft}
            >
              {t.agendaApply}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MÀN VIỆC CẦN LÀM ────────────────────────────────────────────────────────
export interface WeekAgendaProps {
  /** Offset tuần đang xem (0 = tuần này, -1 = tuần trước...). Dùng chung với Planner. */
  viewOffset: number;
  taskGroups: TaskGroup[];
  workItemsMap: Record<string, WorkItemData[]>;
  onAddItem: (
    groupId: string | number,
    offset: number,
    content: string,
    daysOfWeek?: number[],
  ) => void;
  onAssignDays: (
    groupId: string | number,
    offset: number,
    itemId: string | number,
    daysOfWeek: number[],
  ) => void;
  onUpdateItem: (
    groupId: string | number,
    offset: number,
    itemId: string | number,
    updates: { content?: string; note?: string; status?: WorkItemStatus },
  ) => void;
  onDeleteItem: (groupId: string | number, offset: number, itemId: string | number) => void;
  onRemoveFromDay: (
    groupId: string | number,
    offset: number,
    itemId: string | number,
    day: AgendaDay,
  ) => void;
  onCycleStatus: (groupId: string | number, offset: number, itemId: string | number) => void;
  onAutoSchedule: (assignments: DayAssignment[]) => void;
  onReorderDay: (day: AgendaDay, orderedIds: (string | number)[]) => void;
  onOpenPlanner: () => void;
}

export default function WeekAgenda({
  viewOffset,
  taskGroups,
  workItemsMap,
  onAddItem,
  onAssignDays,
  onUpdateItem,
  onDeleteItem,
  onRemoveFromDay,
  onCycleStatus,
  onAutoSchedule,
  onReorderDay,
  onOpenPlanner,
}: WeekAgendaProps) {
  const { t, isVietnamese } = useLanguage();

  const weekStart = getWeekDateStr(viewOffset);
  const isPast = viewOffset < 0;
  const isCurrentWeek = viewOffset === 0;
  const [hideDone, setHideDone] = useState(false);
  const [composerDay, setComposerDay] = useState<AgendaDay | null | undefined>(undefined);
  const [composerGroupId, setComposerGroupId] = useState("");
  const [composerText, setComposerText] = useState("");
  const [detailTask, setDetailTask] = useState<AgendaTask | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const agenda = useMemo(() => {
    const items: AgendaSourceWork[] = [];
    for (const group of taskGroups) {
      const key = `${group.id}:${viewOffset}`;
      for (const item of workItemsMap[key] ?? []) {
        items.push({ ...item, taskGroupId: String(group.id) });
      }
    }
    return buildAgenda(items, taskGroups);
  }, [taskGroups, workItemsMap, viewOffset]);

  // Mọi việc của tuần, gom theo đầu việc — để composer ngày hiện việc đã có trong Planner.
  const tasksByGroup = useMemo(() => {
    const lookup = new Map<string, AgendaTask[]>();
    const seen = new Set<string>();
    const push = (task: AgendaTask) => {
      const id = String(task.id);
      if (seen.has(id)) return;
      seen.add(id);
      const list = lookup.get(task.taskGroupId);
      if (list) list.push(task);
      else lookup.set(task.taskGroupId, [task]);
    };
    for (const day of AGENDA_DAYS) for (const task of agenda.days[day]) push(task);
    for (const task of agenda.unscheduled) push(task);
    return lookup;
  }, [agenda]);

  const dayNames = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];
  const dayLabel = (day: AgendaDay) => dayNames[day - 1];

  const visibleTasks = useCallback(
    (tasks: AgendaTask[]) =>
      hideDone ? tasks.filter((task) => task.status !== "DONE") : tasks,
    [hideDone],
  );

  const openComposer = (day: AgendaDay | null) => {
    setComposerDay(day);
    setComposerText("");
    setComposerGroupId(taskGroups.length > 0 ? String(taskGroups[0].id) : "");
  };

  const closeComposer = () => {
    setComposerDay(undefined);
    setComposerText("");
  };

  const submitComposer = (event: FormEvent) => {
    event.preventDefault();
    const content = composerText.trim();
    if (!content || !composerGroupId) return;
    onAddItem(composerGroupId, viewOffset, content, composerDay ? [composerDay] : []);
    closeComposer();
  };

  const autoScheduleCandidates = agenda.unscheduled.filter((task) => task.status !== "DONE").length;

  // Một cú bấm: rải việc chưa xếp vào các thứ còn lại (xem planAutoSchedule để biết luật).
  const handleAutoSchedule = () => {
    const plan = planAutoSchedule({
      unscheduled: agenda.unscheduled,
      days: agenda.days,
      startDay: isCurrentWeek ? weekdayIndex(new Date()) : 1,
      groupIdOrder: taskGroups.map((group) => String(group.id)),
    });
    onAutoSchedule(plan.assignments);
  };

  const progress = agenda.stats.total > 0 ? Math.round((agenda.stats.done / agenda.stats.total) * 100) : 0;

  // ─── Kéo-thả đổi thứ tự trong một thứ (chuột lẫn cảm ứng) ──────────────────
  const startDrag = (
    event: ReactPointerEvent,
    day: AgendaDay,
    taskId: string | number,
    ids: (string | number)[],
  ) => {
    if (isPast || hideDone) return;
    event.preventDefault();
    event.stopPropagation();

    const initial: DragState = { day, taskId, originalIds: [...ids], ids: [...ids] };
    dragRef.current = initial;
    setDragState(initial);

    const handleMove = (moveEvent: PointerEvent) => {
      const element = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const dayElement = element?.closest("[data-agenda-day]") as HTMLElement | null;
      const rowElement = element?.closest("[data-agenda-row]") as HTMLElement | null;
      if (!dayElement || Number(dayElement.dataset.agendaDay) !== day) return;

      const targetId = rowElement?.dataset.agendaRow;
      const current = dragRef.current;
      if (!current || !targetId || String(targetId) === String(current.taskId)) return;
      if (!current.ids.some((id) => String(id) === targetId)) return;

      const withoutDragged = current.ids.filter((id) => String(id) !== String(current.taskId));
      const targetIndex = withoutDragged.findIndex((id) => String(id) === targetId);
      if (targetIndex === -1) return;

      const nextIds = [...withoutDragged];
      nextIds.splice(targetIndex, 0, current.taskId);
      if (nextIds.every((id, index) => String(id) === String(current.ids[index]))) return;

      const next = { ...current, ids: nextIds };
      dragRef.current = next;
      setDragState(next);
    };

    const finish = () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", finish);

      const finalState = dragRef.current;
      dragRef.current = null;
      setDragState(null);
      if (!finalState) return;

      const changed = finalState.ids.some(
        (id, index) => String(id) !== String(finalState.originalIds[index]),
      );
      if (changed) onReorderDay(finalState.day, finalState.ids);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", finish);
  };

  const renderRow = (
    task: AgendaTask,
    scheduled: boolean,
    day?: AgendaDay,
    ids?: (string | number)[],
  ) => {
    const isDone = task.status === "DONE";
    const days = task.daysOfWeek;
    const canDrag = Boolean(scheduled && day !== undefined && !isPast && !hideDone && ids && ids.length > 1);
    return (
      <div
        key={task.id}
        data-agenda-row={String(task.id)}
        className={`agenda-row${isDone ? " is-done" : ""}${dragState?.taskId === task.id ? " is-dragging" : ""}`}
      >
        {canDrag && day !== undefined && ids && (
          <button
            type="button"
            className="agenda-grip"
            onPointerDown={(event) => startDrag(event, day, task.id, ids)}
            title={t.agendaReorder}
            aria-label={t.agendaReorder}
          >
            <DotsSixVertical size={16} />
          </button>
        )}
        <button
          type="button"
          className="agenda-status"
          disabled={isPast}
          onClick={() => onCycleStatus(task.taskGroupId, viewOffset, task.id)}
          title={
            isPast
              ? undefined
              : task.status === "TODO"
                ? (isVietnamese ? "Chuyển sang: Đang làm" : "Set to: In progress")
                : task.status === "IN_PROGRESS"
                  ? (isVietnamese ? "Chuyển sang: Đã xong" : "Set to: Done")
                  : (isVietnamese ? "Đặt lại: Cần làm" : "Reset to: To do")
          }
          aria-label={isVietnamese ? "Đổi trạng thái việc" : "Change task status"}
        >
          {STATUS_ICON[task.status]}
        </button>

        <button
          type="button"
          className="agenda-task"
          onClick={() => setDetailTask(task)}
          title={isVietnamese ? "Xem chi tiết & ghi chú" : "View details & notes"}
        >
          <span className="agenda-task-content">{task.content}</span>
          <span className="agenda-meta">
            <span className="agenda-group">
              <i style={{ background: task.groupColor }} />
              {task.groupName || (isVietnamese ? "Đầu việc đã ẩn" : "Hidden category")}
            </span>
            {days.length > 1 && (
              <span className="agenda-repeat" title={days.map(dayLabel).join(" · ")}>
                <ArrowsClockwise size={10} />
                <span>{days.map(dayLabel).join(" · ")}</span>
              </span>
            )}
            {task.note.trim().length > 0 && (
              <span className="agenda-note" title={isVietnamese ? "Có ghi chú chi tiết" : "Has detailed notes"}>
                <FileText size={11} weight="fill" />
              </span>
            )}
          </span>
        </button>

        {!isPast && (
          <div className={`agenda-row-actions${scheduled ? "" : " is-visible"}`}>
            <DayPicker
              days={days}
              dayLabel={dayLabel}
              onChange={(nextDays) => onAssignDays(task.taskGroupId, viewOffset, task.id, nextDays)}
            />
            {scheduled && day !== undefined && (
              <button
                type="button"
                className="agenda-remove"
                onClick={() => onRemoveFromDay(task.taskGroupId, viewOffset, task.id, day)}
                title={t.agendaRemoveFromDay}
                aria-label={t.agendaRemoveFromDay}
              >
                <CalendarX size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="agenda-shell">
      <header className="agenda-head">
        <div className="agenda-head-main">
          <p className="agenda-eyebrow">
            {getNavLabel(viewOffset)}
            {isCurrentWeek && <span className="agenda-today-chip">{t.currentWeekBadge}</span>}
            {isPast && <span className="agenda-past-chip">{t.pastWeekBadge}</span>}
          </p>
          <h1 className="agenda-title">{t.agenda}</h1>
          <p className="agenda-sub">{t.agendaSub}</p>
        </div>

        {agenda.stats.total > 0 && (
          <div className="agenda-head-side">
            <div className="agenda-progress">
              <span className="agenda-progress-label">
                {agenda.stats.done}/{agenda.stats.total} {t.agendaDoneSuffix}
                <b>{progress}%</b>
              </span>
              <span className="agenda-progress-track" aria-hidden>
                <span style={{ width: `${progress}%` }} />
              </span>
            </div>
            {agenda.stats.done > 0 && (
              <button
                type="button"
                className="agenda-toggle"
                aria-pressed={hideDone}
                onClick={() => setHideDone((value) => !value)}
              >
                <span className="agenda-toggle-box" aria-hidden />
                {t.agendaHideDone}
              </button>
            )}
          </div>
        )}
      </header>

      {isPast && (
        <p className="agenda-readonly">
          <ClockCounterClockwise size={14} />
          {t.readOnlyNotice}
        </p>
      )}

      {taskGroups.length === 0 ? (
        <div className="agenda-empty">
          <span className="agenda-empty-icon">
            <CalendarBlank size={24} weight="duotone" />
          </span>
          <h2>{t.agendaNoGroupsTitle}</h2>
          <p>{t.agendaNoGroupsBody}</p>
          <button type="button" className="btn-primary" onClick={onOpenPlanner}>
            {t.agendaOpenPlanner}
          </button>
        </div>
      ) : (
        <div className="agenda-body">
          {/* ─── Hàng đợi chưa xếp thứ ─────────────────────────────────────── */}
          <section className="agenda-card agenda-unscheduled" aria-labelledby="agenda-unscheduled-title">
            <header className="agenda-card-head">
              <div className="agenda-card-title">
                <span className="agenda-queue-icon" aria-hidden>
                  <Tray size={16} />
                </span>
                <h2 id="agenda-unscheduled-title">{t.agendaUnscheduled}</h2>
                {agenda.unscheduled.length > 0 && (
                  <span className="agenda-count">{agenda.unscheduled.length}</span>
                )}
                {!isPast && autoScheduleCandidates > 0 && (
                  <button
                    type="button"
                    className="agenda-auto"
                    onClick={handleAutoSchedule}
                    title={t.agendaAutoScheduleHint}
                  >
                    <Sparkle size={12} weight="fill" />
                    {t.agendaAutoSchedule}
                  </button>
                )}
              </div>
              <p className="agenda-card-hint">{t.agendaUnscheduledHint}</p>
            </header>

            {agenda.unscheduled.length === 0 ? (
              <p className="agenda-card-empty">{t.agendaUnscheduledEmpty}</p>
            ) : (
              <div className="agenda-unscheduled-list">
                {visibleTasks(agenda.unscheduled).map((task) => renderRow(task, false))}
              </div>
            )}

            {!isPast && (
              <div className="agenda-card-foot">
                {composerDay === null ? (
                  <form className="agenda-composer" onSubmit={submitComposer}>
                    <select
                      className="agenda-composer-group"
                      value={composerGroupId}
                      onChange={(event) => setComposerGroupId(event.target.value)}
                      aria-label={t.agendaPickGroup}
                    >
                      {taskGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <div className="agenda-composer-row">
                      <input
                        autoFocus
                        type="text"
                        value={composerText}
                        onChange={(event) => setComposerText(event.target.value)}
                        placeholder={t.agendaAddUnscheduledHint}
                      />
                      <button type="submit" className="agenda-composer-submit" disabled={!composerText.trim()}>
                        {t.create}
                      </button>
                      <button type="button" className="agenda-composer-cancel" onClick={closeComposer} aria-label={t.cancel}>
                        <X size={13} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <button type="button" className="agenda-add" onClick={() => openComposer(null)}>
                    <Plus size={12} />
                    {t.agendaAddTask}
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ─── Bảy thẻ, mỗi thứ một danh sách việc cần làm ──────────────── */}
          <div className="agenda-grid">
            {AGENDA_DAYS.map((day) => {
              const tasks = agenda.days[day];
              const baseShown = visibleTasks(tasks);
              const draggingThisDay = dragState?.day === day;
              const shown = draggingThisDay
                ? dragState.ids
                    .map((id) => baseShown.find((task) => String(task.id) === String(id)))
                    .filter((task): task is AgendaTask => Boolean(task))
                : baseShown;
              const shownIds = shown.map((task) => task.id);
              const dayDone = tasks.filter((task) => task.status === "DONE").length;
              const isToday = isCurrentWeek && isDayToday(weekStart, day);
              const dateLabel = dayDateLabel(weekStart, day);
              const composerTasks =
                composerDay === day
                  ? (tasksByGroup.get(String(composerGroupId)) ?? []).filter(
                      (task) => task.status !== "DONE" && !task.daysOfWeek.includes(day),
                    )
                  : [];

              return (
                <section
                  key={day}
                  className={`agenda-card agenda-day${isToday ? " is-today" : ""}`}
                  aria-labelledby={`agenda-day-${day}`}
                >
                  <header className="agenda-card-head">
                    <div className="agenda-card-title">
                      <h2 id={`agenda-day-${day}`}>{dayLabel(day)}</h2>
                      <span className="agenda-date">{dateLabel}</span>
                      {isToday && <span className="agenda-today-chip">{t.today}</span>}
                    </div>
                    {tasks.length > 0 && (
                      <span className="agenda-count" title={isVietnamese ? "Đã xong / tổng số việc" : "Done / total tasks"}>
                        {dayDone}/{tasks.length}
                      </span>
                    )}
                  </header>

                  {shown.length === 0 ? (
                    <p className="agenda-card-empty">
                      {tasks.length === 0
                        ? t.agendaNoDayTasks
                        : isVietnamese
                          ? "Đã xong hết việc của ngày này."
                          : "Everything for this day is done."}
                    </p>
                  ) : (
                    <div className="agenda-day-list" data-agenda-day={day}>
                      {shown.map((task) => renderRow(task, true, day, shownIds))}
                    </div>
                  )}

                  {!isPast && (
                    <div className="agenda-card-foot">
                      {composerDay === day ? (
                        <form className="agenda-composer" onSubmit={submitComposer}>
                          <select
                            className="agenda-composer-group"
                            value={composerGroupId}
                            onChange={(event) => setComposerGroupId(event.target.value)}
                            aria-label={t.agendaPickGroup}
                          >
                            {taskGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>

                          {composerTasks.length > 0 ? (
                            <div className="agenda-pick">
                              <p className="agenda-pick-title">
                                {t.agendaFromPlanner}
                                <span>{composerTasks.length}</span>
                              </p>
                              <div className="agenda-pick-list">
                                {composerTasks.map((task) => (
                                  <button
                                    key={task.id}
                                    type="button"
                                    className="agenda-pick-item"
                                    title={t.agendaAddExisting}
                                    onClick={() =>
                                      onAssignDays(
                                        task.taskGroupId,
                                        viewOffset,
                                        task.id,
                                        normalizeDaysOfWeek([...task.daysOfWeek, day]),
                                      )
                                    }
                                  >
                                    <Plus size={11} />
                                    <span className="agenda-pick-text">{task.content}</span>
                                    {task.daysOfWeek.length > 0 && (
                                      <span className="agenda-pick-days">
                                        {task.daysOfWeek.map(dayLabel).join("·")}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="agenda-pick-empty">{t.agendaFromPlannerEmpty}</p>
                          )}

                          <div className="agenda-composer-row">
                            <input
                              autoFocus
                              type="text"
                              value={composerText}
                              onChange={(event) => setComposerText(event.target.value)}
                              placeholder={t.agendaAddHint}
                            />
                            <button
                              type="submit"
                              className="agenda-composer-submit"
                              disabled={!composerText.trim()}
                            >
                              {t.create}
                            </button>
                            <button
                              type="button"
                              className="agenda-composer-cancel"
                              onClick={closeComposer}
                              aria-label={t.cancel}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button type="button" className="agenda-add" onClick={() => openComposer(day)}>
                          <Plus size={12} />
                          {t.agendaAddTask}
                        </button>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      <TaskDetailModal
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        task={
          detailTask
            ? {
                id: detailTask.id,
                content: detailTask.content,
                status: detailTask.status,
                note: detailTask.note,
                daysOfWeek: detailTask.daysOfWeek,
              }
            : null
        }
        groupName={detailTask?.groupName ?? ""}
        groupColor={detailTask?.groupColor ?? "var(--accent)"}
        weekLabel={
          detailTask
            ? detailTask.daysOfWeek.length === 0
              ? `${t.agendaUnscheduled} · ${getWeekRange(viewOffset)}`
              : detailTask.daysOfWeek.length === 1
                ? `${dayLabel(detailTask.daysOfWeek[0])} · ${dayDateLabel(weekStart, detailTask.daysOfWeek[0])}`
                : detailTask.daysOfWeek.map(dayLabel).join(" · ")
            : ""
        }
        isPast={isPast}
        onSave={(taskId, updates) => {
          if (!detailTask) return;
          onUpdateItem(detailTask.taskGroupId, viewOffset, taskId, updates);
          setDetailTask(null);
        }}
        onDelete={(taskId) => {
          if (!detailTask) return;
          onDeleteItem(detailTask.taskGroupId, viewOffset, taskId);
          setDetailTask(null);
        }}
      />

      <style>{`        .agenda-shell {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }
        .agenda-head {
          position: sticky;
          top: 0;
          z-index: 12;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px 24px 12px;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .agenda-head-main { min-width: 0; }
        .agenda-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 0 3px;
          font-family: var(--font-geist-mono), monospace;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-faint);
        }
        .agenda-today-chip,
        .agenda-past-chip {
          display: inline-flex;
          align-items: center;
          padding: 1px 6px;
          border-radius: 8px;
          font-family: inherit;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: none;
        }
        .agenda-today-chip { background: var(--accent-bg); color: var(--accent-contrast); }
        .agenda-past-chip { background: var(--bg-alt); color: var(--text-muted); border: 1px solid var(--border); }
        .agenda-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
          color: var(--text);
        }
        .agenda-sub {
          margin: 3px 0 0;
          font-size: 13px;
          line-height: 1.45;
          color: var(--text-muted);
          max-width: 56ch;
        }
        .agenda-head-side {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
        }
        .agenda-progress { min-width: 160px; display: flex; flex-direction: column; gap: 4px; }
        .agenda-progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .agenda-progress-label b { font-weight: 700; color: var(--text); font-size: 12.5px; }
        .agenda-progress-track {
          height: 4px;
          border-radius: 4px;
          background: var(--border);
          overflow: hidden;
          display: block;
        }
        .agenda-progress-track > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--accent);
          transition: width 0.2s ease;
        }
        .agenda-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 4px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-size: 11.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: color 0.14s ease;
        }
        .agenda-toggle:hover { color: var(--text); }
        .agenda-toggle-box {
          width: 16px;
          height: 16px;
          border: 1.5px solid #CBD5E1;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .agenda-toggle[aria-pressed="true"] { color: var(--text); }
        .agenda-toggle[aria-pressed="true"] .agenda-toggle-box {
          border-color: var(--accent);
          background: var(--accent)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")
            center / 11px no-repeat;
        }
        .agenda-readonly {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 24px 0;
          padding: 10px 12px;
          font-size: 12.5px;
          color: var(--text-muted);
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        .agenda-body {
          padding: 16px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .agenda-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 1199px) {
          .agenda-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 899px) {
          .agenda-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .agenda-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          background: var(--card-bg);
          display: flex;
          flex-direction: column;
          min-width: 0;
          box-shadow: var(--shadow-soft);
        }
        .agenda-card.is-today { border: 1.2px solid var(--accent); }
        .agenda-unscheduled { border: 1px solid var(--border); background: var(--card-bg); }
        .agenda-card-head {
          padding: 12px 12px 9px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .agenda-day .agenda-card-head { flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; }
        .agenda-card-title {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }
        .agenda-queue-icon { display: inline-flex; color: var(--text-muted); flex-shrink: 0; }
        .agenda-card-title h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.2px;
          white-space: nowrap;
        }
        .agenda-date {
          font-family: var(--font-geist-mono), monospace;
          font-size: 11px;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .agenda-card.is-today .agenda-card-title h2 { color: var(--accent-contrast); }
        .agenda-count {
          font-size: 10.5px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1px 6px;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .agenda-auto {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
          height: 26px;
          padding: 0 8px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: var(--accent-ghost);
          color: var(--accent-contrast);
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.14s ease;
        }
        .agenda-auto:hover { background: var(--accent-bg); }
        .agenda-card-hint {
          margin: 0;
          font-size: 11px;
          line-height: 1.35;
          color: var(--text-faint);
        }
        .agenda-day-list,
        .agenda-unscheduled-list {
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .agenda-unscheduled-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          column-gap: 12px;
        }
        .agenda-card-empty {
          margin: 0;
          padding: 8px 12px;
          font-size: 12px;
          font-style: italic;
          color: var(--text-faint);
        }
        .agenda-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 4px 6px;
          border-radius: 8px;
          min-width: 0;
          transition: background 0.12s ease;
        }
        .agenda-row:hover { background: var(--bg-alt); }
        .agenda-card.is-today .agenda-row:hover { background: var(--accent-ghost); }
        .agenda-status {
          background: none;
          border: none;
          padding: 1px 0 0;
          display: flex;
          flex-shrink: 0;
          cursor: pointer;
        }
        .agenda-status:disabled { cursor: default; }
        .agenda-grip {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          flex-shrink: 0;
          padding: 0;
          margin-top: 0;
          border: none;
          background: none;
          color: var(--text-faint);
          opacity: 0.45;
          cursor: grab;
          touch-action: none;
          transition: opacity 0.12s ease, color 0.12s ease;
        }
        .agenda-row:hover .agenda-grip,
        .agenda-row:focus-within .agenda-grip { opacity: 0.9; }
        .agenda-grip:hover { color: var(--text-muted); }
        .agenda-row.is-dragging {
          background: var(--accent-ghost);
          box-shadow: inset 0 0 0 1px var(--accent);
        }
        .agenda-row.is-dragging .agenda-grip { opacity: 1; cursor: grabbing; }
        .agenda-task {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0;
          border: none;
          background: none;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          color: var(--text);
        }
        .agenda-task-content {
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.35;
          color: var(--text);
          word-break: break-word;
        }
        .agenda-row.is-done .agenda-task-content {
          color: var(--text-faint);
          text-decoration: line-through;
        }
        .agenda-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .agenda-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
          max-width: 100%;
          font-size: 10.5px;
          color: var(--text-faint);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 1;
        }
        .agenda-group i {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          flex-shrink: 0;
        }
        .agenda-repeat {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          min-width: 0;
          max-width: 140px;
          font-size: 10.5px;
          color: var(--text-faint);
          flex-shrink: 0;
        }
        .agenda-repeat > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .agenda-note { display: inline-flex; color: var(--accent-contrast); opacity: 0.85; flex-shrink: 0; }
        .agenda-row-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.12s ease;
        }
        .agenda-row:hover .agenda-row-actions,
        .agenda-row:focus-within .agenda-row-actions,
        .agenda-row-actions.is-visible { opacity: 1; }
        .agenda-daypick { position: relative; }
        .agenda-daypick-btn {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          max-width: 150px;
          min-height: 28px;
          padding: 2px 4px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
        }
        .agenda-daypick-btn > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .agenda-daypick-btn:hover,
        .agenda-daypick-btn[aria-expanded="true"] {
          border-color: var(--border);
          background: var(--card-bg);
          color: var(--text);
        }
        .agenda-daypick-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          z-index: 60;
          width: 230px;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--card-bg);
          box-shadow: var(--shadow-elevated);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .agenda-daypick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
        }
        .agenda-daypick-day {
          height: 30px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--text-muted);
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .agenda-daypick-day:hover { border-color: var(--accent); color: var(--accent-contrast); }
        .agenda-daypick-day[aria-pressed="true"] {
          background: var(--accent-ghost);
          border-color: var(--accent);
          color: var(--accent-contrast);
          font-weight: 700;
        }
        .agenda-daypick-quick {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 28px;
          border: 1px dashed var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 11.5px;
          cursor: pointer;
        }
        .agenda-daypick-quick:hover { color: var(--accent-contrast); border-color: var(--accent); background: var(--accent-ghost); }
        .agenda-daypick-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding-top: 2px;
          border-top: 1px solid var(--border);
        }
        .agenda-daypick-clear {
          border: none;
          background: none;
          padding: 4px 4px;
          color: var(--text-faint);
          font-family: inherit;
          font-size: 11.5px;
          cursor: pointer;
        }
        .agenda-daypick-clear:hover { color: var(--danger); }
        .agenda-daypick-apply {
          padding: 6px 12px;
          border: none;
          border-radius: 8px;
          background: var(--accent);
          color: #fff;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .agenda-remove {
          background: none;
          border: none;
          padding: 4px;
          display: flex;
          color: var(--text-faint);
          cursor: pointer;
        }
        .agenda-remove:hover { color: var(--accent-contrast); }
        .agenda-card-foot {
          border-top: 1px solid var(--border);
          padding: 2px 10px 8px;
          margin-top: auto;
        }
        .agenda-add {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 0 6px;
          border: none;
          background: none;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.12s ease;
        }
        .agenda-add:hover { color: var(--accent-contrast); }
        .agenda-composer { display: flex; flex-direction: column; gap: 8px; }
        .agenda-composer-group {
          width: 100%;
          padding: 7px 8px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-alt);
          color: var(--text);
          font-family: inherit;
          font-size: 12px;
          outline: none;
        }
        .agenda-composer-row { display: flex; align-items: center; gap: 6px; }
        .agenda-pick { display: flex; flex-direction: column; gap: 4px; }
        .agenda-pick-title {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .agenda-pick-title span {
          font-weight: 500;
          letter-spacing: 0;
          text-transform: none;
          color: var(--text-faint);
        }
        .agenda-pick-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
          max-height: 186px;
          overflow-y: auto;
          padding: 3px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-alt);
        }
        .agenda-pick-item {
          display: flex;
          align-items: center;
          gap: 5px;
          width: 100%;
          padding: 7px 6px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }
        .agenda-pick-item:hover { background: var(--card-bg); color: var(--text); }
        .agenda-pick-item > svg { flex-shrink: 0; color: var(--accent-contrast); }
        .agenda-pick-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .agenda-pick-days {
          flex-shrink: 0;
          font-family: var(--font-geist-mono), monospace;
          font-size: 10.5px;
          color: var(--text-faint);
        }
        .agenda-pick-empty {
          margin: 0;
          font-size: 11.5px;
          font-style: italic;
          color: var(--text-faint);
        }
        .agenda-composer-row input {
          flex: 1;
          min-width: 0;
          height: 40px;
          padding: 0 12px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-alt);
          color: var(--text);
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
        }
        .agenda-composer-row input:focus-visible {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }
        .agenda-composer-submit {
          height: 40px;
          min-width: 54px;
          padding: 0 12px;
          border: none;
          border-radius: 12px;
          background: var(--accent);
          color: #fff;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .agenda-composer-submit:disabled { opacity: 0.45; cursor: default; }
        .agenda-composer-cancel {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: none;
          color: var(--text-faint);
          cursor: pointer;
        }
        .agenda-composer-cancel:hover { background: var(--bg-alt); color: var(--text); }
        .agenda-empty {
          margin: 48px auto;
          max-width: 420px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .agenda-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--accent-ghost);
          border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .agenda-empty h2 { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); }
        .agenda-empty p { margin: 0 0 6px; font-size: 13px; line-height: 1.5; color: var(--text-muted); }
        .agenda-task:focus-visible,
        .agenda-status:focus-visible,
        .agenda-grip:focus-visible,
        .agenda-add:focus-visible,
        .agenda-remove:focus-visible,
        .agenda-toggle:focus-visible,
        .agenda-auto:focus-visible,
        .agenda-daypick-btn:focus-visible,
        .agenda-daypick-day:focus-visible,
        .agenda-daypick-quick:focus-visible,
        .agenda-daypick-clear:focus-visible,
        .agenda-daypick-apply:focus-visible,
        .agenda-pick-item:focus-visible,
        .agenda-composer-submit:focus-visible,
        .agenda-composer-cancel:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: 8px;
        }
        .agenda-status:focus:not(:focus-visible),
        .agenda-add:focus:not(:focus-visible),
        .agenda-task:focus:not(:focus-visible) { outline: none; }
        @media (max-width: 767px) {
          .agenda-head { padding: 12px 12px 10px; }
          .agenda-eyebrow { display: none; }
          .agenda-sub { display: none; }
          .agenda-title { font-size: 17px; }
          .agenda-body { padding: 12px 12px 16px; }
          .agenda-grid { grid-template-columns: 1fr; }
          .agenda-unscheduled-list { grid-template-columns: 1fr; }
          .agenda-row-actions { opacity: 1; }
          .agenda-readonly { margin: 10px 12px 0; }
        }
        @media (hover: none) {
          .agenda-row-actions { opacity: 1; }
          .agenda-grip { opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agenda-progress-track > span { transition: none; }
        }      `}</style>
    </div>
  );
}
