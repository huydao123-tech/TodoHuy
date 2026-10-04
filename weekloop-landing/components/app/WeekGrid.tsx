"use client";

import { useState, useCallback, useEffect } from "react";
import type { TaskGroup, WorkItemData, WorkItemStatus } from "@/lib/mockData";
import {
  getGoalText,
  getWorkItems,
  getWeekRange,
} from "@/lib/mockData";
import { CheckCircle, Clock, Circle, Plus, Trash, X, PencilSimple, FileText, ArrowsClockwise } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import TaskDetailModal from "@/components/app/TaskDetailModal";
import { useLanguage } from "@/lib/languageContext";

// ─── CẤU HÌNH TRẠNG THÁI ──────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  WorkItemStatus,
  { icon: React.ReactNode; textColor: string; strikethrough: boolean; label: string }
> = {
  DONE: {
    icon: <CheckCircle size={14} weight="fill" color="var(--accent)" />,
    textColor: "var(--text-faint)",
    strikethrough: true,
    label: "Đã xong",
  },
  IN_PROGRESS: {
    icon: <Clock size={14} weight="regular" color="#D97706" />,
    textColor: "var(--text)",
    strikethrough: false,
    label: "Đang làm",
  },
  TODO: {
    icon: <Circle size={14} weight="thin" color="#A1A1AA" />,
    textColor: "var(--text-muted)",
    strikethrough: false,
    label: "Cần làm",
  },
};

