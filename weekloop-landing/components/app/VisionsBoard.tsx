"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  Flag,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { getWeekRange, type TaskGroup, type WorkItemData, type WorkItemStatus } from "@/lib/mockData";
import { useLanguage } from "@/lib/languageContext";
import {
  exclusiveVisions,
  formatHorizonDate,
  groupsInVision,
  normalizeHorizon,
  parseVisionDraft,
  sortVisions,
  unassignedGroups,
  excludedWeeksForGroup,
  visiblePlannerTasks,
  visionOwningGroup,
  type VisionDraft,
  type VisionRecord,
  type VisionStatus,
} from "@/lib/visions";

const GROUP_COLORS = ["#16A34A", "#7C3AED", "#D97706", "#2563EB", "#DC2626", "#0D9488"];

function progressText(total: number, isVietnamese: boolean): string {
  if (total === 0) return isVietnamese ? "Không có việc đang mở" : "No open tasks";
  return isVietnamese ? `${total} việc đang mở` : `${total} open tasks`;
}

function horizonText(value: string, isVietnamese: boolean): string {
  return formatHorizonDate(value, isVietnamese ? "vi-VN" : "en-GB") || value;
}

function openTasksForGroup(
  groupId: string,
  workItemsMap: Record<string, WorkItemData[]>,
  viewOffset: number,
  excludedByWeek: Record<number, (string | number)[]>,
) {
  return visiblePlannerTasks(groupId, workItemsMap, {
    viewOffset,
    excludedWeeks: excludedWeeksForGroup(groupId, excludedByWeek),
  });
}

function countOpenTasks(
  groupIds: string[],
  workItemsMap: Record<string, WorkItemData[]>,
  viewOffset: number,
  excludedByWeek: Record<number, (string | number)[]>,
): number {
  return groupIds.reduce(
    (total, id) => total + openTasksForGroup(id, workItemsMap, viewOffset, excludedByWeek).reduce((sum, week) => sum + week.items.length, 0),
    0,
  );
}

