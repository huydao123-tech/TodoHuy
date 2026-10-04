"use client";

import React, { useState, useEffect, useRef } from "react";
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
  onSave: (
    taskId: string | number,
    updates: { content: string; note: string; status: WorkItemStatus }
  ) => void;
  onDelete: (taskId: string | number) => void;
  onMoveToCurrentWeek?: (taskId: string | number) => void;
}

export default function TaskDetailModal({
  isOpen,
  onClose,
  task,
  groupName,
  groupColor,
  weekLabel,
  isPast = false,
  onSave,
  onDelete,
  onMoveToCurrentWeek,
}: TaskDetailModalProps) {
  const { t, isVietnamese } = useLanguage();
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<WorkItemStatus>("TODO");
  const [isDeleting, setIsDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setContent(task.content || "");
      setNote(task.note || "");
      setStatus(task.status || "TODO");
      setIsDeleting(false);
    }
  }, [task]);

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
  }, [isOpen, content, note, status]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    onSave(task.id, {
      content: trimmedContent,
      note: note.trim(),
      status,
    });
    onClose();
  };

  const handleDelete = () => {
    if (isDeleting) {
      onDelete(task.id);
      onClose();
    } else {
      setIsDeleting(true);
    }
  };

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
                  background: "#F5F5F4",
                  color: "#78716C",
                  border: "1px solid #E7E5E4",
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
          {/* Status Selection */}
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
                      borderColor: isActive ? opt.color : "var(--border)",
                      backgroundColor: isActive ? opt.bg : "#fff",
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
                background: isPast ? "var(--bg-alt)" : "#fff",
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
                background: isPast ? "var(--bg-alt)" : "#fff",
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
                {onMoveToCurrentWeek && task.status !== "DONE" && (
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
              <div className="task-footer-left">
                <button
                  type="button"
                  className={`task-delete-btn ${isDeleting ? "confirm-delete" : ""}`}
                  onClick={handleDelete}
                  title={isDeleting ? (isVietnamese ? "Bấm thêm lần nữa để xác nhận xóa" : "Click again to confirm delete") : t.delete}
                >
                  <Trash size={15} />
                  <span>{isDeleting ? (isVietnamese ? "Xác nhận xóa?" : "Confirm delete?") : t.delete}</span>
                </button>
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
          background: rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: modalFadeIn 0.18s ease-out forwards;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .task-modal-container {
          background: var(--bg);
          width: 100%;
          max-width: 580px;
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06);
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
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-alt, #fafaf9);
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
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-pill, 9999px);
          border: 1px solid transparent;
        }

        .task-week-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          background: #fff;
          border: 1px solid var(--border);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-pill, 9999px);
        }

        .task-modal-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .task-modal-close-btn:hover {
          background: rgba(0, 0, 0, 0.06);
          color: var(--text);
        }

        .task-modal-body {
          padding: 1.25rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .task-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .task-field-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text);
          display: flex;
          align-items: center;
        }

        .task-label-with-hint {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .task-note-hint {
          font-size: 0.6875rem;
          color: var(--text-faint);
        }

        .task-status-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .task-status-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius, 8px);
          border: 1px solid var(--border);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .task-title-input {
          width: 100%;
          font-size: 0.9375rem;
          font-weight: 500;
          padding: 0.55rem 0.75rem;
          border-radius: var(--radius, 8px);
          border: 1px solid var(--border);
          outline: none;
          color: var(--text);
          background: var(--bg-alt);
          transition: border-color 0.15s, box-shadow 0.15s;
          box-sizing: border-box;
        }
        .task-title-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }

        .task-note-textarea {
          width: 100%;
          font-size: 0.875rem;
          line-height: 1.55;
          padding: 0.75rem;
          border-radius: var(--radius, 8px);
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
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.12);
        }

        .task-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-top: 1px solid var(--border);
          background: var(--bg-alt, #fafaf9);
        }

        .task-footer-left {
          display: flex;
          align-items: center;
        }

        .task-delete-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: transparent;
          border: 1px solid transparent;
          color: var(--red, #ef4444);
          font-size: 0.8125rem;
          padding: 0.45rem 0.65rem;
          border-radius: var(--radius, 8px);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .task-delete-btn:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .task-delete-btn.confirm-delete {
          background: var(--red, #ef4444);
          color: #ffffff;
          font-weight: 600;
        }

        .task-footer-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-shortcut-hint {
          font-size: 0.6875rem;
          color: var(--text-faint);
          margin-right: 0.25rem;
        }

        .task-cancel-btn {
          background: #fff;
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 0.8125rem;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius, 8px);
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
          gap: 0.4rem;
          background: var(--accent, #16a34a);
          border: none;
          color: #ffffff;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.45rem 1rem;
          border-radius: var(--radius, 8px);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(22, 163, 74, 0.3);
          transition: opacity 0.15s, transform 0.15s;
        }
        .task-save-btn:hover:not(:disabled) {
          opacity: 0.92;
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
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            max-height: 92vh;
            border-top: 1px solid var(--border);
            animation: modalSlideUpMobile 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes modalSlideUpMobile {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .task-modal-header {
            padding: 0.75rem 1rem;
          }
          .task-modal-body {
            padding: 1rem;
            gap: 1rem;
          }
          .task-modal-footer {
            padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0));
          }
          .task-shortcut-hint {
            display: none;
          }
          .task-status-btn {
            padding: 0.45rem 0.35rem;
            font-size: 0.75rem;
            gap: 0.25rem;
          }
          .task-note-textarea {
            min-height: 120px;
          }
        }
      `}</style>
    </div>
  );
}
