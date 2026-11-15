"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CaretDown, CodeBlock, FolderSimple, FrameCorners, Highlighter, LinkSimple, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import {
  brainApi,
  type BrainModuleData,
  type BrainNoteData,
  type BrainTopicData,
} from "@/lib/api";
import { emptyNoteDoc, entryPlainText, formatEntryDate, linkHref, textMatches, todayIso, type BrainEntry } from "@/lib/brain";
import { useLanguage } from "@/lib/languageContext";
import { EntryEditor, noteColor, type NoteColor } from "./NoteEntryEditor";

function listDate(note: BrainNoteData): string {
  const iso = [...note.entries].sort((a, b) => b.date.localeCompare(a.date))[0]?.date || note.updatedAt.slice(0, 10);
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function clockLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function BrainNotes() {
  const { isVietnamese } = useLanguage();
  const [modules, setModules] = useState<BrainModuleData[]>([]);
  const [topics, setTopics] = useState<BrainTopicData[]>([]);
  const [notes, setNotes] = useState<BrainNoteData[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"library" | "list" | "editor">("library");

  useEffect(() => {
    let stop = () => {};
    let cancelled = false;
    brainApi.subscribe((data) => {
      if (cancelled) return;
      setModules(data.modules);
      setTopics(data.topics);
      setNotes(data.notes);
      setReady(true);
    }, () => {
      if (!cancelled) {
        setReady(true);
        setError(isVietnamese ? "Không tải được ghi chú." : "Could not load notes.");
      }
    }).then((unsubscribe) => {
      if (cancelled) unsubscribe();
      else stop = unsubscribe;
    }).catch(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [isVietnamese]);

  const filteredNotes = useMemo(
    () => notes.filter((note) => textMatches(query, note.title, ...note.entries.map((entry) => entryPlainText(entry.content)))),
    [notes, query],
  );
  const topicNotes = filteredNotes.filter((note) => note.topicId === topicId);
  const activeTopic = topics.find((topic) => topic.id === topicId) ?? null;
  const activeModule = modules.find((module) => module.id === activeTopic?.moduleId) ?? null;
  const activeBrain = notes.find((note) => note.id === selectedNoteId) ?? null;

  const openTopic = (id: string) => {
    setTopicId(id);
    setSelectedNoteId(null);
    setMobilePane("list");
  };

  const addModule = async () => {
    const name = window.prompt(isVietnamese ? "Tên module" : "Module name");
    if (!name?.trim()) return;
    const position = Math.max(0, ...modules.map((module) => module.position)) + 1;
    await brainApi.createModule(name.trim(), position);
  };

  const addTopic = async (moduleId: string) => {
    const name = window.prompt(isVietnamese ? "Tên chủ đề" : "Topic name");
    if (!name?.trim()) return;
    const siblings = topics.filter((topic) => topic.moduleId === moduleId);
    const position = Math.max(0, ...siblings.map((topic) => topic.position)) + 1;
    const id = await brainApi.createTopic(moduleId, name.trim(), position);
    openTopic(id);
  };

  const addNote = async () => {
    if (!activeTopic) return;
    const id = await brainApi.createNote(activeTopic.moduleId, activeTopic.id, "");
    setSelectedNoteId(id);
    setMobilePane("editor");
  };

  return (
    <div className="brain">
      <aside className={`brain-pane ${mobilePane === "library" ? "is-active" : ""}`}>
        <label className="brain-search">
          <MagnifyingGlass size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isVietnamese ? "Tìm ghi chú" : "Search notes"}
            aria-label={isVietnamese ? "Tìm ghi chú" : "Search notes"}
          />
        </label>
        <button type="button" className="brain-add" onClick={() => void addModule()}>
          <Plus size={14} weight="bold" />
          {isVietnamese ? "Tạo module" : "New module"}
        </button>
        {!ready ? <p className="brain-muted">{isVietnamese ? "Đang tải..." : "Loading..."}</p> : null}
        {error ? <p className="brain-error">{error}</p> : null}
        <div className="brain-scroll">
          {modules.map((module) => (
            <section key={module.id} className="brain-module">
              <header>
                <FolderSimple size={15} />
                <span>{module.name}</span>
                <button type="button" onClick={() => void addTopic(module.id)} aria-label={isVietnamese ? "Thêm chủ đề" : "Add topic"}>+</button>
                <button
                  type="button"
                  aria-label={isVietnamese ? "Xóa module" : "Delete module"}
                  onClick={() => {
                    if (window.confirm(isVietnamese ? `Xóa module "${module.name}" và toàn bộ ghi chú bên trong?` : `Delete "${module.name}" and its notes?`)) {
                      void brainApi.deleteModule(module.id);
                    }
                  }}
                >
                  <Trash size={13} />
                </button>
              </header>
              {topics.filter((topic) => topic.moduleId === module.id).map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className={topic.id === topicId ? "is-on" : ""}
                  onClick={() => openTopic(topic.id)}
                >
                  {topic.name}
                  <em>{notes.filter((note) => note.topicId === topic.id).length}</em>
                </button>
              ))}
            </section>
          ))}
        </div>
      </aside>

      <section className={`brain-pane brain-list ${mobilePane === "list" ? "is-active" : ""}`}>
        <header>
          <button type="button" className="brain-back" onClick={() => setMobilePane("library")}>←</button>
          <div>
            <strong>{activeTopic?.name || (isVietnamese ? "Chọn một chủ đề" : "Choose a topic")}</strong>
            {activeModule ? <span>{activeModule.name}</span> : null}
          </div>
          {activeTopic ? (
            <button type="button" className="brain-add" onClick={() => void addNote()}>
              <Plus size={14} weight="bold" />
              {isVietnamese ? "Ghi chú" : "Note"}
            </button>
          ) : null}
        </header>
        <div className="brain-scroll">
          {topicNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className={selectedNoteId === note.id ? "brain-row is-on" : "brain-row"}
              onClick={() => {
                setSelectedNoteId(note.id);
                setMobilePane("editor");
              }}
            >
              <span className="brain-row-top">
                <b>{note.title || (isVietnamese ? "Chưa đặt tên" : "Untitled")}</b>
                <time>{listDate(note)}</time>
              </span>
              <span>{note.entries.map((entry) => entryPlainText(entry.content)).join(" ").replace(/\s+/g, " ").slice(0, 90)}</span>
            </button>
          ))}
          {activeTopic && topicNotes.length === 0 ? (
            <p className="brain-muted">{isVietnamese ? "Chủ đề này chưa có ghi chú." : "This topic has no notes."}</p>
          ) : null}
        </div>
      </section>

      <section className={`brain-pane brain-editor ${mobilePane === "editor" ? "is-active" : ""}`}>
        {activeBrain ? (
          <NoteEditor
            key={activeBrain.id}
            title={activeBrain.title}
            entries={activeBrain.entries}
            crumb={[activeModule?.name, activeTopic?.name].filter(Boolean).join(" / ")}
            savedAt={activeBrain.updatedAt}
            backLabel={activeTopic?.name || ""}
            onBack={() => setMobilePane("list")}
            onSave={(title, entries) => brainApi.updateNote(activeBrain.id, title, entries)}
            onDelete={async () => {
              await brainApi.deleteNote(activeBrain.id);
              setSelectedNoteId(null);
              setMobilePane("list");
            }}
          />
        ) : (
          <div className="brain-empty">
            <h2>{isVietnamese ? "Bộ não" : "Second brain"}</h2>
            <p>
              {isVietnamese
                ? "Module chứa các chủ đề. Ghi chú nằm trong chủ đề, tách khỏi sổ ghi chú ở tab Ghi chú."
                : "Modules hold topics. Notes live inside a topic, separate from the Notes tab."}
            </p>
          </div>
        )}
      </section>

      <style>{`
        .brain { display: grid; grid-template-columns: 16rem 20rem minmax(0, 1fr); width: 100%; height: 100%; min-height: 0; background: var(--bg); color: var(--text); }
        .brain-pane { min-height: 0; min-width: 0; display: flex; flex-direction: column; background: var(--card-bg); border-right: 1px solid var(--border-mid); }
        .brain-editor { border-right: none; background: var(--bg); }
        .brain-scroll { overflow: auto; padding: 0.35rem 0.75rem 1rem; }
        .brain-search, .brain-add, .brain-outline, .brain-module button, .brain-row { font: inherit; color: var(--text); }
        .brain-search { display: flex; align-items: center; gap: 0.5rem; height: 2.5rem; margin: 0.75rem; padding: 0 0.75rem; border: 1px solid var(--border-mid); border-radius: 12px; background: var(--card-bg); color: var(--text-muted); }
        .brain-search input { border: none; outline: none; width: 100%; background: transparent; color: var(--text); font: inherit; font-size: 0.875rem; }
        .brain-add, .brain-outline { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; height: 2.25rem; margin: 0; border-radius: 10px; padding: 0 0.75rem; font-size: 0.875rem; font-weight: 560; cursor: pointer; }
        .brain-pane > .brain-add { margin: 0.25rem 0.75rem 0.5rem; align-self: flex-start; background: transparent; color: var(--text-muted); }
        .brain-list header .brain-add { background: var(--accent); color: #fff; }
        .brain-add { border: none; background: var(--accent); color: #fff; }
        .brain-outline { border: 1px solid var(--border-mid); background: var(--card-bg); color: var(--text); }
        .brain-module header, .brain-list header { display: flex; align-items: center; gap: 0.5rem; }
        .brain-module header { height: 2.5rem; padding: 0 0.75rem; color: var(--text-muted); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
        .brain-module header span, .brain-list header div { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .brain-module header button, .brain-back, .brain-delete { border: none; background: none; color: var(--text-muted); cursor: pointer; }
        .brain-delete { color: #b91c1c; }
        .brain-module > button, .brain-row { display: flex; width: 100%; text-align: left; border: none; background: none; border-radius: 12px; cursor: pointer; }
        .brain-module > button { align-items: center; justify-content: space-between; gap: 0.5rem; height: 2.5rem; padding: 0 0.75rem; font-size: 0.875rem; color: var(--text); }
        .brain-module > button em { font-style: normal; color: var(--text-muted); font-size: 0.75rem; font-variant-numeric: tabular-nums; }
        .brain-module > button.is-on, .brain-row.is-on { background: var(--bg-alt); color: var(--text); font-weight: 560; }
        .brain-list header { justify-content: space-between; height: 4rem; padding: 0 1rem; border-bottom: 1px solid var(--border); }
        .brain-list header strong { display: block; font-size: 1rem; }
        .brain-list header span, .brain-muted { color: var(--text-muted); font-size: 0.75rem; }
        .brain-row { flex-direction: column; align-items: stretch; gap: 0.25rem; padding: 0.625rem 0.75rem; }
        .brain-row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.75rem; }
        .brain-row b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.875rem; font-weight: 560; }
        .brain-row time, .brain-row span { color: var(--text-muted); font-size: 0.75rem; }
        .brain-row time { flex: none; font-variant-numeric: tabular-nums; }
        .brain-row span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .brain-empty { padding: 2rem 1.25rem; max-width: 46rem; }
        .brain-empty h2 { margin: 0 0 0.4rem; font-size: 1.25rem; }
        .brain-empty p, .brain-error { color: var(--text-muted); line-height: 1.5; }
        .brain-error { color: #b91c1c; padding: 0 0.75rem; }
        .brain-back { display: none; }
        .brain-editor form { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        .brain-title-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.35rem 1.5rem 0.75rem; }
        .brain-editor input { width: 100%; border: none; background: transparent; color: var(--text); font: inherit; outline: none; font-size: 1.5rem; font-weight: 650; letter-spacing: -0.03em; }
        .brain-title-row .brain-outline { margin-top: 0.35rem; flex: none; }
        .brain-tools { display: flex; align-items: center; gap: 0.2rem; flex-wrap: wrap; margin: 0 1.5rem; padding: 0.35rem 0.35rem; border: 1px solid var(--border-mid); border-bottom: none; border-radius: 16px 16px 0 0; background: var(--card-bg); position: sticky; top: 0; z-index: 2; }
        .brain-tools > button, .brain-menu > button { display: inline-flex; align-items: center; gap: 0.35rem; border: none; background: none; color: var(--text-muted); font: inherit; font-size: 0.82rem; font-weight: 600; border-radius: var(--radius); padding: 0.35rem 0.5rem; cursor: pointer; }
        .brain-tools > button:hover, .brain-menu > button:hover, .brain-menu > button[aria-expanded="true"] { background: var(--bg-alt); color: var(--text); }
        .brain-tools > button:disabled { opacity: 0.45; cursor: default; }
        .brain-tool-gap { width: 1px; height: 1.1rem; background: var(--border-mid); margin: 0 0.25rem; }
        .brain-menu { position: relative; }
        .brain-pop { position: absolute; top: calc(100% + 4px); left: 0; z-index: 5; display: grid; gap: 0.25rem; min-width: 11rem; padding: 0.45rem; border: 1px solid var(--border); border-radius: 12px; background: var(--card-bg); box-shadow: 0 10px 24px rgb(0 0 0 / 0.08); }
        .brain-swatches { display: flex; gap: 0.25rem; }
        .brain-swatches button, .brain-pop > button { border: none; background: none; cursor: pointer; font: inherit; }
        .brain-swatches button { width: 2.1rem; height: 2.1rem; border-radius: 10px; }
        .brain-swatches button:hover, .brain-pop > button:hover { background: var(--bg-alt); }
        .brain-swatches i { display: block; width: 1.35rem; height: 1.35rem; margin: auto; border-radius: 6px; }
        .brain-pop > button { text-align: left; padding: 0.35rem 0.45rem; border-radius: 8px; color: var(--text); font-size: 0.82rem; }
        .brain-link { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--border); background: var(--card-bg); }
        .brain-link input { flex: 1; min-width: 12rem; border: 1px solid var(--border-mid); border-radius: var(--radius); background: var(--input-bg); color: var(--text); font: inherit; font-size: 0.875rem; font-weight: 450; letter-spacing: 0; padding: 0.4rem 0.6rem; }
        .brain-link button { border: 1px solid var(--border-mid); background: var(--card-bg); color: var(--text); border-radius: var(--radius); font: inherit; font-size: 0.8rem; padding: 0.35rem 0.6rem; cursor: pointer; }
        .brain-link .is-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
        .brain-link-error { width: 100%; margin: 0; color: #b91c1c; font-size: 0.78rem; }
        .brain-entries { overflow: auto; padding: 0 1.5rem 2rem; display: grid; gap: 0; }
        .brain-entry { background: var(--card-bg); border: 1px solid var(--border-mid); border-top: none; padding: 1.15rem 1.25rem 1.35rem; }
        .brain-entry:last-child { border-radius: 0 0 16px 16px; }
        .brain-entry h3 { margin: 0 0 0.35rem; font-size: 1rem; font-weight: 650; }
        .note-body { font-size: 1rem; line-height: 1.75rem; color: var(--text); outline: none; min-height: 4.5rem; }
        .note-body > * + * { margin-top: 0.75rem; }
        .note-body p, .note-body h1, .note-body h2, .note-body h3, .note-body ul, .note-body ol, .note-body pre { margin: 0; }
        .note-body p { white-space: pre-wrap; }
        .note-body h1, .note-body h2, .note-body h3 { font-weight: 650; }
        .note-body h2 { font-size: 1.125rem; line-height: 1.75rem; }
        .note-body ul { list-style: disc; padding-left: 1.5rem; }
        .note-body ol { list-style: decimal; padding-left: 1.5rem; }
        .note-body li + li { margin-top: 0.25rem; }
        .note-body :not(pre) > code { padding: 0.125rem 0.375rem; border-radius: 0.375rem; background: color-mix(in srgb, var(--text) 7%, transparent); font-size: 0.875em; }
        .note-body pre { overflow-x: auto; padding: 1rem; border: 1px solid var(--border-mid); border-radius: 0.75rem; background: var(--bg); font-size: 0.875rem; line-height: 1.5rem; }
        .note-body pre code { font-family: var(--font-geist-mono), ui-monospace, monospace; }
        .note-body a { color: var(--accent-dark); font-weight: 560; text-decoration: underline; text-underline-offset: 4px; }
        .note-body mark { padding: 0.0625rem 0.125rem; border-radius: 0.25rem; color: inherit; }
        .hl-vang { background: #FEF08A; }
        .hl-la { background: #BBF7D0; }
        .hl-duong { background: #BFDBFE; }
        .hl-hong { background: #FBCFE8; }
        .co { padding: 0.75rem 1rem; border: 1px solid; border-radius: 0.75rem; }
        .co > * + * { margin-top: 0.5rem; }
        .co-vang { background: #FEFCE8; border-color: #FDE047; }
        .co-la { background: #F0FDF4; border-color: #86EFAC; }
        .co-duong { background: #EFF6FF; border-color: #93C5FD; }
        .co-hong { background: #FDF2F8; border-color: #F9A8D4; }
        [data-theme="dark"] .hl-vang { background: rgb(254 240 138 / 0.3); }
        [data-theme="dark"] .hl-la { background: rgb(187 247 208 / 0.24); }
        [data-theme="dark"] .hl-duong { background: rgb(191 219 254 / 0.26); }
        [data-theme="dark"] .hl-hong { background: rgb(251 207 232 / 0.26); }
        [data-theme="dark"] .co-vang { background: rgb(253 224 71 / 0.08); border-color: rgb(253 224 71 / 0.4); }
        [data-theme="dark"] .co-la { background: rgb(134 239 172 / 0.08); border-color: rgb(134 239 172 / 0.4); }
        [data-theme="dark"] .co-duong { background: rgb(147 197 253 / 0.08); border-color: rgb(147 197 253 / 0.4); }
        [data-theme="dark"] .co-hong { background: rgb(249 168 212 / 0.08); border-color: rgb(249 168 212 / 0.4); }
        .brain-editor-bar { display: flex; align-items: center; gap: 0.75rem; min-height: 4rem; padding: 0 1.5rem; color: var(--text-muted); font-size: 0.75rem; }
        .brain-crumb { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .brain-saved { margin-left: auto; flex: none; }
        @media (max-width: 800px) {
          .brain { grid-template-columns: 1fr; }
          .brain-pane { display: none; border-right: none; }
          .brain-pane.is-active { display: flex; }
          .brain-back { display: inline-flex; }
        }
      `}</style>
    </div>
  );
}