function GroupTasks({
  groupId,
  workItemsMap,
  viewOffset,
  excludedByWeek,
}: {
  groupId: string;
  workItemsMap: Record<string, WorkItemData[]>;
  viewOffset: number;
  excludedByWeek: Record<number, (string | number)[]>;
}) {
  const { t } = useLanguage();
  const weeks = openTasksForGroup(groupId, workItemsMap, viewOffset, excludedByWeek);
  if (weeks.length === 0) return <p className="vision-empty-copy">{t.noTasksInGroup}</p>;
  const labels: Record<WorkItemStatus, string> = {
    TODO: t.todoStatus,
    IN_PROGRESS: t.inProgressStatus,
    DONE: t.doneStatus,
  };
  return (
    <div className="vision-task-weeks">
      {weeks.map((week) => (
        <div key={week.weekOffset}>
          <p className="vision-week-label">{getWeekRange(week.weekOffset)}</p>
          <ul className="vision-task-list">
            {week.items.map((item) => (
              <li key={item.id} className={item.status === "DONE" ? "is-done" : undefined}>
                <span className={`vision-task-status is-${item.status.toLowerCase()}`}>{labels[item.status]}</span>
                <span className="vision-task-content">{item.content}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="vision-field">
      <label htmlFor={id} className="vision-field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="vision-field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="vision-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function VisionLens({
  visions,
  value,
  onChange,
}: {
  visions: VisionRecord[];
  value: string;
  onChange: (visionId: string) => void;
}) {
  const { t } = useLanguage();
  const ordered = useMemo(() => sortVisions(exclusiveVisions(visions)), [visions]);
  if (ordered.length === 0) return null;

  return (
    <div className="vision-lens" role="toolbar" aria-label={t.visions}>
      <button
        type="button"
        className="vision-chip"
        aria-pressed={value === "all"}
        onClick={() => onChange("all")}
      >
        {t.allGroups}
      </button>
      {ordered.map((vision) => (
        <button
          key={vision.id}
          type="button"
          className="vision-chip"
          aria-pressed={value === vision.id}
          onClick={() => onChange(vision.id)}
        >
          {vision.title}
        </button>
      ))}
      <style>{`
        .vision-lens {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .vision-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          max-width: 240px;
          padding: 0 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--card-bg);
          color: var(--text-muted);
          font: inherit;
          font-size: 0.78125rem;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: 0;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.12s ease;
        }
        .vision-chip:hover {
          background: color-mix(in srgb, var(--text) 4%, var(--card-bg));
          color: var(--text);
        }
        .vision-chip:active {
          transform: scale(0.98);
        }
        .vision-chip[aria-pressed="true"] {
          background: var(--accent-bg);
          border-color: var(--accent);
          color: var(--accent-contrast);
          font-weight: 700;
        }
        .vision-chip[aria-pressed="true"]:hover {
          background: color-mix(in srgb, var(--accent) 20%, var(--card-bg));
          color: var(--accent-contrast);
        }
        .vision-chip:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .vision-lens {
            padding: 8px 16px;
          }
          .vision-chip {
            min-height: 36px;
            padding: 0 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vision-chip {
            transition: none;
          }
          .vision-chip:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

function VisionSection({
  vision,
  catalog,
  groups,
  goalsMap,
  workItemsMap,
  viewOffset,
  excludedByWeek,
  attachOpen,
  createOpen,
  onToggleAttach,
  onToggleCreate,
  onEdit,
  onStatus,
  onDelete,
  onAttach,
  onDetach,
  onCreateGroup,
  onViewWeek,
}: {
  vision: VisionRecord;
  catalog: VisionRecord[];
  groups: TaskGroup[];
  goalsMap: Record<string, string>;
  workItemsMap: Record<string, WorkItemData[]>;
  viewOffset: number;
  excludedByWeek: Record<number, (string | number)[]>;
  attachOpen: boolean;
  createOpen: boolean;
  onToggleAttach: () => void;
  onToggleCreate: () => void;
  onEdit: (draft: VisionDraft) => Promise<void>;
  onStatus: (status: VisionStatus) => Promise<void>;
  onDelete: () => Promise<void>;
  onAttach: (groupId: string) => Promise<void>;
  onDetach: (groupId: string) => Promise<void>;
  onCreateGroup: (name: string, color: string) => Promise<void>;
  onViewWeek: () => void;
}) {
  const { t, isVietnamese } = useLanguage();
  const linked = groupsInVision(vision, groups);
  const progress = countOpenTasks(
    linked.map((group) => String(group.id)),
    workItemsMap,
    viewOffset,
    excludedByWeek,
  );
  const candidates = groups.filter((group) => !vision.taskGroupIds.includes(String(group.id)) && !String(group.id).startsWith("temp-"));
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(vision.title);
  const [outcome, setOutcome] = useState(vision.outcome);
  const [horizon, setHorizon] = useState(normalizeHorizon(vision.horizon));
  const [titleError, setTitleError] = useState("");
  const [horizonError, setHorizonError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState(GROUP_COLORS[0]);
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setTitle(vision.title);
    setOutcome(vision.outcome);
    setHorizon(normalizeHorizon(vision.horizon));
    setTitleError("");
    setHorizonError("");
    setEditing(true);
    setConfirmDelete(false);
  };

  const saveEdit = async () => {
    const parsed = parseVisionDraft({ title, outcome, horizon });
    if (!parsed.ok) {
      setTitleError(parsed.error === "title" ? t.titleRequired : "");
      setHorizonError(parsed.error === "horizon" ? t.horizonInvalid : "");
      return;
    }
    setBusy(true);
    try {
      await onEdit(parsed.draft);
      setEditing(false);
    } catch {
      setTitleError("");
    } finally {
      setBusy(false);
    }
  };

  const submitGroup = async (event: FormEvent) => {
    event.preventDefault();
    const name = groupName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await onCreateGroup(name, groupColor);
      setGroupName("");
    } catch {
      // The parent reports the failure. Keep the typed name for a retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id={`vision-${vision.id}`} className="vision-section" aria-labelledby={`vision-title-${vision.id}`}>
      <div className={`vision-card-head${editing ? " is-editing" : ""}`}>
        {editing ? (
          <form
            className="vision-edit-form"
            onSubmit={(event) => {
              event.preventDefault();
              void saveEdit();
            }}
          >
            <Field id={`vision-title-input-${vision.id}`} label={t.visionTitleLabel} error={titleError}>
              <input
                id={`vision-title-input-${vision.id}`}
                className="vision-input"
                value={title}
                maxLength={80}
                autoFocus
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleError) setTitleError("");
                }}
              />
            </Field>
            <Field id={`vision-outcome-${vision.id}`} label={t.visionOutcomeLabel} hint={t.outcomeHint}>
              <input
                id={`vision-outcome-${vision.id}`}
                className="vision-input"
                value={outcome}
                maxLength={180}
                placeholder={t.visionOutcomePlaceholder}
                onChange={(event) => setOutcome(event.target.value)}
              />
            </Field>
            <Field id={`vision-horizon-${vision.id}`} label={t.visionHorizonLabel} error={horizonError}>
              <input
                id={`vision-horizon-${vision.id}`}
                className="vision-input"
                type="date"
                value={horizon}
                onChange={(event) => {
                  setHorizon(event.target.value);
                  if (horizonError) setHorizonError("");
                }}
              />
            </Field>
            <div className="vision-form-actions">
              <button type="button" className="vision-ghost-btn" onClick={() => setEditing(false)} disabled={busy}>
                {t.cancel}
              </button>
              <button type="submit" className="vision-primary-btn" disabled={busy}>
                {t.save}
              </button>
            </div>
          </form>
        ) : (
          <div className="vision-title-block">
            <h2 id={`vision-title-${vision.id}`} className="vision-title">
              {vision.title}
            </h2>
            {vision.outcome ? <p className="vision-outcome">{vision.outcome}</p> : null}
            <p className="vision-meta">
              {vision.horizon ? (
                <span className="vision-horizon">
                  <CalendarBlank size={12} aria-hidden />
                  {horizonText(vision.horizon, isVietnamese)}
                </span>
              ) : null}
              <span className="vision-progress">{progressText(progress, isVietnamese)}</span>
            </p>
          </div>
        )}
      </div>

      {!editing && (
        <div className="vision-card-body">
          <div className="vision-toolbar">
            <label className="vision-status" data-status={vision.status} htmlFor={`vision-status-${vision.id}`}>
              <span className="vision-status-pill">
                <span className="vision-status-dot" aria-hidden />
                <select
                  id={`vision-status-${vision.id}`}
                  className="vision-status-select"
                  aria-label={t.visionStatusLabel}
                  value={vision.status}
                  onChange={(event) => {
                    void onStatus(event.target.value as VisionStatus).catch(() => undefined);
                  }}
                >
                  <option value="active">{t.visionStatusActive}</option>
                  <option value="paused">{t.visionStatusPaused}</option>
                  <option value="achieved">{t.visionStatusAchieved}</option>
                </select>
                <CaretDown size={12} weight="bold" aria-hidden />
              </span>
            </label>
            <div className="vision-toolbar-actions">
              <button type="button" className="vision-ghost-btn" onClick={onViewWeek}>
                <ArrowRight size={15} aria-hidden />
                {t.viewWeek}
              </button>
              <button type="button" className="vision-ghost-btn" onClick={startEdit}>
                <PencilSimple size={15} aria-hidden />
                {t.editVision}
              </button>
            </div>
          </div>

          <div className="vision-groups">
            <div className="vision-groups-head">
              <h3>{t.visionGroupsLabel}</h3>
              <span className="vision-count-badge" aria-hidden>
                {linked.length}
              </span>
            </div>
            {linked.length === 0 ? (
              <p className="vision-empty-copy">{t.noGroupsInVision}</p>
            ) : (
              <ul className="vision-group-stack">
                {linked.map((group) => {
                  const goal = goalsMap[`${group.id}:0`] ?? "";
                  const groupProgress = countOpenTasks([String(group.id)], workItemsMap, viewOffset, excludedByWeek);
                  return (
                    <li key={group.id} className="vision-group-block">
                      <div className="vision-group-head">
                        <span className="vision-dot" style={{ background: group.color }} aria-hidden />
                        <div className="vision-group-main">
                          <div className="vision-group-name">
                            <span>{group.name}</span>
                            {groupProgress > 0 && <span className="vision-count">{groupProgress}</span>}
                          </div>
                          {goal ? <p className="vision-goal">{goal}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="vision-detach"
                          onClick={() => {
                            void onDetach(String(group.id)).catch(() => undefined);
                          }}
                          title={isVietnamese ? "Gỡ khỏi tầm nhìn, không xóa nhóm việc" : "Remove from this vision. The group stays."}
                          aria-label={t.detachGroup}
                        >
                          <X size={16} weight="bold" aria-hidden />
                        </button>
                      </div>
                      <GroupTasks
                        groupId={String(group.id)}
                        workItemsMap={workItemsMap}
                        viewOffset={viewOffset}
                        excludedByWeek={excludedByWeek}
                      />
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="vision-group-actions">
              <button
                type="button"
                className="vision-ghost-btn vision-dropdown-btn"
                aria-expanded={attachOpen}
                onClick={onToggleAttach}
              >
                {t.attachGroup}
                <CaretDown size={13} weight="bold" className="vision-dropdown-caret" aria-hidden />
              </button>
              <button
                type="button"
                className="vision-ghost-btn"
                aria-expanded={createOpen}
                onClick={onToggleCreate}
              >
                <Plus size={14} weight="bold" aria-hidden />
                {t.createGroupInVision}
              </button>
            </div>

            {attachOpen && (
              <div className="vision-picker" id={`vision-attach-${vision.id}`}>
                <p className="vision-picker-hint">
                  {isVietnamese
                    ? "Chọn nhóm việc để gắn vào tầm nhìn này. Nhóm đang ở tầm nhìn khác sẽ được chuyển sang đây."
                    : "Choose a group to attach. A group in another vision moves here."}
                </p>
                {candidates.length === 0 ? (
                  <p className="vision-empty-copy">
                    {isVietnamese ? "Không còn nhóm việc nào để gắn." : "No other groups to attach."}
                  </p>
                ) : (
                  <ul className="vision-group-list">
                    {candidates.map((group) => (
                      <CandidateRow
                        key={group.id}
                        group={group}
                        visions={catalog}
                        onAttach={() => void onAttach(String(group.id))}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {createOpen && (
              <form className="vision-picker" onSubmit={(event) => void submitGroup(event)}>
                <p className="vision-picker-hint">
                  {isVietnamese
                    ? "Nhóm việc mới sẽ thuộc tầm nhìn này."
                    : "The new group will belong to this vision."}
                </p>
                <Field id={`new-group-${vision.id}`} label={t.groupNameLabel}>
                  <input
                    id={`new-group-${vision.id}`}
                    className="vision-input"
                    value={groupName}
                    maxLength={150}
                    autoFocus
                    placeholder={t.groupNamePlaceholder}
                    onChange={(event) => setGroupName(event.target.value)}
                  />
                </Field>
                <div className="vision-colors" role="group" aria-label={t.categoryColor}>
                  {GROUP_COLORS.map((color, index) => (
                    <button
                      key={color}
                      type="button"
                      aria-pressed={groupColor === color}
                      aria-label={(isVietnamese
                        ? ["Xanh lá", "Tím", "Hổ phách", "Xanh dương", "Đỏ", "Xanh mòng két"]
                        : ["Green", "Purple", "Amber", "Blue", "Red", "Teal"])[index]}
                      className="vision-color"
                      style={{ background: color }}
                      onClick={() => setGroupColor(color)}
                    />
                  ))}
                </div>
                <div className="vision-picker-actions">
                  <button type="submit" className="vision-primary-btn" disabled={busy || !groupName.trim()}>
                    {t.createGroupInVision}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="vision-footer">
            {confirmDelete ? (
              <div className="vision-confirm">
                <p>{t.deleteVisionConfirm}</p>
                <div className="vision-confirm-actions">
                  <button type="button" className="vision-ghost-btn" onClick={() => setConfirmDelete(false)}>
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    className="vision-danger-btn is-confirm"
                    onClick={() => {
                      void onDelete().catch(() => undefined);
                    }}
                  >
                    <Trash size={14} aria-hidden />
                    {t.deleteVision}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="vision-danger-btn" onClick={() => setConfirmDelete(true)}>
                <Trash size={14} aria-hidden />
                {t.deleteVision}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CandidateRow({
  group,
  visions,
  onAttach,
}: {
  group: TaskGroup;
  visions: VisionRecord[];
  onAttach: () => void;
}) {
  const { t } = useLanguage();
  const owner = visionOwningGroup(visions, group.id);
  return (
    <li className="vision-candidate">
      <span className="vision-dot" style={{ background: group.color }} aria-hidden />
      <div className="vision-candidate-main">
        <div className="vision-group-name">
          <span>{group.name}</span>
        </div>
        <p className="vision-goal">{owner ? `${t.ownedBy} ${owner.title}` : t.notInVision}</p>
      </div>
      <button type="button" className="vision-attach-btn" onClick={onAttach}>
        {owner ? t.moveIntoVision : t.attachIntoVision}
      </button>
    </li>
  );
}

export default function VisionsBoard({
  visions,
  ready,
  groups,
  goalsMap,
  workItemsMap,
  viewOffset,
  excludedByWeek,
  manageRequest,
  onCreateVision,
  onUpdateVision,
  onDeleteVision,
  onAttachGroup,
  onDetachGroup,
  onCreateGroup,
  onViewWeek,
}: {
  visions: VisionRecord[];
  ready: boolean;
  groups: TaskGroup[];
  goalsMap: Record<string, string>;
  workItemsMap: Record<string, WorkItemData[]>;
  viewOffset: number;
  excludedByWeek: Record<number, (string | number)[]>;
  manageRequest: { id: string; nonce: number } | null;
  onCreateVision: (draft: VisionDraft) => Promise<string>;
  onUpdateVision: (id: string, patch: Partial<Pick<VisionRecord, "title" | "outcome" | "horizon" | "status">>) => Promise<void>;
  onDeleteVision: (id: string) => Promise<void>;
  onAttachGroup: (visionId: string, groupId: string) => Promise<void>;
  onDetachGroup: (visionId: string, groupId: string) => Promise<void>;
  onCreateGroup: (visionId: string, name: string, color: string) => Promise<void>;
  onViewWeek: (visionId: string) => void;
}) {
  const { t } = useLanguage();
  const owned = useMemo(() => exclusiveVisions(visions), [visions]);
  const ordered = useMemo(() => sortVisions(owned), [owned]);
  const loose = useMemo(() => unassignedGroups(owned, groups), [owned, groups]);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [horizon, setHorizon] = useState("");
  const [titleError, setTitleError] = useState("");
  const [horizonError, setHorizonError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [createId, setCreateId] = useState<string | null>(null);
  const [seenNonce, setSeenNonce] = useState(0);
  const [scrollToken, setScrollToken] = useState<string | null>(null);

  if (
    manageRequest &&
    manageRequest.nonce !== seenNonce &&
    owned.some((vision) => vision.id === manageRequest.id)
  ) {
    setSeenNonce(manageRequest.nonce);
    setAttachId(manageRequest.id);
    setCreateId(null);
    setScrollToken(String(manageRequest.nonce));
  }

  useEffect(() => {
    if (!scrollToken || !attachId) return;
    document.getElementById(`vision-${attachId}`)?.scrollIntoView({ block: "start" });
  }, [scrollToken, attachId]);

  const submitVision = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseVisionDraft({ title, outcome, horizon });
    if (!parsed.ok) {
      setTitleError(parsed.error === "title" ? t.titleRequired : "");
      setHorizonError(parsed.error === "horizon" ? t.horizonInvalid : "");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const id = await onCreateVision(parsed.draft);
      setTitle("");
      setOutcome("");
      setHorizon("");
      setFormOpen(false);
      setAttachId(id);
      setCreateId(null);
      setScrollToken(id);
    } catch {
      setFormError(t.couldNotSaveVision);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="visions-board">
      <header className="visions-header">
        <div className="visions-header-text">
          <h1>{t.visions}</h1>
          <p>{t.visionsIntro}</p>
        </div>
        {ordered.length > 0 && !formOpen && (
          <button type="button" className="vision-primary-btn vision-new-btn" onClick={() => setFormOpen(true)}>
            <Plus size={15} weight="bold" aria-hidden />
            {t.addVision}
          </button>
        )}
      </header>

      <div className="vision-grid">
        {formOpen && (
          <form className="vision-section vision-create" onSubmit={(event) => void submitVision(event)}>
            <Field id="new-vision-title" label={t.visionTitleLabel} error={titleError}>
              <input
                id="new-vision-title"
                className="vision-input"
                value={title}
                maxLength={80}
                autoFocus
                placeholder={t.visionTitlePlaceholder}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (titleError) setTitleError("");
                }}
              />
            </Field>
            <Field id="new-vision-outcome" label={t.visionOutcomeLabel} hint={t.outcomeHint}>
              <input
                id="new-vision-outcome"
                className="vision-input"
                value={outcome}
                maxLength={180}
                placeholder={t.visionOutcomePlaceholder}
                onChange={(event) => setOutcome(event.target.value)}
              />
            </Field>
            <Field id="new-vision-horizon" label={t.visionHorizonLabel} hint={t.visionHorizonPlaceholder} error={horizonError}>
              <input
                id="new-vision-horizon"
                className="vision-input"
                type="date"
                value={horizon}
                onChange={(event) => {
                  setHorizon(event.target.value);
                  if (horizonError) setHorizonError("");
                }}
              />
            </Field>
            <div className="vision-create-actions">
              {formError ? (
                <p className="vision-field-error" role="alert">
                  {formError}
                </p>
              ) : null}
              <button
                type="button"
                className="vision-ghost-btn"
                onClick={() => {
                  setFormOpen(false);
                  setTitleError("");
                  setHorizonError("");
                  setFormError("");
                }}
              >
                {t.cancel}
              </button>
              <button type="submit" className="vision-primary-btn" disabled={saving}>
                {t.createVision}
              </button>
            </div>
          </form>
        )}

        {!ready ? (
          <div className="visions-skeleton" aria-hidden>
            <div />
            <div />
          </div>
        ) : ordered.length === 0 && !formOpen ? (
          <div className="vision-empty">
            <div className="vision-empty-mark" aria-hidden>
              <Flag size={32} weight="duotone" />
            </div>
            <h2>{t.visionEmptyTitle}</h2>
            <p>{groups.length > 0 ? t.visionEmptyWithGroups : t.visionEmptyBody}</p>
            <button type="button" className="vision-primary-btn" onClick={() => setFormOpen(true)}>
              <Plus size={15} weight="bold" aria-hidden />
              {t.addVision}
            </button>
          </div>
        ) : (
          ordered.map((vision) => (
            <VisionSection
              key={vision.id}
              vision={vision}
              catalog={owned}
              groups={groups}
              goalsMap={goalsMap}
              workItemsMap={workItemsMap}
              viewOffset={viewOffset}
              excludedByWeek={excludedByWeek}
              attachOpen={attachId === vision.id}
              createOpen={createId === vision.id}
              onToggleAttach={() => {
                setAttachId((current) => (current === vision.id ? null : vision.id));
                setCreateId(null);
              }}
              onToggleCreate={() => {
                setCreateId((current) => (current === vision.id ? null : vision.id));
                setAttachId(null);
              }}
              onEdit={(draft) => onUpdateVision(vision.id, draft)}
              onStatus={(status) => onUpdateVision(vision.id, { status })}
              onDelete={() => onDeleteVision(vision.id)}
              onAttach={(groupId) => onAttachGroup(vision.id, groupId).catch(() => undefined)}
              onDetach={(groupId) => onDetachGroup(vision.id, groupId)}
              onCreateGroup={(name, color) => onCreateGroup(vision.id, name, color)}
              onViewWeek={() => onViewWeek(vision.id)}
            />
          ))
        )}

        {ready && ordered.length > 0 && loose.length > 0 && (
          <section className="vision-loose" aria-labelledby="unassigned-groups">
            <div className="vision-loose-head">
              <h2 id="unassigned-groups">{t.unassignedGroups}</h2>
              <span className="vision-count-badge" aria-hidden>
                {loose.length}
              </span>
            </div>
            <p>{t.unassignedHint}</p>
            <ul>
              {loose.map((group) => (
                <li key={group.id}>
                  <span className="vision-dot" style={{ background: group.color }} aria-hidden />
                  <span>{group.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <style>{`
        .visions-board {
          width: 100%;
          padding: 24px 24px 48px;
          display: grid;
          gap: 16px;
        }
        .visions-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px 16px;
        }
        .visions-header-text {
          min-width: 0;
        }
        .visions-header h1 {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.3;
          color: var(--text);
        }
        .visions-header p {
          margin: 6px 0 0;
          max-width: 68ch;
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .vision-new-btn {
          flex-shrink: 0;
          margin-left: auto;
          min-height: 42px;
          padding: 0 18px;
          font-size: 0.84375rem;
        }
        .vision-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
          gap: 16px;
          align-items: start;
        }
        .vision-section {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          scroll-margin-top: 16px;
          transition: background 0.18s ease, border-color 0.18s ease;
        }
        .vision-section:not(.vision-create):hover {
          background: color-mix(in srgb, var(--text) 2%, var(--card-bg));
          border-color: var(--border-mid);
        }
        .vision-card-head {
          padding: 14px 16px 12px;
          background: color-mix(in srgb, var(--accent) 7%, var(--card-bg));
          border-bottom: 1px solid var(--border);
        }
        .vision-card-head.is-editing {
          background: var(--card-bg);
        }
        .vision-title-block {
          min-width: 0;
        }
        .vision-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.005em;
          color: var(--text);
          overflow-wrap: anywhere;
        }
        .vision-outcome {
          margin: 6px 0 0;
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .vision-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px 10px;
          margin: 10px 0 0;
        }
        .vision-horizon {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: var(--text-faint);
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.3;
        }
        .vision-progress {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          color: var(--accent-contrast);
          font-size: 0.6875rem;
          font-weight: 650;
          line-height: 1.25;
        }
        .vision-card-body {
          display: grid;
          gap: 14px;
          padding: 14px 16px 16px;
        }
        .vision-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .vision-toolbar-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-left: auto;
        }
        .vision-status {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .vision-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 36px;
          padding: 0 10px 0 9px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-alt);
          color: var(--text-muted);
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        .vision-status:hover .vision-status-pill {
          border-color: var(--border-mid);
        }
        .vision-status:focus-within .vision-status-pill {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .vision-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          flex: none;
          background: currentColor;
        }
        .vision-status .vision-status-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 0.75rem;
          font-weight: 650;
          line-height: 1.3;
          letter-spacing: 0.01em;
          padding: 5px 0;
          cursor: pointer;
          max-width: 11rem;
        }
        .vision-status .vision-status-select:focus-visible {
          outline: none;
        }
        .vision-status-select option {
          background: var(--card-bg);
          color: var(--text);
        }
        .vision-status[data-status="active"] .vision-status-pill {
          background: var(--accent-ghost);
          border-color: color-mix(in srgb, var(--accent) 35%, transparent);
          color: var(--accent-contrast);
        }
        .vision-status[data-status="paused"] .vision-status-pill {
          background: color-mix(in srgb, var(--warning) 12%, var(--card-bg));
          border-color: color-mix(in srgb, var(--warning) 40%, transparent);
          color: color-mix(in srgb, var(--warning) 72%, var(--text));
        }
        .vision-status[data-status="achieved"] .vision-status-pill {
          background: var(--accent-bg);
          border-color: color-mix(in srgb, var(--accent) 55%, transparent);
          color: var(--accent-contrast);
        }
        .vision-status[data-status="active"] .vision-status-pill:hover {
          background: color-mix(in srgb, var(--accent) 14%, var(--card-bg));
        }
        .vision-status[data-status="achieved"] .vision-status-pill:hover {
          background: color-mix(in srgb, var(--accent) 20%, var(--card-bg));
        }
        .vision-status[data-status="paused"] .vision-status-pill:hover {
          background: color-mix(in srgb, var(--warning) 18%, var(--card-bg));
        }
        .vision-groups {
          display: grid;
          gap: 10px;
        }
        .vision-groups-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vision-groups h3 {
          margin: 0;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1.3;
          color: var(--text-muted);
        }
        .vision-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-alt);
          color: var(--text-muted);
          font-size: 0.6875rem;
          font-weight: 700;
          line-height: 1;
        }
        .vision-group-stack {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 6px;
        }
        .vision-group-block {
          padding: 4px 8px 6px;
          border-radius: var(--radius);
          border: 1px solid transparent;
          background: color-mix(in srgb, var(--text) 3.5%, transparent);
          transition: background 0.16s ease, border-color 0.16s ease;
        }
        .vision-group-block:hover {
          background: color-mix(in srgb, var(--text) 5%, transparent);
          border-color: var(--border);
        }
        .vision-group-head {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          padding: 2px 0;
        }
        .vision-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .vision-group-main {
          min-width: 0;
          flex: 1;
          display: grid;
          gap: 1px;
        }
        .vision-group-name {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: var(--text);
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.35;
        }
        .vision-group-name > span:first-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vision-count {
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 6px;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          color: var(--accent-contrast);
          font-size: 0.625rem;
          font-weight: 700;
          line-height: 1;
        }
        .vision-goal {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .vision-detach {
          flex: none;
          width: 36px;
          height: 36px;
          margin: -4px -4px -4px 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
          opacity: 0.45;
          transition: opacity 0.16s ease, background 0.16s ease, color 0.16s ease;
        }
        .vision-group-block:hover .vision-detach,
        .vision-group-block:focus-within .vision-detach {
          opacity: 1;
        }
        .vision-detach:hover {
          background: var(--danger-bg);
          color: var(--danger);
        }
        .vision-detach:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          opacity: 1;
        }
        @media (hover: none) {
          .vision-detach {
            opacity: 1;
          }
        }
        .vision-task-weeks {
          display: grid;
          gap: 6px;
          padding: 2px 4px 4px 20px;
        }
        .vision-week-label {
          margin: 0 0 2px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-faint);
          line-height: 1.3;
        }
        .vision-task-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 2px;
        }
        .vision-task-list li {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 2px 0;
          font-size: 0.8125rem;
          line-height: 1.35;
          color: var(--text-secondary);
        }
        .vision-task-status {
          flex-shrink: 0;
          width: 4.75rem;
          font-size: 0.625rem;
          font-weight: 700;
          line-height: 1.4;
          letter-spacing: 0.01em;
          color: var(--text-faint);
        }
        .vision-task-status.is-in_progress {
          color: color-mix(in srgb, var(--warning) 72%, var(--text));
        }
        .vision-task-status.is-done {
          color: var(--accent-contrast);
        }
        .vision-task-content {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .vision-task-list li.is-done .vision-task-content {
          color: var(--text-faint);
          text-decoration: line-through;
        }
        .vision-empty-copy {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.8125rem;
          line-height: 1.45;
        }
        .vision-group-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .vision-dropdown-caret {
          transition: transform 0.18s ease;
        }
        .vision-dropdown-btn[aria-expanded="true"] .vision-dropdown-caret {
          transform: rotate(180deg);
        }
        .vision-picker {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg-alt);
        }
        .vision-picker-hint {
          margin: 0;
          color: var(--text-muted);
          font-size: 0.78125rem;
          line-height: 1.45;
        }
        .vision-group-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 2px;
        }
        .vision-candidate {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 10px;
          transition: background 0.14s ease;
        }
        .vision-candidate:hover {
          background: color-mix(in srgb, var(--text) 5%, transparent);
        }
        .vision-candidate-main {
          min-width: 0;
          flex: 1;
          display: grid;
          gap: 1px;
        }
        .vision-attach-btn {
          flex: none;
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
          border-radius: 10px;
          background: var(--accent-ghost);
          color: var(--accent-contrast);
          font: inherit;
          font-size: 0.75rem;
          font-weight: 650;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease;
        }
        .vision-attach-btn:hover {
          background: var(--accent-bg);
          border-color: var(--accent);
        }
        .vision-attach-btn:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .vision-colors {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 2px 0;
        }
        .vision-color {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 0;
          padding: 0;
          cursor: pointer;
          transition: transform 0.14s ease, box-shadow 0.14s ease;
        }
        .vision-color:hover {
          transform: scale(1.08);
        }
        .vision-color[aria-pressed="true"] {
          box-shadow: 0 0 0 2px var(--bg-alt), 0 0 0 4px var(--accent);
        }
        .vision-color:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .vision-picker-actions {
          display: flex;
          justify-content: flex-end;
        }
        .vision-field {
          display: grid;
          gap: 6px;
          min-width: 0;
        }
        .vision-field-label {
          font-size: 0.75rem;
          font-weight: 650;
          letter-spacing: 0.01em;
          line-height: 1.35;
          color: var(--text-muted);
        }
        .vision-field-hint {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.45;
          color: var(--text-muted);
        }
        .vision-field-error {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.45;
          color: var(--danger);
        }
        .vision-edit-form {
          display: grid;
          gap: 12px;
        }
        .vision-form-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }
        .vision-input {
          width: 100%;
          min-width: 0;
          min-height: 42px;
          padding: 10px 12px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--input-bg);
          color: var(--text);
          font: inherit;
          font-size: 0.84375rem;
          line-height: 1.4;
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }
        .vision-input::placeholder {
          color: var(--text-faint);
        }
        .vision-input:hover {
          border-color: var(--border-mid);
        }
        .vision-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .vision-input[type="date"] {
          color-scheme: light;
        }
        [data-theme="dark"] .vision-input[type="date"] {
          color-scheme: dark;
        }
        .vision-primary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 40px;
          padding: 0 16px;
          border: none;
          border-radius: var(--radius);
          background: var(--accent);
          color: #fff;
          font: inherit;
          font-size: 0.84375rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.18);
          transition: background 0.16s ease, transform 0.12s ease, box-shadow 0.16s ease;
        }
        .vision-primary-btn:hover {
          background: var(--accent-dark);
          box-shadow: 0 2px 10px rgba(22, 163, 74, 0.24);
        }
        .vision-primary-btn:active {
          transform: scale(0.98);
        }
        .vision-primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .vision-ghost-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--card-bg);
          color: var(--text-muted);
          font: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        .vision-ghost-btn:hover {
          background: var(--bg-alt);
          border-color: var(--border-mid);
          color: var(--text);
        }
        .vision-ghost-btn[aria-expanded="true"] {
          background: var(--accent-ghost);
          border-color: var(--accent);
          color: var(--accent-contrast);
        }
        .vision-ghost-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .vision-danger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid transparent;
          border-radius: var(--radius);
          background: transparent;
          color: var(--danger);
          font: inherit;
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }
        .vision-danger-btn:hover {
          background: var(--danger-bg);
          border-color: color-mix(in srgb, var(--danger) 35%, transparent);
        }
        .vision-danger-btn.is-confirm {
          border-color: color-mix(in srgb, var(--danger) 45%, transparent);
          background: var(--danger-bg);
          color: var(--danger);
        }
        .vision-danger-btn.is-confirm:hover {
          border-color: var(--danger);
        }
        .vision-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
        }
        .vision-confirm {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        .vision-confirm p {
          margin: 0;
          flex: 1 1 200px;
          color: var(--text-muted);
          font-size: 0.8125rem;
          line-height: 1.4;
        }
        .vision-confirm-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-left: auto;
        }
        .vision-create {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
          gap: 14px;
          align-items: start;
          padding: 20px;
          background: var(--card-bg);
          border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
        }
        .vision-create-actions {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 2px;
        }
        .vision-create-actions .vision-field-error {
          margin-right: auto;
        }
        .vision-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 48px 24px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
        }
        .vision-empty-mark {
          width: 68px;
          height: 68px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-ghost);
          border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          color: var(--accent);
          margin-bottom: 4px;
        }
        .vision-empty h2 {
          margin: 0;
          font-size: 1.0625rem;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: var(--text);
        }
        .vision-empty p {
          margin: 0;
          max-width: 46ch;
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .vision-empty .vision-primary-btn {
          margin-top: 12px;
        }
        .visions-skeleton {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr));
          gap: 16px;
        }
        .visions-skeleton div {
          height: 120px;
          border-radius: var(--radius-card);
          background: var(--bg-alt);
          border: 1px solid var(--border);
          animation: vision-pulse 1.6s ease-in-out infinite;
        }
        @keyframes vision-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.55;
          }
        }
        .vision-loose {
          grid-column: 1 / -1;
          display: grid;
          gap: 10px;
          padding: 16px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          scroll-margin-top: 16px;
        }
        .vision-loose-head {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vision-loose h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.35;
          color: var(--text);
        }
        .vision-loose p {
          margin: 0;
          max-width: 68ch;
          color: var(--text-muted);
          font-size: 0.8125rem;
          line-height: 1.5;
        }
        .vision-loose ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 2px;
        }
        .vision-loose li {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 40px;
          padding: 6px 8px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--text) 3%, transparent);
          color: var(--text);
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.35;
        }
        .vision-loose li span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .visions-board :is(button, select):focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        @media (max-width: 767px) {
          .visions-board {
            padding: 16px 16px 40px;
            gap: 12px;
          }
          .vision-grid {
            gap: 12px;
          }
          .vision-card-head {
            padding: 12px 14px 10px;
          }
          .vision-card-body {
            padding: 12px 14px 14px;
            gap: 12px;
          }
          .visions-header {
            flex-direction: column;
            align-items: stretch;
          }
          .vision-new-btn {
            align-self: flex-start;
            margin-left: 0;
          }
          .vision-toolbar-actions {
            width: 100%;
            margin-left: 0;
          }
          .vision-toolbar-actions .vision-ghost-btn {
            flex: 1 1 0;
          }
          .vision-empty {
            padding: 36px 20px;
          }
          .vision-create {
            padding: 16px;
          }
          .vision-task-status {
            width: 4.25rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .visions-board *,
          .visions-board *::before,
          .visions-board *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
          .vision-primary-btn:active,
          .vision-color:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
