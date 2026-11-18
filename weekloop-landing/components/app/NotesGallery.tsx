"use client";

import { useEffect, useState, useMemo } from "react";
import {
  type GalleryNote,
  INITIAL_NOTES,
  NOTION_COVERS,
  NOTION_ICONS,
  NOTION_CATEGORIES,
} from "@/lib/mockData";
import { noteApi, type NoteData } from "@/lib/api";
import { parseNoteColor } from "@/lib/garden/model";
import {
  Plus,
  Trash,
  MagnifyingGlass,
  Tag,
  Clock,
  X,
  Check,
  NoteBlank,
} from "@phosphor-icons/react";
import { useLanguage } from "@/lib/languageContext";

/* ─── Bảng màu pastel cho note (giữ nguyên bộ màu hiện có) ─────────────
   Chỉ phục vụ trình bày: mỗi màu cover được quy về một "tone" CSS. */
const NOTE_TONE_BY_COLOR: Record<string, string> = {
  stone: "stone",
  amber: "amber",
  yellow: "amber",
  mint: "mint",
  green: "mint",
  lilac: "lilac",
  violet: "lilac",
  sky: "sky",
  blue: "sky",
  rose: "rose",
  pink: "rose",
  red: "red",
  orange: "orange",
};

const NOTE_CATEGORY_TONE: Record<string, string> = {
  "Ý tưởng": "amber",
  "Công việc": "sky",
  "Học tập": "mint",
  "Cá nhân": "rose",
  "Dự án": "lilac",
};

function noteToneClass(color?: string): string {
  const key = NOTE_TONE_BY_COLOR[(color || "stone").toLowerCase()] || "stone";
  return `ng-tone-${key}`;
}

function categoryToneClass(category: string): string {
  return `ng-tone-${NOTE_CATEGORY_TONE[category] || "stone"}`;
}

