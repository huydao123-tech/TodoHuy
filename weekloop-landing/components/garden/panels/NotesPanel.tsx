"use client";

import { useState } from "react";
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
      <p className="garden-kicker">Sổ tay</p>
      <h2>Ghi chú</h2>
      <div className="garden-add">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ghi chú" aria-label="Tìm ghi chú" />
        <button type="button" onClick={onCreate}>
          Viết mới
        </button>
      </div>
      <div className="garden-filter" aria-label="Lọc theo loại">
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
        <p className="garden-empty">{notes.length === 0 ? "Sổ tay còn trống." : "Không có ghi chú nào khớp."}</p>
      )}
      {shown.map((note) => {
        const meta = parseNoteColor(note.color);
        return (
          <button key={note.id} className="garden-note" type="button" onClick={() => onOpen(note.id)}>
            <p>
              {meta.icon} {note.title || "Không tiêu đề"}
            </p>
            {note.content ? <small className="clamp">{note.content}</small> : null}
            <small className="tag">{meta.category}</small>
          </button>
        );
      })}
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
      className="garden-edit bare"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ title, content, color: withNoteCategory(note.color, category) });
      }}
    >
      <button type="button" className="garden-link-btn" onClick={onBack}>
        ‹ Tất cả ghi chú
      </button>
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề" aria-label="Tiêu đề ghi chú" />
      <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Loại ghi chú">
        {NOTE_CATEGORIES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <textarea
        rows={12}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Viết ở đây…"
        aria-label="Nội dung ghi chú"
      />
      <div className="garden-actions">
        <button type="submit" className="garden-text-btn" disabled={!dirty}>
          {dirty ? "Lưu ghi chú" : "Đã lưu"}
        </button>
        <span className="spacer" />
        <button type="button" className="garden-link-btn danger" onClick={onDelete}>
          Xoá ghi chú
        </button>
      </div>
    </form>
  );
}
