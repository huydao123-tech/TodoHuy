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
import {
  Plus,
  Trash,
  MagnifyingGlass,
  Tag,
  Clock,
  X,
  Check,
  SquaresFour,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/lib/languageContext";

// Màu pastel chuẩn Notion cho từng danh mục
const NOTION_TAGS: Record<string, { bg: string; text: string }> = {
  "Ý tưởng": { bg: "#FBF3DB", text: "#8F6B00" },
  "Công việc": { bg: "#E7F3F8", text: "#1D6586" },
  "Học tập": { bg: "#EDF3EC", text: "#2B6E44" },
  "Cá nhân": { bg: "#F9EEF3", text: "#9B386C" },
  "Dự án": { bg: "#F4F0F7", text: "#69408C" },
};

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
    let color = n.color || "stone";
    let category: GalleryNote["category"] = "Ý tưởng";
    let icon = "📝";

    if (color.includes(":")) {
      const parts = color.split(":");
      color = parts[0] || "stone";
      if (parts[1] && (NOTION_CATEGORIES as readonly string[]).includes(parts[1])) {
        category = parts[1] as GalleryNote["category"];
      }
      if (parts[2]) icon = parts[2];
    }

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
    if (local) {
      try {
        setNotes(JSON.parse(local));
      } catch {}
    } else {
      setNotes(INITIAL_NOTES);
    }

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

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.75rem 2rem 3rem",
        background: "var(--bg)",
        minHeight: "100%",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* ─── NOTION DATABASE HEADER ────────────────────────────────────────── */}
        <div
          className="notes-header-controls"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid var(--border)",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text)",
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius)",
                background: "var(--bg-alt)",
              }}
            >
              <SquaresFour size={15} />
              Gallery
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-faint)" }}>
              {notes.length} {isVietnamese ? "ghi chú" : "notes"}
            </span>
          </div>

          <div className="notes-header-actions" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {/* Search Input */}
            <div
              className="notes-search-input"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.55rem",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--bg)",
                width: 180,
              }}
            >
              <MagnifyingGlass size={13} color="var(--text-faint)" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchNotesHint}
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: "0.78125rem",
                  width: "100%",
                  background: "transparent",
                  color: "var(--text)",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--text-faint)" }}
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <button
              onClick={handleCreateNew}
              className="btn-primary"
              style={{
                padding: "0.3rem 0.75rem",
                fontSize: "0.8125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={14} weight="bold" />
              <span>{t.newNote}</span>
            </button>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="notes-category-pills">
          <button
            onClick={() => setSelectedCategory("Tất cả")}
            style={{
              fontSize: "0.75rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "var(--radius)",
              border: "1px solid",
              borderColor: selectedCategory === "Tất cả" ? "var(--text)" : "var(--border)",
              background: selectedCategory === "Tất cả" ? "var(--text)" : "transparent",
              color: selectedCategory === "Tất cả" ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {isVietnamese ? "Tất cả" : "All"}
          </button>
          {NOTION_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid",
                  borderColor: active ? "var(--text)" : "var(--border)",
                  background: active ? "var(--text)" : "transparent",
                  color: active ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ─── NOTION GALLERY GRID ─────────────────────────────────────────── */}
        <div className="notes-gallery-grid">
          {filteredNotes.map((note) => {
            const tagStyle = NOTION_TAGS[note.category] || { bg: "#F1F1EF", text: "#5A5A58" };
            return (
              <article
                key={note.id}
                onClick={() => handleOpenNote(note)}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--card-bg, #fff)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 180,
                  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
                  overflow: "hidden",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 10px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                {/* Clean muted header */}
                <div
                  style={{
                    height: 52,
                    background: note.coverGradient || "var(--bg-alt)",
                    borderBottom: "1px solid var(--border)",
                    position: "relative",
                  }}
                >
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    title={isVietnamese ? "Xóa ghi chú" : "Delete note"}
                    style={{
                      position: "absolute",
                      top: "0.35rem",
                      right: "0.35rem",
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "var(--radius-sm)",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "var(--text-faint)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#DC2626";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--text-faint)";
                    }}
                  >
                    <Trash size={11} />
                  </button>
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: "0.75rem 0.875rem",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Title with inline icon */}
                  <h3
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 580,
                      color: "var(--text)",
                      margin: 0,
                      display: "flex",
                      alignItems: "baseline",
                      gap: "0.35rem",
                      lineHeight: 1.35,
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>{note.icon || "📝"}</span>
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {note.title || (isVietnamese ? "Ghi chú chưa có tiêu đề" : "Untitled Note")}
                    </span>
                  </h3>

                  {/* Content Preview */}
                  <p
                    style={{
                      fontSize: "0.78125rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      marginTop: "0.4rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                    }}
                  >
                    {note.content || (isVietnamese ? "Ghi chú trống..." : "Empty note...")}
                  </p>

                  {/* Tag & Date Footer */}
                  <div
                    style={{
                      marginTop: "0.6rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.1rem 0.4rem",
                        borderRadius: 3,
                        background: tagStyle.bg,
                        color: tagStyle.text,
                        fontWeight: 500,
                      }}
                    >
                      {note.category}
                    </span>

                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-faint)",
                        fontFamily: "var(--font-geist-mono), monospace",
                      }}
                    >
                      {new Date(note.updatedAt).toLocaleDateString(isVietnamese ? "vi-VN" : "en-US")}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* New Card button */}
          <button
            onClick={handleCreateNew}
            style={{
              minHeight: 180,
              border: "1px dashed var(--border-mid)",
              borderRadius: "var(--radius)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              color: "var(--text-muted)",
              transition: "border-color 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--text-muted)";
              (e.currentTarget as HTMLElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-mid)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
              {isVietnamese ? "Tạo thẻ mới" : "Create new card"}
            </span>
          </button>
        </div>
      </div>

      {/* ─── NOTION PAGE DETAIL MODAL ─────────────────────────────────────── */}
      {activeNote && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "1rem",
          }}
          onClick={() => {
            handleSaveNote();
            setActiveNote(null);
          }}
        >
          <div
            style={{
              background: "var(--card-bg, #fff)",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: 720,
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 35px -5px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal top navigation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.5rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                <span>{t.notes}</span>
                <span>/</span>
                <span style={{ color: "var(--text)", fontWeight: 500 }}>
                  {editTitle || (isVietnamese ? "Chưa có tiêu đề" : "Untitled")}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: saveStatus === "saved" ? "var(--accent)" : "var(--text-faint)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                  }}
                >
                  {saveStatus === "saved" ? (
                    <>
                      <Check size={12} /> {isVietnamese ? "Đã lưu" : "Saved"}
                    </>
                  ) : (
                    isVietnamese ? "Đang lưu..." : "Saving..."
                  )}
                </span>

                <button
                  onClick={() => {
                    handleSaveNote();
                    setActiveNote(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    padding: "0.2rem",
                    display: "flex",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal page body */}
            <div
              style={{
                padding: "1.5rem 2rem",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Icon selector & Title */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    title={isVietnamese ? "Đổi biểu tượng" : "Change icon"}
                    style={{
                      fontSize: "1.5rem",
                      width: 38,
                      height: 38,
                      borderRadius: "var(--radius)",
                      background: "var(--bg-alt)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {editIcon}
                  </button>

                  {showIconPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "0.3rem",
                        background: "var(--card-bg, #fff)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)",
                        padding: "0.4rem",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "0.3rem",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                        zIndex: 30,
                      }}
                    >
                      {NOTION_ICONS.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => {
                            setEditIcon(ico);
                            setShowIconPicker(false);
                            handleSaveNote();
                          }}
                          style={{
                            fontSize: "1.1rem",
                            padding: "0.2rem",
                            background: editIcon === ico ? "var(--accent-bg)" : "none",
                            border: "none",
                            borderRadius: 3,
                            cursor: "pointer",
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
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder={isVietnamese ? "Tiêu đề ghi chú" : "Note title"}
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 620,
                    border: "none",
                    outline: "none",
                    width: "100%",
                    color: "var(--text)",
                    background: "transparent",
                  }}
                />
              </div>

              {/* Properties row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Tag size={13} />
                  <span>{t.category}:</span>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    {NOTION_CATEGORIES.map((cat) => {
                      const selected = editCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setEditCategory(cat);
                            handleSaveNote();
                          }}
                          style={{
                            fontSize: "0.725rem",
                            padding: "0.15rem 0.45rem",
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: selected ? "var(--text)" : "var(--border)",
                            background: selected ? "var(--text)" : "transparent",
                            color: selected ? "#fff" : "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-faint)" }}>
                  <Clock size={13} />
                  <span>{new Date(activeNote.updatedAt).toLocaleDateString(isVietnamese ? "vi-VN" : "en-US")}</span>
                </div>
              </div>

              {/* Content textarea */}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleSaveNote}
                placeholder={t.noteContentHint}
                style={{
                  minHeight: 280,
                  width: "100%",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.65,
                  fontSize: "0.9375rem",
                  color: "var(--text)",
                  fontFamily: "inherit",
                  flex: 1,
                  background: "transparent",
                }}
              />
            </div>

            {/* Modal footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.625rem 1.5rem",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-alt)",
              }}
            >
              <button
                type="button"
                onClick={() => handleDeleteNote(activeNote.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#DC2626",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.25rem 0.5rem",
                }}
              >
                <Trash size={13} />
                <span>{isVietnamese ? "Xóa ghi chú" : "Delete note"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveNote();
                  setActiveNote(null);
                }}
                className="btn-primary"
                style={{
                  padding: "0.35rem 0.85rem",
                  fontSize: "0.8125rem",
                }}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Styles for NotesGallery */}
      <style>{`
        .notes-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
        }
        .notes-category-pills {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 1.25rem;
          overflow-x: auto;
          flex-wrap: nowrap;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .notes-category-pills::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 640px) {
          .notes-header-controls {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .notes-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .notes-search-input {
            flex: 1;
            width: unset !important;
          }
          .notes-gallery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