// ─── THẺ MỤC TIÊU VÀ CÔNG VIỆC (GOAL CARD) ───────────────────────────────────
function GoalCard({
  groupId,
  color,
  name,
  absoluteOffset,
  isPast,
  weekLabel = "",
  goal,
  workItems,
  onRemoveFromWeek,
  onSaveGoal,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onCycleStatus,
  onOpenTaskDetail,
  onMoveTaskToCurrentWeek,
}: {
  groupId: string | number;
  color: string;
  name: string;
  absoluteOffset: number;
  isPast: boolean;
  weekLabel?: string;
  goal?: string;
  workItems?: WorkItemData[];
  onRemoveFromWeek?: (groupId: string | number, absoluteOffset: number, name: string) => void;
  onSaveGoal?: (groupId: string | number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: string | number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (groupId: string | number, absoluteOffset: number, itemId: string | number, updates: { content?: string; note?: string; status?: WorkItemStatus } | string) => void;
  onDeleteItem?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onCycleStatus?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onOpenTaskDetail?: (item: WorkItemData, groupId: string | number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
  onMoveTaskToCurrentWeek?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
}) {
  const { t, isVietnamese } = useLanguage();
  const fallbackWorkItems = getWorkItems(groupId, absoluteOffset);
  const currentItems = workItems !== undefined ? workItems : fallbackWorkItems;

  const [localItems, setLocalItems] = useState<WorkItemData[]>(currentItems);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [editItemVal, setEditItemVal] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    setLocalItems(currentItems);
  }, [currentItems]);

  const pendingCount = currentItems.filter((item) => item.status !== "DONE").length;

  const cycleStatus = useCallback((id: string | number) => {
    if (isPast) return;
    const cycle: WorkItemStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: cycle[(cycle.indexOf(item.status) + 1) % 3] }
          : item
      )
    );
    if (onCycleStatus) {
      onCycleStatus(groupId, absoluteOffset, id);
    }
  }, [isPast, groupId, absoluteOffset, onCycleStatus]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const content = newItemText.trim();
    if (!content) return;

    const newItem: WorkItemData = {
      id: Date.now(),
      content,
      status: "TODO",
      note: "",
    };
    setLocalItems((prev) => [...prev, newItem]);
    setNewItemText("");
    setIsAddingItem(false);

    if (onAddItem) {
      onAddItem(groupId, absoluteOffset, content);
    }
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
        background: "#fff",
        marginBottom: "0.625rem",
        overflow: "hidden",
        transition: "box-shadow 0.15s ease",
      }}
    >
      {/* Tiêu đề thẻ: Tên nhóm đầu việc */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid var(--border)",
          background: isPast ? "rgba(245, 245, 244, 0.75)" : "var(--bg-alt)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </span>
          {pendingCount > 0 && (
            <span
              style={{
                fontSize: "0.625rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                background: "var(--border)",
                padding: "0.05rem 0.35rem",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {pendingCount}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {isPast ? (
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 650,
                padding: "0.1rem 0.4rem",
                borderRadius: "var(--radius-pill)",
                background: "#E7E5E4",
                color: "#78716C",
                letterSpacing: "0.02em",
              }}
            >
              {t.pastWeekBadge}
            </span>
          ) : (
            onRemoveFromWeek && (
              <button
                onClick={() => onRemoveFromWeek(groupId, absoluteOffset, name)}
                title={t.removeGroupFromWeek}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-faint)",
                  cursor: "pointer",
                  padding: "0.15rem 0.3rem",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.45,
                  transition: "opacity 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.45";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                }}
              >
                <X size={12} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Khi chưa có công việc nào và không mở form thêm */}
      {localItems.length === 0 && !isAddingItem && (
        <div
          style={{
            padding: "0.625rem 0.75rem",
            color: "var(--text-faint)",
            fontSize: "0.78125rem",
            fontStyle: "italic",
          }}
        >
          {isPast
            ? (isVietnamese ? "Không có công việc nào" : "No tasks")
            : (isVietnamese ? "Chưa có công việc nào trong tuần này" : "No tasks for this week")}
        </div>
      )}

      {/* Danh sách công việc (Work Items) */}
      {localItems.length > 0 && (
        <div style={{ padding: "0.375rem 0.75rem 0" }}>
          {localItems.map((item) => {
            const cfg = STATUS_CONFIG[item.status];
            const isEditing = editingItemId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.4rem",
                  padding: "0.28rem 0",
                  width: "100%",
                }}
              >
                <button
                  onClick={() => cycleStatus(item.id)}
                  disabled={isPast || isEditing}
                  title={
                    isPast || isEditing
                      ? undefined
                      : item.status === "TODO"
                      ? (isVietnamese ? "Chuyển sang: Đang làm" : "Set to: In Progress")
                      : item.status === "IN_PROGRESS"
                      ? (isVietnamese ? "Chuyển sang: Đã xong" : "Set to: Done")
                      : (isVietnamese ? "Đặt lại: Cần làm" : "Reset to: To Do")
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: isPast || isEditing ? "default" : "pointer",
                    flexShrink: 0,
                    marginTop: 1,
                    padding: 0,
                    display: "flex",
                  }}
                >
                  {cfg.icon}
                </button>

                {isEditing ? (
                  <input
                    autoFocus
                    value={editItemVal}
                    onChange={(e) => setEditItemVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const trimmed = editItemVal.trim();
                        if (trimmed) {
                          setLocalItems(prev => prev.map(x => x.id === item.id ? { ...x, content: trimmed } : x));
                          if (onUpdateItem) onUpdateItem(groupId, absoluteOffset, item.id, trimmed);
                        }
                        setEditingItemId(null);
                      }
                      if (e.key === "Escape") setEditingItemId(null);
                    }}
                    onBlur={() => {
                      const trimmed = editItemVal.trim();
                      if (trimmed) {
                        setLocalItems(prev => prev.map(x => x.id === item.id ? { ...x, content: trimmed } : x));
                        if (onUpdateItem) onUpdateItem(groupId, absoluteOffset, item.id, trimmed);
                      }
                      setEditingItemId(null);
                    }}
                    style={{
                      flex: 1,
                      fontSize: "0.8rem",
                      padding: "0.1rem 0.2rem",
                      border: "1px solid var(--accent)",
                      borderRadius: "var(--radius-sm)",
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flex: 1,
                      cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                      padding: "2px 4px",
                      margin: "-2px -4px",
                      transition: "background 0.12s ease",
                    }}
                    onClick={() => {
                      if (onOpenTaskDetail) {
                        onOpenTaskDetail(item, groupId, name, color, absoluteOffset, weekLabel);
                      }
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)";
                      const actions = e.currentTarget.querySelector('.item-actions') as HTMLElement;
                      if (actions) actions.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      const actions = e.currentTarget.querySelector('.item-actions') as HTMLElement;
                      if (actions) actions.style.opacity = "0";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flex: 1, minWidth: 0, paddingRight: "0.4rem" }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: cfg.textColor,
                          textDecoration: cfg.strikethrough ? "line-through" : "none",
                          lineHeight: 1.45,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.content}
                      </span>
                      {item.note && item.note.trim().length > 0 && (
                        <span
                          title={isVietnamese ? "Có ghi chú chi tiết" : "Has detailed notes"}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            color: "var(--accent)",
                            flexShrink: 0,
                            opacity: 0.9,
                          }}
                        >
                          <FileText size={12} weight="fill" />
                        </span>
                      )}
                    </div>

                    {!isPast ? (
                      <div
                        className="item-actions"
                        style={{ display: "flex", gap: "0.3rem", opacity: 0, transition: "opacity 0.15s ease" }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenTaskDetail) {
                              onOpenTaskDetail(item, groupId, name, color, absoluteOffset, weekLabel);
                            }
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-faint)",
                            padding: "0.1rem",
                            display: "flex",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                          title={isVietnamese ? "Xem chi tiết & ghi chú" : "View details & notes"}
                        >
                          <FileText size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItemId(item.id);
                            setEditItemVal(item.content);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-faint)",
                            padding: "0.1rem",
                            display: "flex",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                          title={isVietnamese ? "Sửa tiêu đề nhanh" : "Quick rename"}
                        >
                          <PencilSimple size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalItems(prev => prev.filter(x => x.id !== item.id));
                            if (onDeleteItem) onDeleteItem(groupId, absoluteOffset, item.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-faint)",
                            padding: "0.1rem",
                            display: "flex",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
                          title={t.delete}
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ) : (
                      item.status !== "DONE" && onMoveTaskToCurrentWeek && (
                        <div
                          className="item-actions"
                          style={{ display: "flex", gap: "0.3rem", opacity: 0.85, transition: "opacity 0.15s ease" }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveTaskToCurrentWeek(groupId, absoluteOffset, item.id);
                            }}
                            style={{
                              background: "var(--bg-alt)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-pill)",
                              cursor: "pointer",
                              color: "var(--accent)",
                              padding: "0.15rem 0.4rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                            }}
                            title={isVietnamese ? "Dời sang tuần này" : "Move to this week"}
                          >
                            <ArrowsClockwise size={12} weight="bold" />
                            <span>{isVietnamese ? "Tuần này" : "This week"}</span>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form nhập công việc mới */}
      {isAddingItem && !isPast && (
        <form
          onSubmit={handleAddItem}
          style={{
            padding: "0.375rem 0.75rem 0.5rem",
            display: "flex",
            gap: "0.375rem",
          }}
        >
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={isVietnamese ? "Nhập tên công việc..." : "Enter task name..."}
            autoFocus
            style={{
              fontSize: "0.8rem",
              padding: "0.25rem 0.4rem",
              borderRadius: "var(--radius)",
              border: "1px solid var(--accent)",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            type="submit"
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "var(--radius)",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t.create}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingItem(false)}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.4rem",
              borderRadius: "var(--radius)",
              background: "none",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            {t.cancel}
          </button>
        </form>
      )}

      {/* Nút thêm công việc (chỉ ở tuần hiện tại hoặc tương lai) */}
      {!isPast && !isAddingItem && (
        <div style={{ padding: "0.25rem 0.75rem 0.5rem" }}>
          <button
            onClick={() => setIsAddingItem(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.2rem 0",
              color: "var(--text-faint)",
              fontSize: "0.75rem",
              transition: "color 0.12s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-faint)")}
          >
            <Plus size={11} />
            <span>{t.addWorkItem}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CỘT TUẦN (WEEK COLUMN) ──────────────────────────────────────────────────
function WeekColumn({
  absoluteOffset,
  colOffset,
  viewOffset,
  taskGroups,
  goalsMap,
  workItemsMap,
  excludedByWeek,
  onRemoveFromWeek,
  onAddGroupToWeek,
  onOpenCreateGroupModal,
  onSaveGoal,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onCycleStatus,
  onOpenTaskDetail,
}: {
  absoluteOffset: number;
  colOffset: -1 | 0 | 1;
  viewOffset: number;
  taskGroups: TaskGroup[];
  goalsMap: Record<string, string>;
  workItemsMap: Record<string, WorkItemData[]>;
  excludedByWeek?: Record<number, (string | number)[]>;
  onRemoveFromWeek?: (groupId: string | number, absoluteOffset: number, name: string) => void;
  onAddGroupToWeek?: (groupId: string | number, absoluteOffset: number) => void;
  onOpenCreateGroupModal?: () => void;
  onSaveGoal?: (groupId: string | number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: string | number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (groupId: string | number, absoluteOffset: number, itemId: string | number, updates: { content?: string; note?: string; status?: WorkItemStatus } | string) => void;
  onDeleteItem?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onCycleStatus?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onOpenTaskDetail?: (item: WorkItemData, groupId: string | number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
}) {
  const { t, isVietnamese } = useLanguage();
  const reduce = useReducedMotion();
  const isRealCurrentWeek = absoluteOffset === 0;
  const isCenterCol = colOffset === 0;
  const isPast = absoluteOffset < 0;

  const [showAddMenu, setShowAddMenu] = useState(false);
  const excludedIds = (excludedByWeek?.[absoluteOffset] ?? []).map(String);
  const visibleGroups = taskGroups.filter((g) => !excludedIds.includes(String(g.id)));
  const excludedGroups = taskGroups.filter((g) => excludedIds.includes(String(g.id)));

  const colLabel =
    absoluteOffset === 0
      ? (isVietnamese ? "TUẦN NÀY" : "THIS WEEK")
      : absoluteOffset === -1
      ? (isVietnamese ? "TUẦN TRƯỚC" : "LAST WEEK")
      : absoluteOffset === 1
      ? (isVietnamese ? "TUẦN SAU" : "NEXT WEEK")
      : absoluteOffset < -1
      ? (isVietnamese ? `TUẦN CŨ (${Math.abs(absoluteOffset)} tuần trước)` : `PAST WEEK (${Math.abs(absoluteOffset)} w ago)`)
      : (isVietnamese ? `TUẦN TỚI (+${absoluteOffset} tuần)` : `UPCOMING (+${absoluteOffset} w)`);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRight: colOffset < 1 ? "1px solid var(--border)" : "none",
        minWidth: 0,
      }}
    >
      {/* Tiêu đề cột cố định */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg)",
          padding: "0.75rem 1rem 0.625rem",
          borderBottom: "2px solid",
          borderBottomColor: isCenterCol ? "var(--accent)" : "var(--border)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.625rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: isCenterCol ? "var(--accent)" : "var(--text-faint)",
            marginBottom: "0.2rem",
          }}
        >
          {colLabel}
          {isRealCurrentWeek && isCenterCol && (
            <span
              style={{
                marginLeft: "0.4rem",
                background: "var(--accent-bg)",
                color: "var(--accent)",
                borderRadius: "var(--radius-pill)",
                padding: "0.05rem 0.375rem",
                fontSize: "0.5625rem",
                fontWeight: 600,
              }}
            >
              {t.today}
            </span>
          )}
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          {getWeekRange(absoluteOffset)}
        </p>
      </div>

      {/* Danh sách thẻ nhóm đầu việc */}
      <div style={{ padding: "0.875rem", flex: 1, position: "relative" }}>
        <AnimatePresence mode="popLayout">
          {visibleGroups.map((g, i) => {
            const key = `${g.id}:${absoluteOffset}`;
            return (
              <motion.div
                key={g.id}
                layout
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  duration: 0.22,
                  delay: i * 0.02,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <GoalCard
                  groupId={g.id}
                  color={g.color}
                  name={g.name}
                  absoluteOffset={absoluteOffset}
                  isPast={isPast}
                  goal={goalsMap[key]}
                  workItems={workItemsMap[key]}
                  weekLabel={`${colLabel} (${getWeekRange(absoluteOffset)})`}
                  onRemoveFromWeek={onRemoveFromWeek}
                  onSaveGoal={onSaveGoal}
                  onAddItem={onAddItem}
                  onUpdateItem={onUpdateItem}
                  onDeleteItem={onDeleteItem}
                  onCycleStatus={onCycleStatus}
                  onOpenTaskDetail={onOpenTaskDetail}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleGroups.length === 0 && (
          <div
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text-faint)",
              fontSize: "0.8125rem",
              marginBottom: "0.75rem",
            }}
          >
            {isVietnamese ? "Chưa có đầu việc nào trong tuần này" : "No categories in this week"}
          </div>
        )}

        {/* Nút thêm đầu việc vào tuần này */}
        {!isPast && (
          <div style={{ position: "relative", marginTop: "0.25rem" }}>
            <button
              onClick={() => {
                if (excludedGroups.length > 0) {
                  setShowAddMenu((v) => !v);
                } else if (onOpenCreateGroupModal) {
                  onOpenCreateGroupModal();
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                width: "100%",
                padding: "0.45rem 0.65rem",
                borderRadius: "var(--radius)",
                border: "1px dashed var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)";
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Plus size={13} />
              <span>{t.createCategory}</span>
            </button>

            {/* Menu chọn các đầu việc đang bị ẩn khỏi tuần này */}
            {showAddMenu && excludedGroups.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  padding: "0.35rem",
                  zIndex: 40,
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-faint)",
                    padding: "0.25rem 0.5rem",
                    fontWeight: 500,
                  }}
                >
                  {isVietnamese ? "Thêm lại vào tuần này:" : "Add back to this week:"}
                </div>
                {excludedGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onAddGroupToWeek?.(g.id, absoluteOffset);
                      setShowAddMenu(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "0.35rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "transparent",
                      color: "var(--text)",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "var(--bg-alt)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 9999,
                        background: g.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.name}
                    </span>
                  </button>
                ))}
                {onOpenCreateGroupModal && (
                  <>
                    <div
                      style={{
                        height: 1,
                        background: "var(--border)",
                        margin: "0.3rem 0",
                      }}
                    />
                    <button
                      onClick={() => {
                        setShowAddMenu(false);
                        onOpenCreateGroupModal();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        width: "100%",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        background: "transparent",
                        color: "var(--accent)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "var(--accent-bg)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <Plus size={12} />
                      <span>{isVietnamese ? "Tạo đầu việc mới..." : "Create new category..."}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LƯỚI 3 TUẦN (WEEK GRID) ─────────────────────────────────────────────────
export interface WeekGridProps {
  viewOffset: number;
  taskGroups?: TaskGroup[];
  goalsMap?: Record<string, string>;
  workItemsMap?: Record<string, WorkItemData[]>;
  excludedByWeek?: Record<number, (string | number)[]>;
  onRemoveFromWeek?: (groupId: string | number, absoluteOffset: number, name: string) => void;
  onAddGroupToWeek?: (groupId: string | number, absoluteOffset: number) => void;
  onOpenCreateGroupModal?: () => void;
  onSaveGoal?: (groupId: string | number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: string | number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (
    groupId: string | number,
    absoluteOffset: number,
    itemId: string | number,
    updates: { content?: string; note?: string; status?: WorkItemStatus } | string
  ) => void;
  onDeleteItem?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onCycleStatus?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
}

export default function WeekGrid({
  viewOffset,
  taskGroups = [],
  goalsMap = {},
  workItemsMap = {},
  excludedByWeek = {},
  onRemoveFromWeek,
  onAddGroupToWeek,
  onOpenCreateGroupModal,
  onSaveGoal,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onCycleStatus,
}: WeekGridProps) {
  const { t, isVietnamese } = useLanguage();
  const [mobileActiveCol, setMobileActiveCol] = useState<-1 | 0 | 1>(0);

  const [detailTask, setDetailTask] = useState<{
    item: WorkItemData;
    groupId: string | number;
    groupName: string;
    groupColor: string;
    absoluteOffset: number;
    weekLabel: string;
  } | null>(null);

  const handleOpenTaskDetail = useCallback(
    (
      item: WorkItemData,
      groupId: string | number,
      groupName: string,
      groupColor: string,
      absoluteOffset: number,
      weekLabel: string
    ) => {
      setDetailTask({
        item,
        groupId,
        groupName,
        groupColor,
        absoluteOffset,
        weekLabel,
      });
    },
    []
  );

  const handleSaveTaskDetail = useCallback(
    (
      taskId: string | number,
      updates: { content: string; note: string; status: WorkItemStatus }
    ) => {
      if (!detailTask) return;
      if (onUpdateItem) {
        onUpdateItem(
          detailTask.groupId,
          detailTask.absoluteOffset,
          taskId,
          updates
        );
      }
      setDetailTask(null);
    },
    [detailTask, onUpdateItem]
  );

  const handleDeleteTaskDetail = useCallback(
    (taskId: string | number) => {
      if (!detailTask) return;
      if (onDeleteItem) {
        onDeleteItem(detailTask.groupId, detailTask.absoluteOffset, taskId);
      }
      setDetailTask(null);
    },
    [detailTask, onDeleteItem]
  );

  const cols: { colOffset: -1 | 0 | 1 }[] = [
    { colOffset: -1 },
    { colOffset: 0 },
    { colOffset: 1 },
  ];

  return (
    <div className="week-grid-container">
      {/* Mobile Week Selector Tabs (chỉ hiện trên màn hình nhỏ < 768px) */}
      <div className="mobile-week-tabs" role="tablist" aria-label={isVietnamese ? "Chọn tuần trên điện thoại" : "Mobile week selector"}>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === -1}
          className={`mobile-week-tab ${mobileActiveCol === -1 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(-1)}
        >
          {isVietnamese ? "‹ Tuần trước" : "‹ Last week"}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === 0}
          className={`mobile-week-tab ${mobileActiveCol === 0 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(0)}
        >
          {isVietnamese ? "★ Tuần này" : "★ This week"} {viewOffset === 0 && <span className="today-dot">●</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === 1}
          className={`mobile-week-tab ${mobileActiveCol === 1 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(1)}
        >
          {isVietnamese ? "Tuần sau ›" : "Next week ›"}
        </button>
      </div>

      <div className="week-grid-columns">
        {cols.map(({ colOffset }) => (
          <div
            key={colOffset}
            className={`week-col-wrapper ${mobileActiveCol === colOffset ? "mobile-visible" : "mobile-hidden"}`}
          >
            <WeekColumn
              colOffset={colOffset}
              absoluteOffset={viewOffset + colOffset}
              viewOffset={viewOffset}
              taskGroups={taskGroups}
              goalsMap={goalsMap}
              workItemsMap={workItemsMap}
              excludedByWeek={excludedByWeek}
              onRemoveFromWeek={onRemoveFromWeek}
              onAddGroupToWeek={onAddGroupToWeek}
              onOpenCreateGroupModal={onOpenCreateGroupModal}
              onSaveGoal={onSaveGoal}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onCycleStatus={onCycleStatus}
              onOpenTaskDetail={handleOpenTaskDetail}
            />
          </div>
        ))}
      </div>

      {/* Cửa sổ chi tiết Task (Task Detail Modal) */}
      <TaskDetailModal
        isOpen={Boolean(detailTask)}
        onClose={() => setDetailTask(null)}
        task={detailTask ? detailTask.item : null}
        groupName={detailTask ? detailTask.groupName : ""}
        groupColor={detailTask ? detailTask.groupColor : "var(--accent)"}
        weekLabel={detailTask ? detailTask.weekLabel : ""}
        isPast={detailTask ? detailTask.absoluteOffset < 0 : false}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTaskDetail}
      />

      <style>{`
        .week-grid-container {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          width: 100%;
        }
        .mobile-week-tabs {
          display: none;
        }
        .week-grid-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          min-height: 100%;
          width: 100%;
        }
        @media (max-width: 767px) {
          .mobile-week-tabs {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            padding: 0.5rem 0.75rem;
            background: var(--bg);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 25;
          }
          .mobile-week-tab {
            flex: 1;
            padding: 0.45rem 0.5rem;
            border-radius: var(--radius-pill);
            border: 1px solid var(--border);
            background: #fff;
            color: var(--text-muted);
            font-size: 0.78125rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.25rem;
            transition: all 0.15s ease;
          }
          .mobile-week-tab.active {
            background: var(--accent);
            color: #fff;
            border-color: var(--accent);
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(22, 163, 74, 0.25);
          }
          .mobile-week-tab .today-dot {
            font-size: 0.5rem;
            color: #fff;
          }
          .week-grid-columns {
            display: block !important;
            width: 100% !important;
          }
          .week-col-wrapper.mobile-hidden {
            display: none !important;
          }
          .week-col-wrapper.mobile-visible {
            display: block !important;
            width: 100% !important;
          }
          .item-actions {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
