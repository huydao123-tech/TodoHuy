"use client";

import { useState, useCallback, useEffect } from "react";
import type { TaskGroup, WorkItemData, WorkItemStatus } from "@/lib/mockData";
import {
  getGoalText,
  getWorkItems,
  getWeekRange,
} from "@/lib/mockData";
import { CheckCircle, Clock, Circle, Plus, Trash, X, PencilSimple, FileText } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import TaskDetailModal from "@/components/app/TaskDetailModal";

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
}: {
  groupId: number;
  color: string;
  name: string;
  absoluteOffset: number;
  isPast: boolean;
  weekLabel?: string;
  goal?: string;
  workItems?: WorkItemData[];
  onRemoveFromWeek?: (groupId: number, absoluteOffset: number, name: string) => void;
  onSaveGoal?: (groupId: number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (groupId: number, absoluteOffset: number, itemId: number, updates: { content?: string; note?: string; status?: WorkItemStatus } | string) => void;
  onDeleteItem?: (groupId: number, absoluteOffset: number, itemId: number) => void;
  onCycleStatus?: (groupId: number, absoluteOffset: number, itemId: number) => void;
  onOpenTaskDetail?: (item: WorkItemData, groupId: number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
}) {
  const fallbackWorkItems = getWorkItems(groupId, absoluteOffset);
  const currentItems = workItems !== undefined ? workItems : fallbackWorkItems;

  const [localItems, setLocalItems] = useState<WorkItemData[]>(currentItems);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemVal, setEditItemVal] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    setLocalItems(currentItems);
  }, [currentItems]);

  const cycleStatus = useCallback((id: number) => {
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
        opacity: isPast ? 0.76 : 1,
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
          background: "var(--bg-alt)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
        </div>

        {onRemoveFromWeek && (
          <button
            onClick={() => onRemoveFromWeek(groupId, absoluteOffset, name)}
            title="Bỏ khỏi tuần này"
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
        )}
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
          {isPast ? "Không có công việc nào" : "Chưa có công việc nào trong tuần này"}
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
                      ? "Chuyển sang: Đang làm"
                      : item.status === "IN_PROGRESS"
                      ? "Chuyển sang: Đã xong"
                      : "Đặt lại: Cần làm"
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
                          title="Có ghi chú chi tiết"
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

                    {!isPast && (
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
                          title="Xem chi tiết & ghi chú"
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
                          title="Sửa tiêu đề nhanh"
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
                          title="Xóa"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
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
            placeholder="Nhập tên công việc..."
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
            Thêm
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
            Hủy
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
            <span>Thêm công việc</span>
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
  excludedByWeek?: Record<number, number[]>;
  onRemoveFromWeek?: (groupId: number, absoluteOffset: number, name: string) => void;
  onAddGroupToWeek?: (groupId: number, absoluteOffset: number) => void;
  onOpenCreateGroupModal?: () => void;
  onSaveGoal?: (groupId: number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (groupId: number, absoluteOffset: number, itemId: number, updates: { content?: string; note?: string; status?: WorkItemStatus } | string) => void;
  onDeleteItem?: (groupId: number, absoluteOffset: number, itemId: number) => void;
  onCycleStatus?: (groupId: number, absoluteOffset: number, itemId: number) => void;
  onOpenTaskDetail?: (item: WorkItemData, groupId: number, name: string, color: string, absoluteOffset: number, weekLabel: string) => void;
}) {
  const reduce = useReducedMotion();
  const isRealCurrentWeek = absoluteOffset === 0;
  const isCenterCol = colOffset === 0;
  const isPast = colOffset === -1;

  const [showAddMenu, setShowAddMenu] = useState(false);
  const excludedIds = excludedByWeek?.[absoluteOffset] ?? [];
  const visibleGroups = taskGroups.filter((g) => !excludedIds.includes(g.id));
  const excludedGroups = taskGroups.filter((g) => excludedIds.includes(g.id));

  const colLabel =
    colOffset === -1
      ? "TUẦN TRƯỚC"
      : viewOffset === 0 && colOffset === 0
      ? "TUẦN NÀY"
      : colOffset === 0
      ? "TUẦN ĐANG XEM"
      : "TUẦN SAU";

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
              Hôm nay
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
            Chưa có đầu việc nào trong tuần này
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
              <span>Thêm đầu việc</span>
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
                  Thêm lại vào tuần này:
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
                      <span>Tạo đầu việc mới...</span>
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
  excludedByWeek?: Record<number, number[]>;
  onRemoveFromWeek?: (groupId: number, absoluteOffset: number, name: string) => void;
  onAddGroupToWeek?: (groupId: number, absoluteOffset: number) => void;
  onOpenCreateGroupModal?: () => void;
  onSaveGoal?: (groupId: number, absoluteOffset: number, text: string) => void;
  onAddItem?: (groupId: number, absoluteOffset: number, content: string) => void;
  onUpdateItem?: (
    groupId: number,
    absoluteOffset: number,
    itemId: number,
    updates: { content?: string; note?: string; status?: WorkItemStatus } | string
  ) => void;
  onDeleteItem?: (groupId: number, absoluteOffset: number, itemId: number) => void;
  onCycleStatus?: (groupId: number, absoluteOffset: number, itemId: number) => void;
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
  const [mobileActiveCol, setMobileActiveCol] = useState<-1 | 0 | 1>(0);

  const [detailTask, setDetailTask] = useState<{
    item: WorkItemData;
    groupId: number;
    groupName: string;
    groupColor: string;
    absoluteOffset: number;
    weekLabel: string;
  } | null>(null);

  const handleOpenTaskDetail = useCallback(
    (
      item: WorkItemData,
      groupId: number,
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
      taskId: number,
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
    (taskId: number) => {
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
      <div className="mobile-week-tabs" role="tablist" aria-label="Chọn tuần trên điện thoại">
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === -1}
          className={`mobile-week-tab ${mobileActiveCol === -1 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(-1)}
        >
          ‹ Tuần trước
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === 0}
          className={`mobile-week-tab ${mobileActiveCol === 0 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(0)}
        >
          ★ Tuần này {viewOffset === 0 && <span className="today-dot">●</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveCol === 1}
          className={`mobile-week-tab ${mobileActiveCol === 1 ? "active" : ""}`}
          onClick={() => setMobileActiveCol(1)}
        >
          Tuần sau ›
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
