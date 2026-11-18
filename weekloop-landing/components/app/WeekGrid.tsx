"use client";

import { useState, useCallback, useMemo } from "react";
import type { TaskGroup, WorkItemData, WorkItemStatus } from "@/lib/mockData";
import {
  getGoalText,
  getWorkItems,
  getWeekRange,
} from "@/lib/mockData";
import { Plus, Trash, X, PencilSimple, FileText, ArrowsClockwise } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import TaskDetailModal from "@/components/app/TaskDetailModal";
import { useLanguage } from "@/lib/languageContext";

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
  onOpenTaskDetail?: (item: WorkItemData, groupId: string | number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
  onMoveTaskToCurrentWeek?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
}) {
  const { t, isVietnamese } = useLanguage();
  const fallbackWorkItems = useMemo(
    () => getWorkItems(groupId, absoluteOffset),
    [groupId, absoluteOffset],
  );
  const currentItems = workItems !== undefined ? workItems : fallbackWorkItems;

  const [localItems, setLocalItems] = useState<WorkItemData[]>(currentItems);
  const [loadedItems, setLoadedItems] = useState<WorkItemData[]>(currentItems);
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);
  const [editItemVal, setEditItemVal] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Dữ liệu mới từ Planner về thì đồng bộ ngay trong render (không dùng effect).
  if (loadedItems !== currentItems) {
    setLoadedItems(currentItems);
    setLocalItems(currentItems);
  }

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
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        background: "var(--card-bg)",
        marginBottom: 12,
        overflow: "hidden",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {/* Tiêu đề thẻ: tên nhóm + số việc */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--border)",
          background: `color-mix(in srgb, ${color} 6%, var(--card-bg))`,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: color,
              flexShrink: 0,
              marginTop: 5,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 700,
                color,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </span>
            <span
              style={{
                display: "block",
                marginTop: 1,
                fontSize: "0.6875rem",
                fontWeight: 500,
                color: "var(--text-muted)",
              }}
            >
              {currentItems.length > 0
                ? `${currentItems.length} ${t.taskCount}`
                : (isVietnamese ? "Chưa có việc" : "No tasks")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {isPast ? (
            <span
              style={{
                fontSize: "0.59375rem",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 8,
                background: "var(--bg-alt)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
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
            padding: "12px",
            color: "var(--text-faint)",
            fontSize: "0.75rem",
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {isPast
            ? (isVietnamese ? "Không có công việc nào" : "No tasks")
            : (isVietnamese ? "Chưa có công việc nào. Thêm công việc bên dưới..." : "No tasks yet. Add one below...")}
        </div>
      )}

      {/* Danh sách công việc (Work Items) */}
      {localItems.length > 0 && (
        <div style={{ padding: "2px 6px" }}>
          {localItems.map((item) => {
            const isEditing = editingItemId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  padding: "9px 8px",
                  width: "100%",
                  borderRadius: 10,
                }}
              >
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
                      fontSize: "0.8125rem",
                      padding: "6px 8px",
                      border: "1px solid var(--accent)",
                      borderRadius: 10,
                      outline: "none",
                      fontFamily: "inherit",
                      background: "var(--card-bg)",
                      color: "var(--text)",
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
                      const actions = e.currentTarget.querySelector('.normal-item-actions') as HTMLElement;
                      if (actions) actions.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      const actions = e.currentTarget.querySelector('.normal-item-actions') as HTMLElement;
                      if (actions) actions.style.opacity = "0";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0, paddingRight: "0.4rem" }}>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "var(--text)",
                          lineHeight: 1.35,
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
                            color: "var(--accent-contrast)",
                            flexShrink: 0,
                            opacity: 0.9,
                          }}
                        >
                          <FileText size={14} weight="fill" />
                        </span>
                      )}
                    </div>

                    {!isPast ? (
                      <div
                        className="item-actions normal-item-actions"
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
                      onMoveTaskToCurrentWeek && (
                        <div
                          className="past-item-actions"
                          style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveTaskToCurrentWeek(groupId, absoluteOffset, item.id);
                            }}
                            style={{
                              background: "var(--accent-ghost)",
                              border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                              borderRadius: 8,
                              cursor: "pointer",
                              color: "var(--accent-contrast)",
                              padding: "3px 8px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.71875rem",
                              fontWeight: 600,
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                              (e.currentTarget as HTMLElement).style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = "var(--accent-ghost)";
                              (e.currentTarget as HTMLElement).style.color = "var(--accent-contrast)";
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
            padding: "8px 10px 10px",
            display: "flex",
            gap: 6,
            borderTop: "1px solid var(--border)",
          }}
        >
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder={isVietnamese ? "Nhập tên công việc..." : "Enter task name..."}
            autoFocus
            style={{
              fontSize: "0.8125rem",
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid var(--accent)",
              outline: "none",
              width: "100%",
              background: "var(--card-bg)",
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0 10px",
              borderRadius: 10,
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
              padding: "0 8px",
              borderRadius: 10,
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
        <div style={{ padding: "2px 10px 10px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setIsAddingItem(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px 0 6px",
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              transition: "color 0.12s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent-contrast)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            <Plus size={13} />
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
  onOpenTaskDetail,
  onMoveTaskToCurrentWeek,
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
  onOpenTaskDetail?: (item: WorkItemData, groupId: string | number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
  onMoveTaskToCurrentWeek?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
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
        flex: 1,
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
          padding: "16px 20px 10px",
          borderBottom: "2px solid",
          borderBottomColor: isCenterCol ? "var(--accent)" : "var(--border)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.625rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: isCenterCol ? "var(--accent-contrast)" : "var(--text-faint)",
            marginBottom: "3px",
          }}
        >
          {colLabel}
          {isRealCurrentWeek && isCenterCol && (
            <span
              style={{
                marginLeft: "6px",
                background: "var(--accent-bg)",
                color: "var(--accent-contrast)",
                borderRadius: 8,
                padding: "1px 6px",
                fontSize: "0.59375rem",
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              {t.today}
            </span>
          )}
        </p>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {getWeekRange(absoluteOffset)}
        </p>
      </div>

      {/* Danh sách thẻ nhóm đầu việc */}
      <div style={{ padding: "12px 6px 12px", flex: 1, position: "relative" }}>
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
                  onOpenTaskDetail={onOpenTaskDetail}
                  onMoveTaskToCurrentWeek={onMoveTaskToCurrentWeek}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {visibleGroups.length === 0 && (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              border: "1px dashed var(--border)",
              borderRadius: 12,
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
          <div style={{ position: "relative", marginTop: 4 }}>
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
                gap: "6px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px dashed var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                (e.currentTarget as HTMLElement).style.color = "var(--accent-contrast)";
                (e.currentTarget as HTMLElement).style.background = "var(--accent-ghost)";
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
                  background: "var(--card-bg, #fff)",
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
  onMoveTaskToCurrentWeek?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
  onMoveTaskToNextWeek?: (groupId: string | number, absoluteOffset: number, itemId: string | number) => void;
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
  onMoveTaskToCurrentWeek,
  onMoveTaskToNextWeek,
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
              onOpenTaskDetail={handleOpenTaskDetail}
              onMoveTaskToCurrentWeek={onMoveTaskToCurrentWeek}
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
        showStatus={false}
        onSave={handleSaveTaskDetail}
        onDelete={handleDeleteTaskDetail}
        onMoveToCurrentWeek={
          onMoveTaskToCurrentWeek && detailTask
            ? (taskId) => onMoveTaskToCurrentWeek(detailTask.groupId, detailTask.absoluteOffset, taskId)
            : undefined
        }
        onMoveToNextWeek={
          onMoveTaskToNextWeek && detailTask
            ? (taskId) => onMoveTaskToNextWeek(detailTask.groupId, detailTask.absoluteOffset, taskId)
            : undefined
        }
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          min-height: 100%;
          width: 100%;
          align-items: start;
          padding: 16px 18px 32px;
        }
        .week-col-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          min-width: 0;
        }
        @media (max-width: 767px) {
          /* Mobile: week navigator nằm trên nội dung (Dashboard), không lặp thêm 3 tab cột. */
          .mobile-week-tabs {
            display: none !important;
          }
          .week-grid-columns {
            display: block !important;
            width: 100% !important;
            padding: 8px 0 24px !important;
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
