"use client";

import { useState } from "react";
import type { SideTaskData } from "@/lib/mockData";
import { CheckSquare, Square, Plus, Trash } from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

type Filter = "all" | "pending" | "done";

interface SidePanelProps {
  sideTasks: SideTaskData[];
  onToggle: (id: string | number) => void;
  onAdd?: (name: string) => void;
  onDelete?: (id: string | number) => void;
}

export default function SidePanel({
  sideTasks,
  onToggle,
  onAdd,
  onDelete,
}: SidePanelProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [newTaskText, setNewTaskText] = useState("");
  const reduce = useReducedMotion();

  const filtered = sideTasks.filter((t) => {
    if (filter === "pending") return !t.isDone;
    if (filter === "done") return t.isDone;
    return true;
  });

  const pendingCount = sideTasks.filter((t) => !t.isDone).length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Chưa xong" },
    { key: "done", label: "Đã xong" },
  ];

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
      aria-label="Đầu việc phụ"
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
          padding: "0.875rem 1rem 0.625rem",
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
            marginBottom: "0.625rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.625rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--text-faint)",
            }}
          >
            Đầu việc phụ
          </p>
          {pendingCount > 0 && (
            <span
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                padding: "0.1rem 0.45rem",
                borderRadius: "var(--radius-pill)",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            >
              {pendingCount} chưa xong
            </span>
          )}
        </div>

        {/* Nút lọc danh sách */}
        <div
          style={{
            display: "flex",
            gap: "0.25rem",
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius-pill)",
                border: "1px solid",
                borderColor: filter === f.key ? "var(--accent)" : "var(--border)",
                background: filter === f.key ? "var(--accent-bg)" : "transparent",
                color: filter === f.key ? "var(--accent)" : "var(--text-muted)",
                cursor: "pointer",
                fontWeight: filter === f.key ? 600 : 400,
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách việc phụ */}
      <div style={{ padding: "0.625rem 0.75rem", flex: 1 }}>
        <AnimatePresence initial={false}>
          {filtered.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.3rem 0.25rem",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <button
                onClick={() => onToggle(task.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  flex: 1,
                  padding: 0,
                }}
              >
                {task.isDone ? (
                  <CheckSquare
                    size={16}
                    weight="fill"
                    color="var(--accent)"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                ) : (
                  <Square
                    size={16}
                    weight="regular"
                    color="var(--text-faint)"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: task.isDone ? "var(--text-faint)" : "var(--text)",
                    textDecoration: task.isDone ? "line-through" : "none",
                    lineHeight: 1.45,
                  }}
                >
                  {task.name}
                </span>
              </button>

              {onDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  title="Xóa việc phụ này"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    padding: "0.2rem",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.6,
                    transition: "opacity 0.15s ease, color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "1";
                    (e.currentTarget as HTMLElement).style.color = "#DC2626";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = "0.6";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                  }}
                >
                  <Trash size={13} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-faint)",
              textAlign: "center",
              padding: "1.5rem 0",
              fontStyle: "italic",
            }}
          >
            {filter === "done"
              ? "Chưa có việc nào hoàn thành."
              : filter === "pending"
              ? "Đã hoàn thành hết việc phụ!"
              : "Không có đầu việc phụ nào."}
          </p>
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
          }}
        >
          <Plus size={13} color="var(--text-faint)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Thêm việc phụ mới... (Enter)"
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
