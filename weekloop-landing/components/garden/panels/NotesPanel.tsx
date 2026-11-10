"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash } from "@phosphor-icons/react";
import type { NoteData } from "@/lib/api";
import { NOTE_CATEGORIES, filterNotes, parseNoteColor, withNoteCategory } from "@/lib/garden/model";

interface Props {
  notes: NoteData[];
  openId: string | null;
  onOpen: (id: string | null) => void;
  onCreate: () => void;
  onSave: (note: NoteData, changes: { title: string; content: string; color: string }) => void;
  onDelete: (note: NoteData) => void;
}

export default function NotesPanel({ notes, openId, onOpen, onCreate, onSave, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const open = notes.find((note) => note.id === openId) ?? null;

  if (open) {
    return (
      <NoteEditor
        key={open.id}
        note={open}
        onBack={() => onOpen(null)}
        onSave={(changes) => onSave(open, changes)}
        onDelete={() => onDelete(open)}
      />
    );
  }

  const shown = filterNotes(notes, query, category);
  return (
    <>
      <h2 className="g-title">Ghi chú</h2>
      <div className="g-add">
        <input className="g-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong ghi chú" aria-label="Tìm trong ghi chú" />
        <button type="button" className="g-btn form primary" onClick={onCreate}>
          <Plus size={16} aria-hidden />
          Viết mới
        </button>
      </div>
      <div className="g-chips" aria-label="Lọc theo loại">
        <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
          Tất cả
        </button>
        {NOTE_CATEGORIES.map((name) => (
          <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="g-empty">
          {notes.length === 0 ? "Chưa có ghi chú nào. Bấm Viết mới để bắt đầu." : "Không có ghi chú nào khớp với bộ lọc."}
        </p>
      )}
      <ul className="g-list">
        {shown.map((note) => {
          const meta = parseNoteColor(note.color);
          return (
            <li key={note.id} className="g-row">
              <button className="g-row-main" type="button" onClick={() => onOpen(note.id)}>
                <span className="g-row-title">
                  {meta.icon} {note.title || "Không tiêu đề"}
                </span>
                <span className="g-row-meta clamp">{[meta.category, note.content].filter(Boolean).join(" · ")}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function NoteEditor({
  note,
  onBack,
  onSave,
  onDelete,
}: {
  note: NoteData;
  onBack: () => void;
  onSave: (changes: { title: string; content: string; color: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(parseNoteColor(note.color).category);
  const dirty =
    title !== note.title || content !== note.content || category !== parseNoteColor(note.color).category;

  return (
    <form
      className="g-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title, content, color: withNoteCategory(note.color, category) });
      }}
    >
      <button type="button" className="g-btn ghost g-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden />
        Tất cả ghi chú
      </button>
      <label className="g-field">
        <span>Tiêu đề</span>
        <input className="g-input" value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="g-field">
        <span>Loại</span>
        <select className="g-input" value={category} onChange={(event) => setCategory(event.target.value)}>
          {NOTE_CATEGORIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="g-field">
        <span>Nội dung</span>
        <textarea className="g-input" rows={12} value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
      <div className="g-actions split">
        <button type="submit" className="g-btn form primary" disabled={!dirty}>
          Lưu
        </button>
        <span className="g-saved" aria-live="polite">
          {dirty ? "Có thay đổi chưa lưu" : "Đã lưu"}
        </span>
        <button type="button" className="g-btn danger" onClick={onDelete}>
          <Trash size={16} aria-hidden />
          Xoá
        </button>
      </div>
    </form>
  );
}
