"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Flag, Plus } from "@phosphor-icons/react";
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
  visionOwningGroup,
  workItemsByWeek,
  type VisionDraft,
  type VisionRecord,
  type VisionStatus,
} from "@/lib/visions";

const GROUP_COLORS = ["#16A34A", "#7C3AED", "#D97706", "#2563EB", "#DC2626", "#0D9488"];

function progressText(done: number, total: number, isVietnamese: boolean): string {
  if (total === 0) return isVietnamese ? "Chưa có việc" : "No tasks yet";
  return isVietnamese ? `${done}/${total} việc xong` : `${done}/${total} done`;
}

function horizonText(value: string, isVietnamese: boolean): string {
  return formatHorizonDate(value, isVietnamese ? "vi-VN" : "en-GB") || value;
}

function countTasks(groupIds: string[], workItemsMap: Record<string, WorkItemData[]>): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const id of groupIds) {
    for (const week of workItemsByWeek(id, workItemsMap)) {
      total += week.items.length;
      done += week.items.filter((item) => item.status === "DONE").length;
    }
  }
  return { done, total };
}

function GroupTasks({
  groupId,
  workItemsMap,
}: {
  groupId: string;
  workItemsMap: Record<string, WorkItemData[]>;
}) {
  const { t } = useLanguage();
  const weeks = workItemsByWeek(groupId, workItemsMap);
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
    <div style={{ display: "grid", gap: "0.35rem" }}>
      <label htmlFor={id} style={{ fontSize: "0.75rem", fontWeight: 620, color: "var(--text)" }}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="vision-danger" role="alert" style={{ margin: 0, fontSize: "0.75rem" }}>
          {error}
        </p>
      ) : hint ? (
        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.45 }}>{hint}</p>
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
    </div>
  );
}

