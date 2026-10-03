"use client";

import { useState } from "react";
import type { SideTaskData } from "@/lib/mockData";
import { CheckSquare, Square, Plus, Trash } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useLanguage } from "@/lib/languageContext";

interface SidePanelProps {
  sideTasks: SideTaskData[];
  onComplete: (task: SideTaskData) => void;
  onAdd?: (name: string) => void;
  onDelete?: (task: SideTaskData) => void;
  // Giữ lại onToggle tương thích ngược nếu có chỗ nào gọi
  onToggle?: (id: string | number) => void;
}

export default function SidePanel({
  sideTasks,
  onComplete,
  onAdd,
  onDelete,
  onToggle,
}: SidePanelProps) {
  const { t, isVietnamese } = useLanguage();
  const [newTaskText, setNewTaskText] = useState("");
  const [completingIds, setCompletingIds] = useState<Set<string | number>>(new Set());
  const reduce = useReducedMotion();

  const handleCompleteClick = (task: SideTaskData) => {
    if (completingIds.has(task.id)) return;

    // Kích hoạt trạng thái hoàn thành kèm hiệu ứng gạch ngang 350ms như app Flutter
    setCompletingIds((prev) => new Set(prev).add(task.id));

    setTimeout(() => {
      if (onComplete) {
        onComplete(task);
      } else if (onToggle) {
        onToggle(task.id);
      }
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 350);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTaskText.trim()) {
      if (onAdd) {
        onAdd(newTaskText.trim());
      }
      setNewTaskText("");
    }
  };

  return (
    <aside
      id="side-panel"
      aria-label={t.sideTasksTitle}
      style={{
        width: 280,
        flexShrink: 0,
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-alt)",
        overflowY: "auto",
      }}
    >
      {/* Tiêu đề thanh bên phải */}
      <div
        style={{
          padding: "0.875rem 1rem 0.75rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-alt)",
          position: "sticky",
          top: 0,
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.6875rem",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--text-faint)",
              fontWeight: 600,
            }}
          >
            {t.sideTasksTitle}
          </p>
          {sideTasks.length > 0 && (
            <span
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                padding: "0.125rem 0.5rem",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {sideTasks.length} {t.taskCount}
            </span>
          )}
        </div>
      </div>

      {/* Danh sách việc phụ (không chia tab) */}
      <div style={{ padding: "0.625rem 0.75rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <AnimatePresence initial={false}>
          {sideTasks.map((task) => {
            const isCompleting = completingIds.has(task.id);
            return (
              <motion.div
                key={task.id}
                layout
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: isCompleting ? 0.45 : 1, height: "auto" }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.35rem 0.35rem",
                  borderRadius: "var(--radius-sm)",
                  gap: "0.5rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleCompleteClick(task)}
                  title={isVietnamese ? "Đánh dấu hoàn thành để xóa việc này" : "Mark as done to complete & remove"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    flex: 1,
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  {isCompleting ? (
                    <CheckSquare
                      size={17}
                      weight="fill"
                      color="var(--accent)"
                      style={{ flexShrink: 0, marginTop: 1, transition: "transform 0.15s ease", transform: "scale(1.15)" }}
                    />
                  ) : (
                    <Square
                      size={17}
                      weight="regular"
                      color="var(--text-faint)"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: isCompleting ? "var(--text-faint)" : "var(--text)",
                      textDecoration: isCompleting ? "line-through" : "none",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {task.name}
                  </span>
                </button>

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    title={isVietnamese ? "Xóa việc phụ này" : "Delete side task"}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-faint)",
                      padding: "0.25rem",
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.5,
                      transition: "opacity 0.15s ease, color 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                      (e.currentTarget as HTMLElement).style.color = "#DC2626";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.5";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                    }}
                  >
                    <Trash size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sideTasks.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2.5rem 1rem",
              textAlign: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "var(--accent-bg)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <CheckSquare size={22} weight="fill" />
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: "0.25rem",
              }}
            >
              {t.noSideTasksEmpty}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-faint)",
                lineHeight: 1.4,
              }}
            >
              {t.noSideTasksSub}
            </p>
          </div>
        )}
      </div>

      {/* Ô nhập thêm việc phụ mới */}
      <div
        style={{
          padding: "0.625rem 0.75rem",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-alt)",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "0.375rem 0.5rem",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <Plus size={14} color="var(--text-faint)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.sideTaskInputHint}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.8125rem",
              color: "var(--text)",
              width: "100%",
            }}
          />
        </div>
      </div>
    </aside>
  );
}
