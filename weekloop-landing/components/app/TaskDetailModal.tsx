"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import type { WorkItemData, WorkItemStatus } from "@/lib/mockData";
import {
  X,
  Circle,
  Hourglass,
  CheckCircle,
  Trash,
  FloppyDisk,
  FileText,
  CalendarBlank,
  Tag,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/languageContext";

export interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WorkItemData | null;
  groupName: string;
  groupColor: string;
  weekLabel: string;
  isPast?: boolean;
  /** Planner không dùng trạng thái nữa; agenda vẫn hiện. */
  showStatus?: boolean;
  onSave: (
    taskId: string | number,
    updates: { content: string; note: string; status: WorkItemStatus }
  ) => void;
  onDelete: (taskId: string | number) => void;
  onMoveToCurrentWeek?: (taskId: string | number) => void;
  onMoveToNextWeek?: (taskId: string | number) => void;
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  groupName,
  groupColor,
  weekLabel,
  isPast = false,
  showStatus = true,
  onSave,
  onDelete,
  onMoveToCurrentWeek,
  onMoveToNextWeek,
}: TaskDetailModalProps) {
  const { t, isVietnamese } = useLanguage();
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<WorkItemStatus>("TODO");
  const [isDeleting, setIsDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Đổi task thì nạp lại nội dung ngay trong render (không dùng effect gây cascading render).
  const [loadedTaskId, setLoadedTaskId] = useState<string | number | null>(null);
  if (!task) {
    if (loadedTaskId !== null) setLoadedTaskId(null);
  } else if (String(loadedTaskId) !== String(task.id)) {
    setLoadedTaskId(task.id);
    setContent(task.content || "");
    setNote(task.note || "");
    setStatus(task.status || "TODO");
    setIsDeleting(false);
  }

  const handleSave = useCallback(() => {
    if (!task) return;
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    onSave(task.id, {
      content: trimmedContent,
      note: note.trim(),
      status,
    });
    onClose();
  }, [content, note, onClose, onSave, status, task]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    if (isDeleting) {
      onDelete(task.id);
      onClose();
    } else {
      setIsDeleting(true);
    }
  }, [isDeleting, onClose, onDelete, task]);

  // Handle ESC and Ctrl/Cmd+Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSave, onClose]);

  if (!isOpen || !task) return null;

  const STATUS_OPTIONS: {
    key: WorkItemStatus;
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }[] = [
    {
      key: "TODO",
      label: t.todoStatus,
      icon: <Circle size={15} weight="regular" />,
      color: "#6b7280",
      bg: "rgba(107, 114, 128, 0.12)",
    },
    {
      key: "IN_PROGRESS",
      label: t.inProgressStatus,
      icon: <Hourglass size={15} weight="bold" />,
      color: "#d97706",
      bg: "rgba(217, 119, 6, 0.14)",
    },
    {
      key: "DONE",
      label: t.doneStatus,
      icon: <CheckCircle size={15} weight="fill" />,
      color: "#16a34a",
      bg: "rgba(22, 163, 74, 0.14)",
    },
  ];

  return (
    <div
      className="task-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="task-modal-container">
        {/* Header */}
        <div className="task-modal-header">
          <div className="task-modal-badges">
            <span
              className="task-group-badge"
              style={{
                backgroundColor: `${groupColor}18`,
                color: groupColor,
                borderColor: `${groupColor}35`,
              }}
            >
              <Tag size={12} weight="bold" />
              {groupName}
            </span>

            <span className="task-week-badge">
              <CalendarBlank size={12} weight="bold" />
              {weekLabel}
            </span>

            {isPast && (
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 650,
                  padding: "0.15rem 0.45rem",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--border)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {isVietnamese ? "Tuần cũ (Chỉ xem)" : "Past week (Read only)"}
              </span>
            )}
          </div>

          <button
            type="button"
            className="task-modal-close-btn"
            onClick={onClose}
            aria-label={t.cancel}
            title={`${t.cancel} (Esc)`}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="task-modal-body">
          {/* Status Selection — Planner đã bỏ trạng thái, chỉ agenda hiện. */}
          {showStatus && (
            <div className="task-field-group">
              <label className="task-field-label">{t.taskStatusLabel}</label>
              <div className="task-status-selector">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = status === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={isPast}
                      className={`task-status-btn ${isActive ? "active" : ""}`}
                      style={{
                        border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? opt.color : "var(--border)"}`,
                        backgroundColor: isActive ? opt.bg : "var(--card-bg)",
                        color: isActive ? opt.color : "var(--text-muted)",
                        fontWeight: isActive ? 600 : 500,
                        cursor: isPast ? "not-allowed" : "pointer",
                        opacity: isPast && !isActive ? 0.5 : 1,
                      }}
                      onClick={() => !isPast && setStatus(opt.key)}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title Input */}
          <div className="task-field-group">
            <label htmlFor="task-title-input" className="task-field-label">
              {t.taskContentLabel} {!isPast && <span style={{ color: "var(--red)" }}>*</span>}
            </label>
            <input
              id="task-title-input"
              ref={titleInputRef}
              type="text"
              disabled={isPast}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isVietnamese ? "Nhập tên công việc..." : "Enter task name..."}
              className="task-title-input"
              style={{
                color: isPast ? "var(--text-muted)" : "var(--text)",
                cursor: isPast ? "not-allowed" : "text",
              }}
            />
          </div>

          {/* Note Textarea */}
          <div className="task-field-group" style={{ flex: 1 }}>
            <div className="task-label-with-hint">
              <label htmlFor="task-note-input" className="task-field-label">
                <FileText size={14} weight="bold" style={{ marginRight: 4 }} />
                {t.taskNoteLabel}
              </label>
              {!isPast && (
                <span className="task-note-hint">
                  {isVietnamese ? "Hỗ trợ ghi chép tự do, checklist, đường link..." : "Supports freeform notes, checklists, links..."}
                </span>
              )}
            </div>
            <textarea
              id="task-note-input"
              disabled={isPast}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isPast ? (isVietnamese ? "Không có ghi chú thêm." : "No notes.") : t.taskNotePlaceholder}
              className="task-note-textarea"
              rows={6}
              style={{
                background: "var(--bg-alt)",
                color: isPast ? "var(--text-muted)" : "var(--text)",
                cursor: isPast ? "not-allowed" : "text",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="task-modal-footer">
          {isPast ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.78125rem", color: "var(--text-muted)" }}>
                {t.readOnlyNotice}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {onMoveToCurrentWeek && (!showStatus || task.status !== "DONE") && (
                  <button
                    type="button"
                    className="task-save-btn"
                    onClick={() => {
                      onMoveToCurrentWeek(task.id);
                      onClose();
                    }}
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 1rem",
                      fontWeight: 600,
                    }}
                  >
                    <ArrowsClockwise size={16} weight="bold" />
                    <span>{t.moveToCurrentWeek || (isVietnamese ? "Dời sang tuần này" : "Move to this week")}</span>
                  </button>
                )}
                {onMoveToNextWeek && (!showStatus || task.status !== "DONE") && (
                  <button
                    type="button"
                    className="task-cancel-btn"
                    onClick={() => {
                      onMoveToNextWeek(task.id);
                      onClose();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.85rem",
                      fontWeight: 600,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ArrowsClockwise size={16} />
                    <span>{t.moveToNextWeek || (isVietnamese ? "Dời sang tuần sau" : "Move to next week")}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="task-cancel-btn"
                  onClick={onClose}
                  style={{ padding: "0.45rem 1.25rem", fontWeight: 600 }}
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-footer-left" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  className={`task-delete-btn ${isDeleting ? "confirm-delete" : ""}`}
                  onClick={handleDelete}
                  title={isDeleting ? (isVietnamese ? "Bấm thêm lần nữa để xác nhận xóa" : "Click again to confirm delete") : t.delete}
                >
                  <Trash size={15} />
                  <span>{isDeleting ? (isVietnamese ? "Xác nhận xóa?" : "Confirm delete?") : t.delete}</span>
                </button>
                {onMoveToNextWeek && task && (!showStatus || task.status !== "DONE") && (
                  <button
                    type="button"
                    className="task-cancel-btn"
                    onClick={() => {
                      onMoveToNextWeek(task.id);
                      onClose();
                    }}
                    title={isVietnamese ? "Dời công việc này sang tuần sau" : "Move this task to next week"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.45rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <ArrowsClockwise size={14} />
                    <span>{t.moveToNextWeek || (isVietnamese ? "Dời sang tuần sau" : "Move to next week")}</span>
                  </button>
                )}
              </div>

              <div className="task-footer-right">
                <span className="task-shortcut-hint">
                  {isVietnamese ? "Ctrl + Enter để lưu" : "Ctrl + Enter to save"}
                </span>
                <button
                  type="button"
                  className="task-cancel-btn"
                  onClick={onClose}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  className="task-save-btn"
                  onClick={handleSave}
                  disabled={!content.trim()}
                >
                  <FloppyDisk size={16} weight="bold" />
                  <span>{t.save}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .task-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.54);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: modalFadeIn 0.18s ease-out forwards;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .task-modal-container {
          background: var(--card-bg);
          width: 100%;
          max-width: 600px;
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-elevated);
          display: flex;
          flex-direction: column;
          max-height: 88vh;
          animation: modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(12px) scale(0.98); }
          to { transform: translateY(0) scale(1); }
        }

        .task-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--card-bg);
        }

        .task-modal-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .task-group-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid transparent;
        }

        .task-week-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: var(--text-muted);
          background: var(--bg-alt);
          border: 1px solid var(--border);
          padding: 4px 9px;
          border-radius: 8px;
        }

        .task-modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .task-modal-close-btn:hover {
          background: var(--bg-alt);
          color: var(--text);
        }

        .task-modal-body {
          padding: 20px 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .task-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .task-field-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .task-label-with-hint {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 4px;
        }

        .task-note-hint {
          font-size: 11px;
          color: var(--text-faint);
        }

        .task-status-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .task-status-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 12px;
          border: 1px solid var(--border);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .task-title-input {
          width: 100%;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
          line-height: 1.3;
          padding: 2px 0;
          border-radius: 8px;
          border: none;
          outline: none;
          color: var(--text);
          background: transparent;
          box-sizing: border-box;
        }
        .task-title-input:focus {
          box-shadow: 0 1px 0 var(--accent);
        }

        .task-note-textarea {
          width: 100%;
          font-size: 14px;
          line-height: 1.55;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          outline: none;
          color: var(--text);
          background: var(--bg-alt);
          resize: vertical;
          min-height: 140px;
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .task-note-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .task-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--card-bg);
        }

        .task-footer-left {
          display: flex;
          align-items: center;
        }

        .task-delete-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--danger);
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .task-delete-btn:hover {
          background: var(--danger-bg);
          border-color: color-mix(in srgb, var(--danger) 35%, transparent);
        }
        .task-delete-btn.confirm-delete {
          background: var(--danger);
          border-color: var(--danger);
          color: #ffffff;
          font-weight: 600;
        }

        .task-footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .task-shortcut-hint {
          font-size: 11px;
          color: var(--text-faint);
          margin-right: 4px;
        }

        .task-cancel-btn {
          background: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .task-cancel-btn:hover {
          background: var(--bg-alt);
          color: var(--text);
        }

        .task-save-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent);
          border: none;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          padding: 9px 18px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.22);
          transition: opacity 0.15s, transform 0.15s, background 0.15s;
        }
        .task-save-btn:hover:not(:disabled) {
          background: var(--accent-dark);
        }
        .task-save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Mobile Responsive Bottom Sheet */
        @media (max-width: 767px) {
          .task-modal-overlay {
            padding: 0;
            align-items: flex-end;
          }
          .task-modal-container {
            max-width: 100% !important;
            border-radius: 24px 24px 0 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
            max-height: 92vh;
            border-top: 1px solid var(--border);
            animation: modalSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes modalSlideUpMobile {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .task-modal-header {
            padding: 12px 16px;
          }
          .task-modal-body {
            padding: 16px;
            gap: 16px;
          }
          .task-modal-footer {
            padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0));
          }
          .task-shortcut-hint {
            display: none;
          }
          .task-status-btn {
            padding: 10px 6px;
            font-size: 11.5px;
            gap: 4px;
          }
          .task-note-textarea {
            min-height: 120px;
          }
        }
      `}</style>
    </div>
  );
}