function formatShortDate(value: string, isVietnamese: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(isVietnamese ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function NotesGallery() {
  const { t, isVietnamese } = useLanguage();
  const [notes, setNotes] = useState<GalleryNote[]>([]);
  const [activeNote, setActiveNote] = useState<GalleryNote | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<GalleryNote["category"]>("Ý tưởng");
  const [editIcon, setEditIcon] = useState("📝");
  const [editColor, setEditColor] = useState("stone");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  const parseNoteData = (n: NoteData): GalleryNote => {
    // `color` đóng gói "cover:category:icon" — parse qua helper dùng chung.
    const parsed = parseNoteColor(n.color || "stone");
    const color = parsed.cover;
    const category = parsed.category as GalleryNote["category"];
    const icon = parsed.icon;

    const coverObj = NOTION_COVERS.find((c) => c.id === color) || NOTION_COVERS[0];

    return {
      id: n.id,
      title: n.title,
      content: n.content || "",
      category,
      icon,
      coverGradient: coverObj.gradient,
      color,
      updatedAt: n.updatedAt || new Date().toISOString(),
    };
  };

  const serializeColorPayload = (colorId: string, category: string, icon: string) => {
    return `${colorId}:${category}:${icon}`;
  };

  useEffect(() => {
    const local = localStorage.getItem("weekloop_gallery_notes");
    // Đọc cache local ngay sau effect (microtask) để không chặn paint đầu tiên.
    queueMicrotask(() => {
      if (local) {
        try {
          setNotes(JSON.parse(local));
        } catch {}
      } else {
        setNotes(INITIAL_NOTES);
      }
    });

    noteApi
      .getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const parsed = data.map(parseNoteData);
          setNotes(parsed);
          localStorage.setItem("weekloop_gallery_notes", JSON.stringify(parsed));
        }
      })
      .catch(() => {});
  }, []);

  const updateLocalNotes = (updated: GalleryNote[]) => {
    setNotes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("weekloop_gallery_notes", JSON.stringify(updated));
    }
  };

  const handleOpenNote = (note: GalleryNote) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditIcon(note.icon || "📝");
    setEditColor(note.color || "stone");
    setShowIconPicker(false);
    setSaveStatus("saved");
  };

  const handleCreateNew = async () => {
    const tempId = Date.now();
    const newNote: GalleryNote = {
      id: tempId,
      title: "Ghi chú chưa có tiêu đề",
      content: "",
      category: "Ý tưởng",
      icon: "📝",
      coverGradient: "#F4F4F5",
      color: "stone",
      updatedAt: new Date().toISOString(),
    };

    const next = [newNote, ...notes];
    updateLocalNotes(next);
    handleOpenNote(newNote);

    try {
      const created = await noteApi.create(
        newNote.title,
        newNote.content,
        serializeColorPayload(newNote.color, newNote.category, newNote.icon)
      );
      const withServerId = next.map((n) =>
        n.id === tempId ? { ...n, id: created.id, updatedAt: created.updatedAt } : n
      );
      updateLocalNotes(withServerId);
      setActiveNote((prev) => (prev?.id === tempId ? { ...prev, id: created.id } : prev));
    } catch {}
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    setSaveStatus("saving");

    const coverObj = NOTION_COVERS.find((c) => c.id === editColor) || NOTION_COVERS[0];
    const updatedNote: GalleryNote = {
      ...activeNote,
      title: editTitle.trim() || "Ghi chú chưa có tiêu đề",
      content: editContent,
      category: editCategory,
      icon: editIcon,
      color: editColor,
      coverGradient: coverObj.gradient,
      updatedAt: new Date().toISOString(),
    };

    const next = notes.map((n) => (n.id === activeNote.id ? updatedNote : n));
    updateLocalNotes(next);
    setActiveNote(updatedNote);
    setSaveStatus("saved");

    try {
      await noteApi.update(activeNote.id, {
        title: updatedNote.title,
        content: updatedNote.content,
        color: serializeColorPayload(editColor, editCategory, editIcon),
      });
    } catch {}
  };

  const handleDeleteNote = async (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = notes.filter((n) => n.id !== id);
    updateLocalNotes(next);
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
    try {
      await noteApi.delete(id);
    } catch {}
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === "Tất cả" || note.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [notes, searchQuery, selectedCategory]);

  const isFiltering = searchQuery.trim().length > 0 || selectedCategory !== "Tất cả";
  const emptyTitle = isFiltering
    ? isVietnamese
      ? "Không tìm thấy ghi chú phù hợp"
      : "No matching notes"
    : (t.noNotesEmpty.split("\n")[0] || t.noNotesEmpty);
  const emptyDesc = isFiltering
    ? isVietnamese
      ? "Thử từ khoá khác hoặc bỏ bộ lọc danh mục."
      : "Try another keyword or clear the category filter."
    : t.noNotesEmpty.split("\n")[1] || "";

  return (
    <div className="ng-shell">
      <div className="ng-inner">
        {/* ─── Thanh công cụ: search card + nút tạo mới ──────────────────── */}
        <div className="ng-toolbar">
          <div className="ng-search">
            <MagnifyingGlass size={20} color="var(--text-muted)" aria-hidden style={{ flexShrink: 0 }} />
            <input
              type="text"
              className="ng-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchNotesHint}
              aria-label={t.searchNotesHint}
            />
            {searchQuery && (
              <button
                type="button"
                className="ng-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label={isVietnamese ? "Xoá tìm kiếm" : "Clear search"}
                title={isVietnamese ? "Xoá tìm kiếm" : "Clear search"}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="btn-primary ng-new-btn"
            aria-label={t.newNote}
            title={t.newNote}
          >
            <Plus size={16} weight="bold" aria-hidden />
            <span>{t.newNote}</span>
          </button>
        </div>

        {/* ─── Category chips ─────────────────────────────────────────────── */}
        <div className="ng-chips-row">
          <div className="ng-chips" role="group" aria-label={t.category}>
            <button
              type="button"
              className={`ng-chip${selectedCategory === "Tất cả" ? " is-active" : ""}`}
              aria-pressed={selectedCategory === "Tất cả"}
              onClick={() => setSelectedCategory("Tất cả")}
            >
              {isVietnamese ? "Tất cả" : "All"}
            </button>
            {NOTION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`ng-chip${selectedCategory === cat ? " is-active" : ""}`}
                aria-pressed={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="ng-count">
            {filteredNotes.length} {isVietnamese ? "ghi chú" : "notes"}
          </span>
        </div>

        {/* ─── Masonry gallery ────────────────────────────────────────────── */}
        {filteredNotes.length > 0 ? (
          <div className="ng-masonry">
            {filteredNotes.map((note) => {
              const toneClass = noteToneClass(note.color);
              const catClass = categoryToneClass(note.category);
              const displayTitle =
                note.title || (isVietnamese ? "Ghi chú chưa có tiêu đề" : "Untitled note");
              const displayContent =
                note.content || (isVietnamese ? "Ghi chú trống..." : "Empty note...");
              const dateLabel = formatShortDate(note.updatedAt, isVietnamese);
              return (
                <article key={note.id} className={`ng-note ${toneClass}`}>
                  <button
                    type="button"
                    className="ng-note-del"
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    title={isVietnamese ? "Xóa ghi chú" : "Delete note"}
                    aria-label={isVietnamese ? "Xóa ghi chú" : "Delete note"}
                  >
                    <Trash size={14} />
                  </button>

                  <button type="button" className="ng-note-hit" onClick={() => handleOpenNote(note)}>
                    <span className="ng-note-top">
                      <span className="ng-note-badge" aria-hidden>
                        {note.icon || "📝"}
                      </span>
                      <span className={`ng-pill ${catClass}`}>{note.category}</span>
                    </span>

                    <span className="ng-note-title">{displayTitle}</span>
                    <span className="ng-note-body">{displayContent}</span>

                    <span className="ng-note-foot">
                      <Clock size={12} aria-hidden />
                      <span>{dateLabel}</span>
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="ng-empty">
            <span className="ng-empty-icon" aria-hidden>
              <NoteBlank size={32} weight="duotone" />
            </span>
            <p className="ng-empty-title">{emptyTitle}</p>
            {emptyDesc && <p className="ng-empty-sub">{emptyDesc}</p>}
          </div>
        )}
      </div>

      {/* ─── Note editor: desktop modal / mobile bottom sheet ─────────────── */}
      {activeNote && (
        <div
          className={`ng-modal-backdrop ${noteToneClass(editColor)}`}
          onClick={() => {
            handleSaveNote();
            setActiveNote(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.editNote}
            className="ng-editor"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ng-editor-handle" aria-hidden />

            {/* Header pastel: icon + tiêu đề + trạng thái lưu + đóng */}
            <div className="ng-editor-head">
              <div className="ng-editor-title-row">
                <div className="ng-icon-wrap">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    title={isVietnamese ? "Đổi biểu tượng" : "Change icon"}
                    aria-label={isVietnamese ? "Đổi biểu tượng" : "Change icon"}
                    aria-expanded={showIconPicker}
                    className="ng-icon-btn"
                  >
                    {editIcon}
                  </button>

                  {showIconPicker && (
                    <div className="ng-icon-pop">
                      {NOTION_ICONS.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          className={`ng-icon-option${editIcon === ico ? " is-active" : ""}`}
                          onClick={() => {
                            setEditIcon(ico);
                            setShowIconPicker(false);
                            handleSaveNote();
                          }}
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  className="ng-title-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder={isVietnamese ? "Tiêu đề ghi chú" : "Note title"}
                  aria-label={t.noteTitle}
                />

                <div className="ng-editor-actions">
                  <span className={`ng-save${saveStatus === "saved" ? "" : " is-busy"}`}>
                    {saveStatus === "saved" ? (
                      <>
                        <Check size={13} aria-hidden /> {isVietnamese ? "Đã lưu" : "Saved"}
                      </>
                    ) : isVietnamese ? (
                      "Đang lưu..."
                    ) : (
                      "Saving..."
                    )}
                  </span>
                  <button
                    type="button"
                    className="ng-close"
                    onClick={() => {
                      handleSaveNote();
                      setActiveNote(null);
                    }}
                    aria-label={isVietnamese ? "Đóng" : "Close"}
                    title={isVietnamese ? "Đóng" : "Close"}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Metadata row: category + ngày cập nhật */}
              <div className="ng-editor-meta">
                <span className="ng-meta-label">
                  <Tag size={13} aria-hidden />
                  {t.category}
                </span>
                <div className="ng-editor-cats" role="group" aria-label={t.category}>
                  {NOTION_CATEGORIES.map((cat) => {
                    const selected = editCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`ng-chip ng-chip-sm${selected ? " is-active" : ""}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setEditCategory(cat);
                          handleSaveNote();
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <span className="ng-meta-date">
                  <Clock size={13} aria-hidden />
                  {formatShortDate(activeNote.updatedAt, isVietnamese)}
                </span>
              </div>
            </div>

            {/* Body */}
            <textarea
              className="ng-editor-body"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveNote}
              placeholder={t.noteContentHint}
              aria-label={t.noteContentHint}
            />

            {/* Footer dock */}
            <div className="ng-editor-foot">
              <button
                type="button"
                className="ng-btn ng-btn-danger"
                onClick={() => handleDeleteNote(activeNote.id)}
              >
                <Trash size={15} aria-hidden />
                <span>{t.delete}</span>
              </button>

              <div className="ng-foot-right">
                <button
                  type="button"
                  className="ng-btn ng-btn-outline"
                  onClick={() => setActiveNote(null)}
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  className="ng-btn ng-btn-accent"
                  onClick={() => {
                    handleSaveNote();
                    setActiveNote(null);
                  }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped styles — skin theo UI-DESIGN-REPORT.md §6 + §15.8 */}
      <style>{`
        .ng-shell {
          flex: 1;
          min-width: 0;
          min-height: 100%;
          overflow-y: auto;
          background: var(--bg);
          padding: 24px;
        }

        .ng-inner {
          width: 100%;
          max-width: 1200px;
          margin-inline: auto;
        }

        /* ── Toolbar: search card + nút tạo mới ── */
        .ng-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .ng-search {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 48px;
          padding: 0 14px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          box-shadow: var(--shadow-soft);
          transition: border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .ng-search:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
        }

        .ng-search-input {
          flex: 1;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 14.5px;
          line-height: 1.35;
          color: var(--text);
        }

        .ng-search-input::placeholder {
          color: var(--text-faint);
          font-size: 13.5px;
        }

        .ng-search-clear {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-faint);
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .ng-search-clear:hover {
          color: var(--text);
          background: var(--bg-alt);
        }

        .ng-new-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 44px;
          padding: 0 16px;
          font-size: 13.5px;
          font-weight: 600;
        }

        /* ── Category chips ── */
        .ng-chips-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .ng-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
          min-width: 0;
        }

        .ng-chips::-webkit-scrollbar { display: none; }

        .ng-chip {
          flex-shrink: 0;
          height: 36px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text-muted);
          font-family: inherit;
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1;
          white-space: nowrap;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
        }

        .ng-chip:hover {
          border-color: var(--border-mid);
          color: var(--text);
        }

        .ng-chip.is-active {
          background: var(--accent-ghost);
          border-color: var(--accent);
          color: var(--accent-contrast);
          font-weight: 700;
        }

        .ng-count {
          flex-shrink: 0;
          margin-left: auto;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-faint);
          white-space: nowrap;
        }

        /* ── Masonry: 2 / 3 / 4 cột theo breakpoint ── */
        .ng-masonry {
          columns: 2;
          column-gap: 16px;
        }

        @media (min-width: 768px) {
          .ng-masonry { columns: 3; }
        }

        @media (min-width: 1280px) {
          .ng-masonry { columns: 4; }
        }

        /* ── Tone pastel cho note (light) ── */
        .ng-tone-stone  { --tone-raw: #E7E5E4; --tone-bg: #F4F4F5; --tone-line: #E7E5E4; --tone-ink: #57534E; }
        .ng-tone-amber  { --tone-raw: #FDE68A; --tone-bg: #FEFCE8; --tone-line: #FDE68A; --tone-ink: #A16207; }
        .ng-tone-mint   { --tone-raw: #BBF7D0; --tone-bg: #F0FDF4; --tone-line: #BBF7D0; --tone-ink: #15803D; }
        .ng-tone-lilac  { --tone-raw: #DDD6FE; --tone-bg: #FAF5FF; --tone-line: #DDD6FE; --tone-ink: #6D28D9; }
        .ng-tone-sky    { --tone-raw: #BFDBFE; --tone-bg: #EFF6FF; --tone-line: #BFDBFE; --tone-ink: #1D4ED8; }
        .ng-tone-rose   { --tone-raw: #FBCFE8; --tone-bg: #FDF2F8; --tone-line: #FBCFE8; --tone-ink: #BE185D; }
        .ng-tone-red    { --tone-raw: #FECACA; --tone-bg: #FEF2F2; --tone-line: #FECACA; --tone-ink: #B91C1C; }
        .ng-tone-orange { --tone-raw: #FED7AA; --tone-bg: #FFF7ED; --tone-line: #FED7AA; --tone-ink: #C2410C; }

        /* Tone pastel cho note (dark): trộn 10–35% với surface tối */
        [data-theme="dark"] [class*="ng-tone-"] {
          --tone-bg: color-mix(in srgb, var(--tone-raw) 22%, var(--card-bg));
          --tone-line: color-mix(in srgb, var(--tone-raw) 35%, transparent);
          --tone-ink: color-mix(in srgb, var(--tone-raw) 72%, #FFFFFF);
          --tone-panel: color-mix(in srgb, var(--tone-raw) 10%, var(--card-bg));
        }

        /* ── Note card ── */
        .ng-note {
          position: relative;
          display: block;
          break-inside: avoid;
          margin-bottom: 16px;
          background: var(--tone-panel, var(--card-bg));
          border: 1.2px solid var(--tone-line, var(--border));
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-soft);
          overflow: hidden;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }

        .ng-note:hover {
          border-color: var(--tone-ink, var(--border-mid));
          box-shadow: var(--shadow-elevated);
          transform: translateY(-1px);
        }

        .ng-note-hit {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border: none;
          background: transparent;
          text-align: left;
          font-family: inherit;
          color: inherit;
          cursor: pointer;
          border-radius: inherit;
        }

        /* Card cắt overflow nên focus ring phải nằm bên trong */
        #notes-view .ng-note-hit:focus-visible {
          outline-offset: -3px;
        }

        .ng-note-top {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding-right: 26px;
        }

        .ng-note-badge {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          line-height: 1;
          border-radius: 10px;
          background: var(--tone-bg, var(--bg-alt));
          border: 1px solid var(--tone-line, var(--border));
        }

        .ng-pill {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          padding: 3px 7px;
          border-radius: 8px;
          background: var(--tone-bg, var(--bg-alt));
          color: var(--tone-ink, var(--text-muted));
          font-size: 10.5px;
          font-weight: 600;
          line-height: 1.25;
          letter-spacing: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ng-note-title {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.2px;
          color: var(--text);
          word-break: break-word;
        }

        .ng-note-body {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 12.5px;
          font-weight: 400;
          line-height: 1.4;
          color: var(--text-muted);
          word-break: break-word;
        }

        .ng-note-foot {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-top: 2px;
          padding-top: 8px;
          border-top: 1px solid var(--tone-line, var(--border));
          font-size: 11px;
          font-weight: 500;
          line-height: 1.2;
          color: var(--text-faint);
        }

        .ng-note-del {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-faint);
          opacity: 0;
          cursor: pointer;
          transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
        }

        .ng-note:hover .ng-note-del,
        .ng-note-del:focus-visible {
          opacity: 1;
        }

        .ng-note-del:hover {
          color: var(--danger);
          background: var(--danger-bg);
        }

        /* Thiết bị cảm ứng không có hover: luôn hiện nút xoá */
        @media (hover: none) {
          .ng-note-del { opacity: 1; }
        }

        /* ── Empty state ── */
        .ng-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 8px;
          padding: 64px 24px;
        }

        .ng-empty-icon {
          width: 64px;
          height: 64px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: var(--accent-ghost);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          color: var(--accent);
          margin-bottom: 4px;
        }

        .ng-empty-title {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.4;
          color: var(--text);
        }

        .ng-empty-sub {
          margin: 0;
          max-width: 320px;
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* ── Editor modal / mobile sheet ── */
        .ng-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: ng-fade 0.16s ease;
        }

        .ng-editor {
          width: 100%;
          max-width: 680px;
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--tone-panel, var(--tone-bg));
          border: 1px solid var(--tone-line, var(--border));
          border-radius: var(--radius-sheet);
          box-shadow: var(--shadow-elevated);
          animation: ng-pop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ng-editor-handle {
          display: none;
          width: 36px;
          height: 4px;
          margin: 10px auto 2px;
          border-radius: 999px;
          background: var(--tone-line, var(--border-mid));
          flex-shrink: 0;
        }

        .ng-editor-head {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 24px 12px;
          border-bottom: 1px solid var(--tone-line, var(--border));
        }

        .ng-editor-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .ng-icon-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .ng-icon-btn {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          line-height: 1;
          border-radius: 12px;
          border: 1px solid var(--tone-line, var(--border));
          background: var(--card-bg);
          cursor: pointer;
          transition: border-color 0.15s ease, transform 0.12s ease;
        }

        .ng-icon-btn:hover {
          border-color: var(--tone-ink, var(--accent));
        }

        .ng-icon-pop {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 30;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
          padding: 8px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow-elevated);
        }

        .ng-icon-option {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
        }

        .ng-icon-option:hover {
          background: var(--bg-alt);
        }

        .ng-icon-option.is-active {
          background: var(--accent-bg);
          border-color: var(--accent);
        }

        .ng-title-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font-family: inherit;
          font-size: 22px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.3px;
          color: var(--text);
        }

        .ng-title-input::placeholder {
          color: var(--text-faint);
        }

        .ng-editor-actions {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ng-save {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 600;
          line-height: 1.2;
          color: var(--accent-contrast);
          white-space: nowrap;
        }

        .ng-save.is-busy {
          color: var(--text-faint);
        }

        .ng-close {
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }

        .ng-close:hover {
          background: var(--card-bg);
          color: var(--text);
        }

        .ng-editor-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px 14px;
          font-size: 12px;
          line-height: 1.3;
          color: var(--text-muted);
        }

        .ng-meta-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .ng-editor-cats {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ng-chip-sm {
          height: 36px;
          padding: 0 12px;
          font-size: 12.5px;
          border-radius: 10px;
        }

        .ng-meta-date {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          font-size: 11.5px;
          color: var(--text-faint);
          white-space: nowrap;
        }

        .ng-editor-body {
          flex: 1;
          min-height: 240px;
          width: 100%;
          padding: 16px 24px;
          border: none;
          outline: none;
          resize: none;
          background: transparent;
          font-family: inherit;
          font-size: 15px;
          font-weight: 400;
          line-height: 1.6;
          color: var(--text);
        }

        .ng-editor-body::placeholder {
          color: var(--text-faint);
        }

        .ng-editor-foot {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 24px calc(12px + env(safe-area-inset-bottom, 0px));
          background: var(--card-bg);
          border-top: 1px solid var(--tone-line, var(--border));
        }

        .ng-foot-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .ng-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 40px;
          padding: 0 16px;
          border-radius: var(--radius);
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 600;
          line-height: 1.2;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
        }

        .ng-btn-outline {
          border: 1px solid var(--border);
          background: var(--card-bg);
          color: var(--text-muted);
        }

        .ng-btn-outline:hover {
          border-color: var(--border-mid);
          color: var(--text);
        }

        .ng-btn-danger {
          border: 1px solid color-mix(in srgb, var(--danger) 45%, transparent);
          background: transparent;
          color: var(--danger);
        }

        .ng-btn-danger:hover {
          background: var(--danger-bg);
          border-color: var(--danger);
        }

        .ng-btn-accent {
          border: 1px solid var(--accent);
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.24);
        }

        .ng-btn-accent:hover {
          background: var(--accent-dark);
          border-color: var(--accent-dark);
        }

        .ng-btn:active {
          transform: scale(0.98);
        }

        @keyframes ng-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ng-pop {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Responsive ── */
        @media (max-width: 767px) {
          .ng-shell { padding: 16px; }

          .ng-toolbar {
            gap: 8px;
            margin-bottom: 12px;
          }

          .ng-new-btn {
            padding: 0 12px;
            font-size: 13px;
          }

          .ng-count { display: none; }

          .ng-modal-backdrop {
            align-items: flex-end;
            padding: 0;
          }

          .ng-editor {
            max-width: none;
            height: 88dvh;
            max-height: 88dvh;
            border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
            border-bottom: none;
            animation: ng-sheet 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .ng-editor-handle { display: block; }

          .ng-editor-head {
            padding: 10px 16px 10px;
          }

          /* Mobile: icon + actions một hàng, tiêu đề 22px xuống hàng riêng */
          .ng-editor-title-row {
            flex-wrap: wrap;
          }

          .ng-title-input {
            order: 3;
            flex: 1 1 100%;
            font-size: 22px;
          }

          .ng-editor-actions {
            margin-left: auto;
          }

          .ng-editor-body {
            padding: 14px 16px;
            min-height: 160px;
          }

          .ng-editor-foot {
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom, 0px));
          }

          .ng-btn {
            height: 42px;
            padding: 0 14px;
          }

          .ng-icon-pop { left: 0; right: auto; }
        }

        @media (max-width: 480px) {
          .ng-new-btn span { display: none; }
          .ng-new-btn { width: 44px; padding: 0; justify-content: center; }
        }

        @keyframes ng-sheet {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Dark mode: bỏ shadow card, giữ viền ── */
        [data-theme="dark"] .ng-note:hover {
          box-shadow: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .ng-note,
          .ng-chip,
          .ng-search,
          .ng-btn {
            transition: none;
          }

          .ng-modal-backdrop,
          .ng-editor {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
