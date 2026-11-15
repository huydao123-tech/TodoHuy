"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FolderSimple, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import {
  brainApi,
  type BrainModuleData,
  type BrainNoteData,
  type BrainTopicData,
} from "@/lib/api";
import { entryPlainText, plainToDoc, textMatches, type BrainEntry } from "@/lib/brain";
import { useLanguage } from "@/lib/languageContext";

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
              <b>{note.title || (isVietnamese ? "Chưa đặt tên" : "Untitled")}</b>
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
        .brain { display: grid; grid-template-columns: 240px 280px minmax(0, 1fr); width: 100%; height: 100%; min-height: 0; background: var(--bg); color: var(--text); }
        .brain-pane { min-height: 0; min-width: 0; display: flex; flex-direction: column; border-right: 1px solid var(--border); }
        .brain-editor { border-right: none; }
        .brain-scroll { overflow: auto; padding: 0.35rem; }
        .brain-search, .brain-add, .brain-module button, .brain-row { font: inherit; color: var(--text); }
        .brain-search { display: flex; align-items: center; gap: 0.4rem; margin: 0.75rem; padding: 0.45rem 0.6rem; border: 1px solid var(--border-mid); border-radius: var(--radius); background: var(--input-bg); color: var(--text-muted); }
        .brain-search input { border: none; outline: none; width: 100%; background: transparent; color: var(--text); font: inherit; font-size: 0.875rem; }
        .brain-add { display: inline-flex; align-items: center; gap: 0.3rem; margin: 0 0.75rem 0.5rem; border: none; background: var(--accent); color: #fff; border-radius: var(--radius-pill); padding: 0.35rem 0.7rem; font-size: 0.8rem; cursor: pointer; }
        .brain-module header, .brain-list header { display: flex; align-items: center; gap: 0.35rem; }
        .brain-module header { padding: 0.45rem 0.45rem 0.15rem; color: var(--text-muted); font-size: 0.78rem; font-weight: 650; }
        .brain-module header span, .brain-list header div { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .brain-module header button, .brain-back { border: none; background: none; color: var(--text-faint); cursor: pointer; }
        .brain-module > button, .brain-row { display: flex; width: 100%; text-align: left; border: none; background: none; border-radius: var(--radius); cursor: pointer; }
        .brain-module > button { justify-content: space-between; gap: 0.5rem; padding: 0.38rem 0.55rem 0.38rem 1.4rem; font-size: 0.84rem; }
        .brain-module > button em { font-style: normal; color: var(--text-faint); font-size: 0.72rem; }
        .brain-module > button.is-on, .brain-row.is-on { background: var(--accent-bg); color: var(--accent-dark); }
        .brain-list header { justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--border); }
        .brain-list header strong, .brain-list header span { display: block; }
        .brain-list header span, .brain-muted { color: var(--text-muted); font-size: 0.75rem; }
        .brain-row { flex-direction: column; gap: 0.15rem; padding: 0.55rem 0.65rem; }
        .brain-row b { font-size: 0.86rem; font-weight: 640; }
        .brain-row span { color: var(--text-muted); font-size: 0.75rem; }
        .brain-empty { padding: 2rem 1.25rem; max-width: 46rem; }
        .brain-empty h2 { margin: 0 0 0.4rem; font-size: 1.25rem; }
        .brain-empty p, .brain-error { color: var(--text-muted); line-height: 1.5; }
        .brain-error { color: #b91c1c; padding: 0 0.75rem; }
        .brain-back { display: none; }
        .brain-editor form { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        .brain-editor input, .brain-editor textarea { width: 100%; border: none; background: transparent; color: var(--text); font: inherit; outline: none; }
        .brain-editor input { font-size: 1.45rem; font-weight: 650; letter-spacing: -0.03em; padding: 1rem 1.1rem 0.3rem; }
        .brain-entries { overflow: auto; padding: 0 1.1rem 1.5rem; display: grid; gap: 0.9rem; }
        .brain-entries label { display: grid; gap: 0.25rem; }
        .brain-entries span { color: var(--text-muted); font-size: 0.75rem; }
        .brain-entries textarea { width: 100%; min-height: 5.5rem; resize: vertical; border: 1px solid var(--border); border-radius: var(--radius); background: var(--input-bg); color: var(--text); font: inherit; line-height: 1.55; padding: 0.55rem 0.7rem; }
        .brain-editor-bar { display: flex; justify-content: space-between; gap: 0.5rem; padding: 0.55rem 0.8rem; color: var(--text-faint); font-size: 0.75rem; }
        .brain-editor-bar button { border: none; background: none; color: #b91c1c; cursor: pointer; font: inherit; }
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

function NoteEditor({
  title,
  entries,
  backLabel,
  onBack,
  onSave,
  onDelete,
}: {
  title: string;
  entries: BrainEntry[];
  backLabel: string;
  onBack: () => void;
  onSave: (title: string, entries: BrainEntry[]) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { isVietnamese } = useLanguage();
  const [draftTitle, setDraftTitle] = useState(title);
  const [drafts, setDrafts] = useState(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => ({
    ...entry,
    text: entryPlainText(entry.content),
  })));
  const [status, setStatus] = useState("");
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const serialized = JSON.stringify(drafts.map((entry) => [entry.id, entry.text]));

  useEffect(() => {
    const unchanged = draftTitle === title && drafts.every((entry) => {
      const original = entries.find((item) => item.id === entry.id);
      return original && entry.text === entryPlainText(original.content);
    });
    if (unchanged) return;
    const timer = window.setTimeout(() => {
      const next = drafts.map((entry) => {
        const original = entries.find((item) => item.id === entry.id);
        const content = original && entry.text === entryPlainText(original.content) ? original.content : plainToDoc(entry.text);
        return { id: entry.id, date: entry.date, content };
      });
      setStatus(isVietnamese ? "Đang lưu..." : "Saving...");
      saveRef.current(draftTitle, next)
        .then(() => setStatus(isVietnamese ? "Đã lưu" : "Saved"))
        .catch(() => setStatus(isVietnamese ? "Không lưu được" : "Could not save"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftTitle, serialized, title, entries, drafts, isVietnamese, saveRef]);

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <div className="brain-editor-bar">
        <button type="button" className="brain-back" onClick={onBack}>{backLabel ? `← ${backLabel}` : "←"}</button>
        <span>{status}</span>
        <button type="button" onClick={() => void onDelete()}>{isVietnamese ? "Xóa" : "Delete"}</button>
      </div>
      <input
        value={draftTitle}
        onChange={(event) => setDraftTitle(event.target.value)}
        placeholder={isVietnamese ? "Tiêu đề" : "Title"}
        aria-label={isVietnamese ? "Tiêu đề" : "Title"}
      />
      <div className="brain-entries">
        {drafts.map((entry) => (
          <label key={entry.id}>
            <span>{entry.date}</span>
            <textarea
              value={entry.text}
              onChange={(event) => setDrafts((current) => current.map((item) => item.id === entry.id ? { ...item, text: event.target.value } : item))}
              aria-label={entry.date}
            />
          </label>
        ))}
      </div>
    </form>
  );
}