function VisionSection({
  vision,
  catalog,
  groups,
  goalsMap,
  workItemsMap,
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
  const progress = countTasks(linked.map((group) => String(group.id)), workItemsMap);
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
      <div className="vision-section-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          {editing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveEdit();
              }}
              style={{ display: "grid", gap: "0.75rem" }}
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
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost vision-btn" onClick={() => setEditing(false)} disabled={busy}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary vision-btn" disabled={busy}>
                  {t.save}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 id={`vision-title-${vision.id}`} className="vision-title">
                {vision.title}
              </h2>
              {vision.outcome ? <p className="vision-outcome">{vision.outcome}</p> : null}
              <p className="vision-meta">
                {vision.horizon ? <span>{horizonText(vision.horizon, isVietnamese)}</span> : null}
                <span>{progressText(progress.done, progress.total, isVietnamese)}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {!editing && (
        <>
          <div className="vision-toolbar">
            <label className="vision-status" htmlFor={`vision-status-${vision.id}`}>
              <span>{t.visionStatusLabel}</span>
              <select
                id={`vision-status-${vision.id}`}
                className="vision-input"
                value={vision.status}
                onChange={(event) => {
                  void onStatus(event.target.value as VisionStatus).catch(() => undefined);
                }}
              >
                <option value="active">{t.visionStatusActive}</option>
                <option value="paused">{t.visionStatusPaused}</option>
                <option value="achieved">{t.visionStatusAchieved}</option>
              </select>
            </label>
            <div className="vision-toolbar-actions">
              <button type="button" className="btn-ghost vision-btn" onClick={onViewWeek}>
                {t.viewWeek}
              </button>
              <button type="button" className="btn-ghost vision-btn" onClick={startEdit}>
                {t.editVision}
              </button>
            </div>
          </div>

          <div className="vision-groups">
            <h3>{t.visionGroupsLabel}</h3>
            {linked.length === 0 ? (
              <p className="vision-empty-copy">{t.noGroupsInVision}</p>
            ) : (
              <ul className="vision-group-stack">
                {linked.map((group) => {
                  const goal = goalsMap[`${group.id}:0`] ?? "";
                  const groupProgress = countTasks([String(group.id)], workItemsMap);
                  return (
                    <li key={group.id} className="vision-group-block">
                      <div className="vision-group-head">
                        <span className="vision-dot" style={{ background: group.color }} aria-hidden />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="vision-group-name">
                            <span>{group.name}</span>
                            {groupProgress.total > 0 && (
                              <span className="vision-count">
                                {groupProgress.done}/{groupProgress.total}
                              </span>
                            )}
                          </div>
                          {goal ? <p className="vision-goal">{goal}</p> : null}
                        </div>
                        <button
                          type="button"
                          className="vision-text-btn"
                          onClick={() => {
                            void onDetach(String(group.id)).catch(() => undefined);
                          }}
                          title={isVietnamese ? "Gỡ khỏi tầm nhìn, không xóa nhóm việc" : "Remove from this vision. The group stays."}
                        >
                          {t.detachGroup}
                        </button>
                      </div>
                      <GroupTasks groupId={String(group.id)} workItemsMap={workItemsMap} />
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="vision-group-actions">
              <button
                type="button"
                className="btn-ghost vision-btn"
                aria-expanded={attachOpen}
                onClick={onToggleAttach}
              >
                {t.attachGroup}
              </button>
              <button
                type="button"
                className="btn-ghost vision-btn"
                aria-expanded={createOpen}
                onClick={onToggleCreate}
              >
                <Plus size={14} weight="bold" />
                {t.createGroupInVision}
              </button>
            </div>

            {attachOpen && (
              <div className="vision-picker" id={`vision-attach-${vision.id}`}>
                <p className="vision-empty-copy">
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
                <p className="vision-empty-copy">
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
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn-primary vision-btn" disabled={busy || !groupName.trim()}>
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
                <button type="button" className="btn-ghost vision-btn" onClick={() => setConfirmDelete(false)}>
                  {t.cancel}
                </button>
                <button
                  type="button"
                  className="vision-text-btn vision-danger"
                  onClick={() => {
                    void onDelete().catch(() => undefined);
                  }}
                >
                  {t.deleteVision}
                </button>
              </div>
            ) : (
              <button type="button" className="vision-text-btn vision-danger" onClick={() => setConfirmDelete(true)}>
                {t.deleteVision}
              </button>
            )}
          </div>
        </>
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
    <li>
      <span className="vision-dot" style={{ background: group.color }} aria-hidden />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="vision-group-name">
          <span>{group.name}</span>
        </div>
        <p className="vision-goal">{owner ? `${t.ownedBy} ${owner.title}` : t.notInVision}</p>
      </div>
      <button type="button" className="vision-text-btn" onClick={onAttach}>
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
        <div>
          <h1>{t.visions}</h1>
          <p>{t.visionsIntro}</p>
        </div>
        {ordered.length > 0 && !formOpen && (
          <button type="button" className="btn-primary vision-btn" onClick={() => setFormOpen(true)}>
            <Plus size={14} weight="bold" />
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
              <p className="vision-danger" role="alert" style={{ margin: 0, fontSize: "0.75rem" }}>
                {formError}
              </p>
            ) : null}
            <button
              type="button"
              className="btn-ghost vision-btn"
              onClick={() => {
                setFormOpen(false);
                setTitleError("");
                setHorizonError("");
                setFormError("");
              }}
            >
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary vision-btn" disabled={saving}>
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
            <Flag size={26} weight="duotone" />
          </div>
          <h2>{t.visionEmptyTitle}</h2>
          <p>{groups.length > 0 ? t.visionEmptyWithGroups : t.visionEmptyBody}</p>
          <button type="button" className="btn-primary vision-btn" onClick={() => setFormOpen(true)}>
            <Plus size={14} weight="bold" />
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
          <h2 id="unassigned-groups">{t.unassignedGroups}</h2>
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
          padding: 1rem 1rem 2rem;
          display: grid;
          gap: 0.85rem;
        }
        .vision-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
          gap: 0.85rem;
          align-items: start;
        }
        .vision-create {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: minmax(140px, 1fr) minmax(180px, 1.4fr) 180px auto;
          gap: 0.75rem;
          align-items: end;
        }
        .vision-create-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          padding-bottom: 0.05rem;
        }
        .visions-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
        }
        .visions-header h1 {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 640;
          letter-spacing: -0.03em;
          color: var(--text);
        }
        .vision-empty h2,
        .vision-loose h2 {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 640;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .visions-header p,
        .vision-empty p,
        .vision-loose p {
          margin: 0.35rem 0 0;
          max-width: 62ch;
          color: var(--text-muted);
          font-size: 0.875rem;
          line-height: 1.5;
        }
        .vision-section,
        .vision-loose {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1rem;
          scroll-margin-top: 0.75rem;
        }
        .vision-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 640;
          letter-spacing: -0.02em;
          color: var(--text);
        }
        .vision-outcome {
          margin: 0.35rem 0 0;
          color: var(--text);
          font-size: 0.9rem;
          line-height: 1.45;
        }
        .vision-meta {
          margin: 0.4rem 0 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem 0.75rem;
        }
        .vision-toolbar,
        .vision-group-actions,
        .vision-footer,
        .vision-confirm {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .vision-toolbar {
          justify-content: space-between;
          margin-top: 0.9rem;
        }
        .vision-status {
          display: grid;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 620;
          color: var(--text);
        }
        .vision-status select {
          min-width: 160px;
        }
        .vision-groups {
          margin-top: 1rem;
          display: grid;
          gap: 0.55rem;
        }
        .vision-groups h3 {
          margin: 0;
          font-size: 0.8125rem;
          font-weight: 620;
          color: var(--text);
        }
        .vision-group-list,
        .vision-loose ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.35rem;
        }
        .vision-group-list li,
        .vision-loose li {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 0.55rem;
          border-radius: var(--radius);
          background: var(--bg-alt);
        }
        .vision-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .vision-group-name {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
          color: var(--text);
          font-size: 0.875rem;
        }
        .vision-group-name span:first-child,
        .vision-loose li span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vision-count,
        .vision-goal,
        .vision-empty-copy {
          color: var(--text-muted);
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .vision-goal,
        .vision-empty-copy {
          margin: 0.1rem 0 0;
        }
        .vision-empty-copy {
          margin: 0;
        }
        .vision-picker {
          display: grid;
          gap: 0.7rem;
          padding: 0.75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg);
        }
        .vision-colors {
          display: flex;
          gap: 0.45rem;
        }
        .vision-color {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 2px solid transparent;
          cursor: pointer;
          padding: 0;
        }
        .vision-color[aria-pressed="true"] {
          outline: 2px solid var(--text);
          outline-offset: 2px;
        }
        .vision-input {
          width: 100%;
          padding: 0.5rem 0.65rem;
          border-radius: var(--radius);
          border: 1px solid var(--border-mid);
          background: var(--input-bg);
          color: var(--text);
          font: inherit;
          font-size: 0.875rem;
        }
        .vision-input::placeholder {
          color: var(--text-muted);
        }
        .vision-input:focus {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
          border-color: var(--accent);
        }
        .vision-input[type="date"] {
          color-scheme: light;
          min-height: 2.4rem;
        }
        .vision-group-stack {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.55rem;
        }
        .vision-group-block {
          padding: 0.55rem 0.6rem 0.65rem;
          border-radius: var(--radius);
          background: var(--bg-alt);
        }
        .vision-group-head {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .vision-week-label {
          margin: 0.45rem 0 0;
          font-size: 0.6875rem;
          color: var(--text-faint);
        }
        .vision-task-list {
          list-style: none;
          margin: 0.2rem 0 0;
          padding: 0;
          display: grid;
          gap: 0.2rem;
        }
        .vision-task-list li {
          display: flex;
          align-items: baseline;
          gap: 0.45rem;
          font-size: 0.8125rem;
          color: var(--text);
        }
        .vision-task-status {
          flex-shrink: 0;
          min-width: 4.6rem;
          font-size: 0.6875rem;
          font-weight: 650;
        }
        .vision-task-status.is-done { color: var(--accent-dark); }
        .vision-task-status.is-in_progress { color: #b45309; }
        .vision-task-status.is-todo { color: var(--text-muted); }
        .vision-task-list li.is-done .vision-task-content {
          color: var(--text-faint);
          text-decoration: line-through;
        }
        [data-theme="dark"] .vision-input[type="date"] {
          color-scheme: dark;
        }
        [data-theme="dark"] .vision-task-status.is-in_progress {
          color: #fbbf24;
        }
        .vision-btn {
          padding: 0.4rem 0.8rem;
          font-size: 0.8125rem;
        }
        .vision-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .vision-text-btn {
          border: none;
          background: none;
          color: var(--accent-dark);
          font: inherit;
          font-size: 0.75rem;
          font-weight: 620;
          cursor: pointer;
          padding: 0.2rem 0.15rem;
          white-space: nowrap;
        }
        .vision-text-btn:active,
        .vision-btn:active,
        .vision-chip:active {
          transform: scale(0.98);
        }
        .vision-danger {
          color: #b91c1c;
        }
        .vision-footer {
          margin-top: 0.85rem;
        }
        .vision-confirm p {
          margin: 0;
          flex: 1 1 180px;
          color: var(--text);
          font-size: 0.8125rem;
        }
        .vision-empty {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.35rem;
          padding: 0.5rem 0 1rem;
        }
        .vision-empty h2 {
          margin-top: 0.35rem;
        }
        .vision-empty .vision-btn {
          margin-top: 0.75rem;
        }
        .vision-empty-mark {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-bg);
          color: var(--accent);
        }
        .visions-skeleton {
          display: grid;
          gap: 0.75rem;
        }
        .visions-skeleton div {
          height: 92px;
          border-radius: var(--radius-lg);
          background: var(--bg-alt);
          border: 1px solid var(--border);
        }
        .vision-lens {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding: 0.75rem 0.875rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
        }
        .vision-chip {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text);
          border-radius: var(--radius-pill);
          padding: 0.3rem 0.7rem;
          font: inherit;
          font-size: 0.75rem;
          font-weight: 560;
          cursor: pointer;
        }
        .vision-chip[aria-pressed="true"] {
          background: var(--accent-bg);
          border-color: var(--accent-dark);
          color: var(--text);
          font-weight: 680;
        }
        [data-theme="dark"] .vision-danger {
          color: #fca5a5;
        }
        @media (max-width: 900px) {
          .vision-create {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 767px) {
          .visions-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .visions-board {
            padding-bottom: 5.5rem;
          }
        }
      `}</style>
    </div>
  );
}
