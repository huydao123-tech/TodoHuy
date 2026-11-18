"use client";

import { useState } from "react";
import type { SideTaskData } from "@/lib/mockData";
import { Check, CheckSquare, Plus, Trash, PaperPlaneRight } from "@phosphor-icons/react";
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

  const submitNewTask = () => {
    if (!newTaskText.trim()) return;
    if (onAdd) {
      onAdd(newTaskText.trim());
    }
    setNewTaskText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitNewTask();
    }
  };

  const completedLabel = isVietnamese ? "Đánh dấu hoàn thành để xóa việc này" : "Mark as done to complete & remove";
  const deleteLabel = isVietnamese ? "Xóa việc phụ này" : "Delete side task";

  return (
    <aside id="side-panel" className="sp-panel" aria-label={t.sideTasksTitle}>
      {/* Tiêu đề thanh bên phải — dính trên cùng */}
      <header className="sp-head">
        <p className="sp-head-title">{t.sideTasksTitle}</p>
        {sideTasks.length > 0 && (
          <span className="sp-count">
            {sideTasks.length} {t.taskCount}
          </span>
        )}
      </header>

      {/* Danh sách việc phụ — vùng cuộn riêng */}
      <div className="sp-body">
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
                className="sp-task"
              >
                <button
                  type="button"
                  className="sp-task-main"
                  onClick={() => handleCompleteClick(task)}
                  title={completedLabel}
                  aria-label={completedLabel}
                >
                  <span
                    aria-hidden
                    className={`sp-check${isCompleting ? " is-done" : ""}`}
                  >
                    {isCompleting && <Check size={14} weight="bold" color="#fff" />}
                  </span>
                  <span className={`sp-task-text${isCompleting ? " is-done" : ""}`}>
                    {task.name}
                  </span>
                </button>

                {onDelete && (
                  <button
                    type="button"
                    className="sp-task-del"
                    onClick={() => onDelete(task)}
                    title={deleteLabel}
                    aria-label={deleteLabel}
                  >
                    <Trash size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sideTasks.length === 0 && (
          <div className="sp-empty">
            <span className="sp-empty-icon" aria-hidden>
              <CheckSquare size={32} weight="fill" />
            </span>
            <p className="sp-empty-title">{t.noSideTasksEmpty}</p>
            <p className="sp-empty-sub">{t.noSideTasksSub}</p>
          </div>
        )}
      </div>

      {/* Capture dock — ghim đáy panel */}
      <div className="sp-dock">
        <div className="sp-capture">
          <Plus size={20} color="var(--text-faint)" aria-hidden style={{ flexShrink: 0 }} />
          <input
            type="text"
            className="sp-input"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.sideTaskInputHint}
            aria-label={t.sideTaskInputHint}
          />
        </div>
        <button
          type="button"
          className="sp-send"
          onClick={submitNewTask}
          disabled={!newTaskText.trim()}
          title={isVietnamese ? "Thêm việc phụ" : "Add side task"}
          aria-label={isVietnamese ? "Thêm việc phụ" : "Add side task"}
        >
          <PaperPlaneRight size={20} weight="fill" color="#fff" />
        </button>
      </div>

      {/* Scoped styles — skin theo UI-DESIGN-REPORT.md §7 */}
      <style>{`
        .sp-panel {
          width: 280px;
          flex-shrink: 0;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--card-bg);
          border-left: 1px solid var(--border);
          color: var(--text);
        }

        /* ── Header sticky ── */
        .sp-head {
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 14px 16px 10px;
          background: var(--card-bg);
          border-bottom: 1px solid var(--border);
        }

        .sp-head-title {
          margin: 0;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sp-count {
          flex-shrink: 0;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text-muted);
          background: var(--bg-alt);
          border-radius: 8px;
          padding: 3px 7px;
        }

        /* ── Danh sách ── */
        .sp-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 10px 12px 14px;
        }

        .sp-body::-webkit-scrollbar { width: 4px; }
        .sp-body::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 2px; }

        .sp-task {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 12px 14px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow-soft);
          transition: border-color 0.16s ease, background 0.16s ease;
        }

        .sp-task:hover {
          border-color: var(--border-mid);
        }

        .sp-task-main {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          color: inherit;
          border-radius: 8px;
        }

        .sp-check {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          margin-top: 1px;
          border-radius: 999px;
          border: 1.8px solid #CBD5E1;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }

        .sp-task:hover .sp-check {
          border-color: var(--accent);
        }

        .sp-check.is-done {
          background: var(--accent);
          border-color: var(--accent);
          transform: scale(1.06);
        }

        .sp-task-text {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.3;
          word-break: break-word;
          color: var(--text);
          transition: color 0.15s ease;
        }

        .sp-task-text.is-done {
          color: var(--text-faint);
          text-decoration: line-through;
        }

        .sp-task-del {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: none;
          color: var(--text-faint);
          opacity: 0.6;
          cursor: pointer;
          transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
        }

        .sp-task-del:hover {
          opacity: 1;
          color: var(--danger);
          background: var(--danger-bg);
        }

        /* ── Empty state ── */
        .sp-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 6px;
          padding: 32px 16px;
        }

        .sp-empty-icon {
          width: 64px;
          height: 64px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--accent-ghost);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          color: var(--accent);
          margin-bottom: 6px;
        }

        .sp-empty-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.35;
          color: var(--text);
        }

        .sp-empty-sub {
          margin: 0;
          max-width: 220px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* ── Capture dock ── */
        .sp-dock {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px calc(12px + env(safe-area-inset-bottom, 0px));
          background: var(--card-bg);
          border-top: 1px solid var(--border);
        }

        .sp-capture {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          height: 44px;
          padding: 0 12px;
          background: var(--bg-alt);
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .sp-capture:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .sp-input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 13.5px;
          line-height: 1.35;
          color: var(--text);
        }

        .sp-input::placeholder {
          color: var(--text-faint);
          font-size: 13.5px;
        }

        .sp-send {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 12px;
          background: var(--accent);
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35);
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease;
        }

        .sp-send:hover:not(:disabled) {
          background: var(--accent-dark);
        }

        .sp-send:active:not(:disabled) {
          transform: scale(0.96);
        }

        .sp-send:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .sp-send:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        [data-theme="dark"] .sp-check {
          border-color: var(--border-mid);
        }

        [data-theme="dark"] .sp-check.is-done {
          border-color: var(--accent);
        }

        @media (prefers-reduced-motion: reduce) {
          .sp-task,
          .sp-check,
          .sp-task-text,
          .sp-send {
            transition: none;
          }
        }
      `}</style>
    </aside>
  );
}
