"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ArrowsClockwise,
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Plus,
  Sparkle,
  Trash,
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
  DONE: <CheckCircle size={15} weight="fill" color="var(--accent)" />,
  IN_PROGRESS: <Clock size={15} weight="regular" color="#D97706" />,
  TODO: <Circle size={15} weight="thin" color="#A1A1AA" />,
};

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
  onCycleStatus: (groupId: string | number, offset: number, itemId: string | number) => void;
  onAutoSchedule: (assignments: DayAssignment[]) => void;
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
  onCycleStatus,
  onAutoSchedule,
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

  const renderRow = (task: AgendaTask, scheduled: boolean) => {
    const isDone = task.status === "DONE";
    const days = task.daysOfWeek;
    return (
      <div key={task.id} className={`agenda-row${isDone ? " is-done" : ""}`}>
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
            <button
              type="button"
              className="agenda-delete"
              onClick={() => onDeleteItem(task.taskGroupId, viewOffset, task.id)}
              title={t.delete}
              aria-label={t.delete}
            >
              <Trash size={12} />
            </button>
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

      {isPast && <p className="agenda-readonly">{t.readOnlyNotice}</p>}

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
              const shown = visibleTasks(tasks);
              const dayDone = tasks.filter((task) => task.status === "DONE").length;
              const isToday = isCurrentWeek && isDayToday(weekStart, day);
              const dateLabel = dayDateLabel(weekStart, day);

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
                    <div className="agenda-day-list">{shown.map((task) => renderRow(task, true))}</div>
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

      <style>{`
        .agenda-shell {
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
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 1.25rem 0.875rem;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
        }
        .agenda-head-main { min-width: 0; }
        .agenda-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin: 0 0 0.2rem;
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--text-faint);
        }
        .agenda-today-chip,
        .agenda-past-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.05rem 0.375rem;
          border-radius: var(--radius-pill);
          font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
          font-size: 0.5625rem;
          font-weight: 650;
          letter-spacing: 0.02em;
        }
        .agenda-today-chip { background: var(--accent-bg); color: var(--accent); }
        .agenda-past-chip { background: var(--bg-alt); color: var(--text-muted); }
        .agenda-title {
          margin: 0;
          font-size: 1.1875rem;
          font-weight: 650;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .agenda-sub {
          margin: 0.2rem 0 0;
          font-size: 0.78125rem;
          line-height: 1.45;
          color: var(--text-muted);
          max-width: 56ch;
        }
        .agenda-head-side {
          display: flex;
          align-items: flex-end;
          gap: 0.875rem;
          flex-wrap: wrap;
        }
        .agenda-progress { min-width: 148px; display: flex; flex-direction: column; gap: 0.25rem; }
        .agenda-progress-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.71875rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }
        .agenda-progress-label b { font-weight: 620; color: var(--text); }
        .agenda-progress-track {
          height: 4px;
          border-radius: var(--radius-pill);
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
          gap: 0.375rem;
          height: 28px;
          padding: 0 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.71875rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: color 0.14s ease, border-color 0.14s ease, background 0.14s ease;
        }
        .agenda-toggle:hover { color: var(--text); border-color: var(--border-mid); }
        .agenda-toggle-box {
          width: 12px;
          height: 12px;
          border: 1.5px solid var(--border-mid);
          border-radius: 3px;
          flex-shrink: 0;
        }
        .agenda-toggle[aria-pressed="true"] {
          color: var(--text);
          background: var(--bg-alt);
          border-color: var(--border-mid);
        }
        .agenda-toggle[aria-pressed="true"] .agenda-toggle-box {
          border-color: var(--accent);
          background: var(--accent)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")
            center / 9px no-repeat;
        }
        .agenda-readonly {
          margin: 0;
          padding: 0.5rem 1.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--bg-alt);
          border-bottom: 1px solid var(--border);
        }
        .agenda-body {
          padding: 1rem 1.25rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .agenda-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (max-width: 1199px) {
          .agenda-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 899px) {
          .agenda-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        .agenda-card {
          border: 1px solid var(--border-mid);
          border-radius: var(--radius);
          background: var(--card-bg);
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .agenda-card.is-today { border-color: var(--accent); }
        .agenda-unscheduled {
          border-style: dashed;
          border-color: var(--border-mid);
          background: var(--bg-alt);
        }
        .agenda-card-head {
          padding: 0.5rem 0.75rem 0.4rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .agenda-day .agenda-card-head { flex-direction: row; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .agenda-card-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          min-width: 0;
        }
        .agenda-card-title h2 {
          margin: 0;
          font-size: 0.8125rem;
          font-weight: 620;
          color: var(--text);
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .agenda-date {
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.6875rem;
          color: var(--text-faint);
          font-variant-numeric: tabular-nums;
        }
        .agenda-card.is-today .agenda-card-title h2 { color: var(--accent); }
        .agenda-count {
          font-size: 0.65625rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--border);
          border-radius: var(--radius-pill);
          padding: 0.05rem 0.375rem;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .agenda-auto {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
          height: 24px;
          padding: 0 0.5rem;
          border: 1px solid transparent;
          border-radius: var(--radius-pill);
          background: var(--accent-bg);
          color: var(--accent);
          font-family: inherit;
          font-size: 0.6875rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.14s ease, color 0.14s ease;
        }
        .agenda-auto:hover { background: var(--accent); color: #fff; }
        .agenda-card-hint {
          margin: 0;
          font-size: 0.71875rem;
          line-height: 1.4;
          color: var(--text-muted);
        }
        .agenda-day-list,
        .agenda-unscheduled-list {
          padding: 0.35rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .agenda-unscheduled-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          column-gap: 0.75rem;
        }
        .agenda-card-empty {
          margin: 0;
          padding: 0.55rem 0.75rem;
          font-size: 0.75rem;
          font-style: italic;
          color: var(--text-faint);
        }
        .agenda-row {
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          padding: 0.25rem 0.25rem;
          border-radius: var(--radius-sm);
          min-width: 0;
          transition: background 0.12s ease;
        }
        .agenda-row:hover { background: var(--bg-alt); }
        .agenda-card.is-today .agenda-row:hover { background: var(--accent-bg); }
        .agenda-status {
          background: none;
          border: none;
          padding: 1px 0 0;
          display: flex;
          flex-shrink: 0;
          cursor: pointer;
        }
        .agenda-status:disabled { cursor: default; }
        .agenda-task {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          padding: 0;
          border: none;
          background: none;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          color: var(--text);
        }
        .agenda-task-content {
          font-size: 0.8125rem;
          line-height: 1.4;
          color: var(--text-muted);
          word-break: break-word;
        }
        .agenda-row.is-done .agenda-task-content {
          color: var(--text-faint);
          text-decoration: line-through;
        }
        .agenda-meta {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
        }
        .agenda-group {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          min-width: 0;
          max-width: 100%;
          font-size: 0.65625rem;
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
          gap: 0.15rem;
          min-width: 0;
          max-width: 140px;
          font-size: 0.65625rem;
          color: var(--text-faint);
          flex-shrink: 0;
        }
        .agenda-repeat > span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .agenda-note { display: inline-flex; color: var(--accent); opacity: 0.85; flex-shrink: 0; }
        .agenda-row-actions {
          display: flex;
          align-items: center;
          gap: 0.15rem;
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
          gap: 0.2rem;
          max-width: 150px;
          padding: 0.1rem 0.25rem;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 0.65625rem;
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
          width: 212px;
          padding: 0.4rem;
          border: 1px solid var(--border-mid);
          border-radius: var(--radius);
          background: var(--card-bg);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .agenda-daypick-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.25rem;
        }
        .agenda-daypick-day {
          height: 28px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg);
          color: var(--text-muted);
          font-family: inherit;
          font-size: 0.6875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
        }
        .agenda-daypick-day:hover { border-color: var(--accent); color: var(--accent); }
        .agenda-daypick-day[aria-pressed="true"] {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          font-weight: 600;
        }
        .agenda-daypick-quick {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          height: 26px;
          border: 1px dashed var(--border-mid);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 0.65625rem;
          cursor: pointer;
        }
        .agenda-daypick-quick:hover { color: var(--accent); border-color: var(--accent); }
        .agenda-daypick-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.3rem;
          padding-top: 0.1rem;
          border-top: 1px solid var(--border);
        }
        .agenda-daypick-clear {
          border: none;
          background: none;
          padding: 0.2rem 0.25rem;
          color: var(--text-faint);
          font-family: inherit;
          font-size: 0.65625rem;
          cursor: pointer;
        }
        .agenda-daypick-clear:hover { color: #DC2626; }
        .agenda-daypick-apply {
          padding: 0.22rem 0.55rem;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: #fff;
          font-family: inherit;
          font-size: 0.6875rem;
          font-weight: 600;
          cursor: pointer;
        }
        .agenda-delete {
          background: none;
          border: none;
          padding: 0.15rem;
          display: flex;
          color: var(--text-faint);
          cursor: pointer;
        }
        .agenda-delete:hover { color: var(--red, #DC2626); }
        .agenda-card-foot {
          border-top: 1px solid var(--border);
          padding: 0.3rem 0.5rem 0.4rem;
          margin-top: auto;
        }
        .agenda-add {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0;
          border: none;
          background: none;
          color: var(--text-faint);
          font-family: inherit;
          font-size: 0.71875rem;
          cursor: pointer;
          transition: color 0.12s ease;
        }
        .agenda-add:hover { color: var(--accent); }
        .agenda-composer { display: flex; flex-direction: column; gap: 0.3rem; }
        .agenda-composer-group {
          width: 100%;
          padding: 0.2rem 0.3rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--card-bg);
          color: var(--text-muted);
          font-family: inherit;
          font-size: 0.6875rem;
          outline: none;
        }
        .agenda-composer-row { display: flex; align-items: center; gap: 0.3rem; }
        .agenda-composer-row input {
          flex: 1;
          min-width: 0;
          padding: 0.22rem 0.4rem;
          border: 1px solid var(--accent);
          border-radius: var(--radius-sm);
          background: var(--card-bg);
          color: var(--text);
          font-family: inherit;
          font-size: 0.75rem;
          outline: none;
        }
        .agenda-composer-row input:focus-visible {
          box-shadow: 0 0 0 3px var(--accent-bg);
        }
        .agenda-composer-submit {
          padding: 0.22rem 0.5rem;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--accent);
          color: #fff;
          font-family: inherit;
          font-size: 0.6875rem;
          font-weight: 550;
          cursor: pointer;
          white-space: nowrap;
        }
        .agenda-composer-submit:disabled { opacity: 0.45; cursor: default; }
        .agenda-composer-cancel {
          display: flex;
          padding: 0.2rem;
          border: none;
          background: none;
          color: var(--text-faint);
          cursor: pointer;
        }
        .agenda-empty {
          margin: 2rem auto;
          max-width: 420px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .agenda-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent-bg);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .agenda-empty h2 { margin: 0; font-size: 1.0625rem; font-weight: 650; color: var(--text); }
        .agenda-empty p { margin: 0 0 0.35rem; font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); }
        .agenda-task:focus-visible,
        .agenda-status:focus-visible,
        .agenda-add:focus-visible,
        .agenda-delete:focus-visible,
        .agenda-toggle:focus-visible,
        .agenda-auto:focus-visible,
        .agenda-daypick-btn:focus-visible,
        .agenda-daypick-day:focus-visible,
        .agenda-daypick-quick:focus-visible,
        .agenda-daypick-clear:focus-visible,
        .agenda-daypick-apply:focus-visible,
        .agenda-composer-submit:focus-visible,
        .agenda-composer-cancel:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-radius: var(--radius-sm);
        }
        .agenda-status:focus:not(:focus-visible),
        .agenda-add:focus:not(:focus-visible),
        .agenda-task:focus:not(:focus-visible) { outline: none; }
        @media (max-width: 767px) {
          .agenda-head { padding: 0.75rem 0.75rem 0.625rem; }
          .agenda-sub { display: none; }
          .agenda-title { font-size: 1.0625rem; }
          .agenda-body { padding: 0.75rem 0.75rem 1.5rem; }
          .agenda-grid { grid-template-columns: 1fr; }
          .agenda-unscheduled-list { grid-template-columns: 1fr; }
          .agenda-row-actions { opacity: 1; }
        }
        @media (hover: none) {
          .agenda-row-actions { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .agenda-progress-track > span { transition: none; }
        }
      `}</style>
    </div>
  );
}