const NOTE_COLORS: Array<{ value: NoteColor; label: string }> = [
  { value: "vang", label: "Vàng" },
  { value: "la", label: "Xanh lá" },
  { value: "duong", label: "Xanh dương" },
  { value: "hong", label: "Hồng" },
];

function NoteEditor({
  title,
  entries,
  crumb,
  savedAt,
  backLabel,
  onBack,
  onSave,
  onDelete,
}: {
  title: string;
  entries: BrainEntry[];
  crumb: string;
  savedAt: string;
  backLabel: string;
  onBack: () => void;
  onSave: (title: string, entries: BrainEntry[]) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { isVietnamese } = useLanguage();
  const [draftTitle, setDraftTitle] = useState(title);
  const [drafts, setDrafts] = useState(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)));
  const [status, setStatus] = useState("");
  const savedLabel = savedAt && clockLabel(savedAt) ? (isVietnamese ? `Đã lưu lúc ${clockLabel(savedAt)}` : `Saved ${clockLabel(savedAt)}`) : "";
  const [menu, setMenu] = useState<"highlight" | "callout" | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const [hasEditor, setHasEditor] = useState(false);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const serialized = JSON.stringify(drafts);

  useEffect(() => {
    const original = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    if (draftTitle === title && serialized === JSON.stringify(original)) return;
    const timer = window.setTimeout(() => {
      setStatus(isVietnamese ? "Đang lưu..." : "Saving...");
      saveRef.current(draftTitle, drafts)
        .then(() => {
          const clock = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
          setStatus(isVietnamese ? `Đã lưu lúc ${clock}` : `Saved ${clock}`);
        })
        .catch(() => setStatus(isVietnamese ? "Không lưu được" : "Could not save"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftTitle, serialized, title, entries, drafts, isVietnamese]);

  const openLink = (editor: Editor) => {
    editorRef.current = editor;
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkError("");
    setLinkOpen(true);
    setMenu(null);
  };

  const applyFormat = (run: (editor: Editor) => void) => {
    const editor = editorRef.current;
    if (!editor) return;
    run(editor);
    setMenu(null);
  };

  const addDay = () => {
    const date = todayIso();
    if (drafts.some((entry) => entry.date === date)) return;
    setDrafts((current) => [{ id: crypto.randomUUID(), date, content: emptyNoteDoc() }, ...current]);
  };

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <div className="brain-editor-bar">
        <button type="button" className="brain-back" onClick={onBack}>{backLabel ? `← ${backLabel}` : "←"}</button>
        <span className="brain-crumb">{crumb}</span>
        <span className="brain-saved">{status || savedLabel}</span>
        <button type="button" className="brain-delete" onClick={() => void onDelete()}>{isVietnamese ? "Xóa" : "Delete"}</button>
      </div>
      <div className="brain-title-row">
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          placeholder={isVietnamese ? "Tiêu đề" : "Title"}
          aria-label={isVietnamese ? "Tiêu đề" : "Title"}
        />
        <button type="button" className="brain-outline" onClick={addDay}>
          <Plus size={14} weight="bold" />
          {isVietnamese ? "Thêm ngày" : "Add day"}
        </button>
      </div>
      <div className="brain-tools" role="toolbar" aria-label={isVietnamese ? "Định dạng" : "Format"}>
        <ColorMenu
          label="Highlight"
          icon={<Highlighter size={16} />}
          kind="highlight"
          open={menu === "highlight"}
          onToggle={() => setMenu((current) => current === "highlight" ? null : "highlight")}
          onPick={(color) => applyFormat((editor) => {
            if (color) editor.chain().focus().setHighlight({ color }).run();
            else editor.chain().focus().unsetHighlight().run();
          })}
        />
        <ColorMenu
          label="Khung"
          icon={<FrameCorners size={16} />}
          kind="callout"
          open={menu === "callout"}
          onToggle={() => setMenu((current) => current === "callout" ? null : "callout")}
          onPick={(color) => applyFormat((editor) => {
            if (!color) editor.chain().focus().lift("callout").run();
            else if (editor.isActive("callout")) editor.chain().focus().updateAttributes("callout", { color }).run();
            else editor.chain().focus().wrapIn("callout", { color }).run();
          })}
        />
        <span className="brain-tool-gap" aria-hidden />
        <button
          type="button"
          disabled={!hasEditor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat((editor) => { editor.chain().focus().toggleCodeBlock().run(); })}
        >
          <CodeBlock size={16} /> Code
        </button>
        <button
          type="button"
          disabled={!hasEditor}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => { if (editorRef.current) openLink(editorRef.current); }}
        >
          <LinkSimple size={16} /> Link
        </button>
      </div>
      {linkOpen ? (
        <div className="brain-link">
          <input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://"
            aria-label="Liên kết"
            autoFocus
          />
          {linkError ? <p className="brain-link-error">{linkError}</p> : null}
          <button type="button" onClick={() => applyFormat((editor) => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); setLinkOpen(false); })}>
            {isVietnamese ? "Gỡ link" : "Remove link"}
          </button>
          <button type="button" onClick={() => setLinkOpen(false)}>{isVietnamese ? "Huỷ" : "Cancel"}</button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              const href = linkHref(linkValue);
              if (!href) {
                setLinkError(isVietnamese ? "Nhập liên kết bắt đầu bằng https://, http:// hoặc mailto:." : "Use a link starting with https://, http:// or mailto:.");
                return;
              }
              applyFormat((editor) => { editor.chain().focus().extendMarkRange("link").setLink({ href }).run(); });
              setLinkOpen(false);
            }}
          >
            {isVietnamese ? "Áp dụng" : "Apply"}
          </button>
        </div>
      ) : null}
      <div className="brain-entries">
        {drafts.map((entry, index) => (
          <article key={entry.id} className="brain-entry">
            <h3>{formatEntryDate(entry.date)}</h3>
            <EntryEditor
              content={entry.content}
              claimFocus={index === 0}
              onChange={(json) => setDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, content: json } : item))}
              onFocusEditor={(editor) => { editorRef.current = editor; setHasEditor(true); }}
              onLinkShortcut={openLink}
            />
          </article>
        ))}
      </div>
    </form>
  );
}

function ColorMenu({
  label,
  icon,
  kind,
  open,
  onToggle,
  onPick,
}: {
  label: string;
  icon: ReactNode;
  kind: "highlight" | "callout";
  open: boolean;
  onToggle: () => void;
  onPick: (color: NoteColor | null) => void;
}) {
  return (
    <div className="brain-menu">
      <button type="button" aria-expanded={open} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={onToggle}>
        {icon}
        <span>{label}</span>
        <CaretDown size={12} />
      </button>
      {open ? (
        <div className="brain-pop" role="menu">
          <div className="brain-swatches">
            {NOTE_COLORS.map((color) => (
              <button key={color.value} type="button" role="menuitem" aria-label={color.label} title={color.label} onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(color.value)}>
                <i className={kind === "highlight" ? `hl-${color.value}` : `co co-${noteColor(color.value)}`} />
              </button>
            ))}
          </div>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onPick(null)}>
            {kind === "highlight" ? "Bỏ highlight" : "Bỏ khung"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
