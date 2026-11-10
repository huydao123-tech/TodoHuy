"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  dashboardApi,
  getCurrentUser,
  noteApi,
  resourceApi,
  sideTaskApi,
  workItemApi,
  type NoteData,
  type ResourceApiData,
} from "@/lib/api";
import { formatWeekDateStr, getMonday } from "@/lib/mockData";
import {
  cycleStatus,
  moodFor,
  noteTag,
  shiftWeek,
  speciesForGroup,
  speciesLabel,
  visibleGroups,
  weekCounts,
  weekLabel,
  weekWorks,
  type GardenGroup,
  type GardenWork,
  type WorkStatus,
} from "@/lib/garden/model";
import type { GardenScene, ScenePick, SceneRoom } from "./GardenScene";
import "./garden.css";

const STATUS_LABEL: Record<WorkStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Xong",
};

interface SideItem {
  id: string;
  name: string;
  isDone: boolean;
}

function buildPreview(week: string) {
  const groups: GardenGroup[] = [
    { id: "jp", name: "Tiếng nhật", color: "#16A34A", displayOrder: 1, isArchived: false },
    { id: "nest", name: "thiết kế nghiệp vụ kiến nest", color: "#7C3AED", displayOrder: 2, isArchived: false },
    { id: "fpt", name: "FPT", color: "#0D9488", displayOrder: 3, isArchived: false },
    { id: "fight", name: "học cách chiến đấu", color: "#7C3AED", displayOrder: 4, isArchived: false },
    { id: "drive", name: "Học bằng lái xe", color: "#2563EB", displayOrder: 5, isArchived: false },
    { id: "en", name: "Tiếng Anh", color: "#16A34A", displayOrder: 6, isArchived: false },
    { id: "cook", name: "học nấu ăn", color: "#16A34A", displayOrder: 7, isArchived: false },
    { id: "chess", name: "cờ vua", color: "#DC2626", displayOrder: 9, isArchived: false },
    { id: "fun", name: "Thú vui", color: "#2563EB", displayOrder: 10, isArchived: false },
    { id: "uni", name: "Nghiên cứu đh nhật", color: "#D97706", displayOrder: 11, isArchived: false },
    { id: "page", name: "Page MBTI", color: "#16A34A", displayOrder: 12, isArchived: true },
  ];
  const row = (
    id: string,
    taskGroupId: string,
    content: string,
    status: WorkStatus
  ): GardenWork => ({ id, taskGroupId, weekStartDate: week, content, status, note: "" });
  return {
    groups,
    works: [
      row("w1", "jp", "Học hết bài từ vựng", "IN_PROGRESS"),
      row("w2", "jp", "10 chữ kanji mới", "TODO"),
      row("w3", "nest", "Viết nốt usecase trong spec", "IN_PROGRESS"),
      row("w4", "fpt", "Học một buổi Coursera", "IN_PROGRESS"),
      row("w5", "fight", "Ra sân tập", "IN_PROGRESS"),
      row("w6", "fight", "Chạy bộ", "TODO"),
      row("w7", "drive", "Ôn một đề lý thuyết", "TODO"),
      row("w8", "en", "Nói chuyện 30 phút", "IN_PROGRESS"),
      row("w9", "cook", "Nấu một bữa tối", "TODO"),
      row("w10", "fun", "Xem một tập phim", "TODO"),
      row("w11", "uni", "Đọc trang tuyển sinh", "IN_PROGRESS"),
      row("w12", "page", "Đăng một video", "IN_PROGRESS"),
    ],
    sides: [
      { id: "s1", name: "Mua bóng đèn bàn", isDone: false },
      { id: "s2", name: "Sửa dây tai nghe", isDone: false },
    ] satisfies SideItem[],
    notes: [
      {
        id: "n1",
        title: "Bài học cờ",
        content: "Mỗi nước đi, đọc ô nó bảo vệ.",
        color: "stone:Học tập:📝",
        updatedAt: new Date().toISOString(),
      },
      {
        id: "n2",
        title: "Việc tuần này",
        content: "Một việc đang làm cho mỗi đầu việc là đủ.",
        color: "stone:Ý tưởng:📝",
        updatedAt: new Date().toISOString(),
      },
    ] satisfies NoteData[],
    resources: [
      {
        id: "r1",
        taskGroupId: "jp",
        title: "Giáo trình",
        link: "https://example.com",
        description: "",
      },
    ] satisfies ResourceApiData[],
  };
}

export default function GardenApp() {
  const preview = useSearchParams().get("preview") === "1";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GardenScene | null>(null);
  const roomsRef = useRef<SceneRoom[]>([]);
  const sidesRef = useRef<SideItem[]>([]);
  const [week, setWeek] = useState<string | null>(null);
  const [groups, setGroups] = useState<GardenGroup[]>([]);
  const [works, setWorks] = useState<GardenWork[]>([]);
  const [sides, setSides] = useState<SideItem[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [resources, setResources] = useState<ResourceApiData[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [webgl, setWebgl] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<"room" | "notes" | "side" | null>(null);
  const [sideId, setSideId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [draft, setDraft] = useState("");
  const [hover, setHover] = useState<ScenePick | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setError("");
      if (preview) {
        const monday = formatWeekDateStr(getMonday());
        const chosen = week ?? monday;
        const bundle = buildPreview(chosen);
        if (cancel) return;
        setGroups(bundle.groups);
        setWorks(bundle.works);
        setSides(bundle.sides);
        setNotes(bundle.notes);
        setResources(bundle.resources);
        if (!week) setWeek(chosen);
        setReady(true);
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        window.location.replace("/login?next=/garden");
        return;
      }
      try {
        const [dash, noteList, resourceList] = await Promise.all([
          dashboardApi.getDashboard(week ?? undefined),
          noteApi.getAll(),
          resourceApi.getAll(),
        ]);
        if (cancel) return;
        setGroups(dash.taskGroups);
        setWorks(dash.workItems);
        setSides(dash.sideTasks);
        setNotes(noteList);
        setResources(resourceList);
        if (!week) setWeek(dash.currentWeekStart);
        setReady(true);
      } catch (err) {
        if (!cancel) setError(err instanceof Error ? err.message : "Không tải được việc.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [preview, week]);

  const shown = useMemo(
    () => (week ? visibleGroups(groups, works, week) : []),
    [groups, works, week]
  );
  const rooms: SceneRoom[] = useMemo(
    () =>
      shown.map((group) => {
        const items = week ? weekWorks(works, week, group.id) : [];
        return {
          id: group.id,
          name: group.name,
          color: group.color,
          species: speciesForGroup(group.name),
          archived: group.isArchived,
          mood: moodFor(items),
          done: items.filter((item) => item.status === "DONE").length,
          total: items.length,
        };
      }),
    [shown, works, week]
  );
  const roomKey = rooms.map((room) => `${room.id}:${room.mood}:${room.name}:${room.archived}`).join("|");
  const sideKey = sides.map((side) => side.id).join("|");
  roomsRef.current = rooms;
  sidesRef.current = sides;
  const counts = week ? weekCounts(works, week) : { todo: 0, doing: 0, done: 0, total: 0 };
  const current = rooms.find((room) => room.id === selected) ?? null;
  const tasks = week && selected ? weekWorks(works, week, selected) : [];
  const roomResources = resources.filter((item) => item.taskGroupId === selected);
  const currentSide = sides.find((side) => side.id === sideId) ?? null;

  useEffect(() => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    setNoteTitle(note.title);
    setNoteBody(note.content);
  }, [noteId, notes]);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let scene: GardenScene | null = null;
    let dead = false;
    (async () => {
      try {
        const mod = await import("./GardenScene");
        if (dead) return;
        scene = new mod.GardenScene(canvas);
        if (dead) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        scene.setHandlers(
          (pick) => {
            setHover(null);
            if (pick.kind === "notes") {
              setPanel("notes");
              setSelected(null);
              return;
            }
            if (pick.kind === "side" && pick.id) {
              setPanel("side");
              setSideId(pick.id);
              return;
            }
            if (pick.kind === "room" && pick.id) {
              setPanel("room");
              setSelected(pick.id);
              scene?.focus(pick.id);
            }
          },
          (pick) => setHover(pick)
        );
        scene.setRooms(roomsRef.current);
        scene.setSides(sidesRef.current);
        if (preview) {
          (window as unknown as { __garden?: GardenScene }).__garden = scene;
        }
        setWebgl(true);
      } catch {
        if (!dead) setWebgl(false);
      }
    })();
    const onResize = () => sceneRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      dead = true;
      window.removeEventListener("resize", onResize);
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
    };
    // Scene is created once. Later room updates go through the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    sceneRef.current?.setRooms(rooms);
  }, [roomKey, rooms]);

  useEffect(() => {
    sceneRef.current?.setSides(sides);
  }, [sideKey, sides]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        setPanel(null);
        setSelected(null);
        sceneRef.current?.focus(null);
      }
      if (event.key >= "1" && event.key <= "9") {
        const room = rooms[Number(event.key) - 1];
        if (!room) return;
        setPanel("room");
        setSelected(room.id);
        sceneRef.current?.focus(room.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rooms]);

  async function changeStatus(item: GardenWork) {
    const next = cycleStatus(item.status);
    const previous = item.status;
    setWorks((list) => list.map((work) => (work.id === item.id ? { ...work, status: next } : work)));
    if (preview) return;
    try {
      await workItemApi.update(item.id, { status: next });
    } catch {
      setWorks((list) => list.map((work) => (work.id === item.id ? { ...work, status: previous } : work)));
      setError("Không lưu được trạng thái.");
    }
  }

  async function addTask(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !selected || !week) return;
    setDraft("");
    if (preview) {
      setWorks((list) => [
        ...list,
        { id: `local-${Date.now()}`, taskGroupId: selected, weekStartDate: week, content, status: "TODO", note: "" },
      ]);
      return;
    }
    try {
      const created = await workItemApi.create(selected, week, content);
      setWorks((list) => [...list, created]);
    } catch {
      setDraft(content);
      setError("Không thêm được việc.");
    }
  }

  async function finishSide(id: string) {
    if (!preview) {
      try {
        await sideTaskApi.completeAndRemove(id);
      } catch {
        setError("Không gỡ được việc phụ.");
        return;
      }
    }
    setSides((list) => list.filter((side) => side.id !== id));
    setPanel(null);
    setSideId(null);
  }

  async function saveNote() {
    if (!noteId) return;
    if (preview) {
      setNotes((list) =>
        list.map((note) => (note.id === noteId ? { ...note, title: noteTitle, content: noteBody } : note))
      );
      return;
    }
    try {
      const saved = await noteApi.update(noteId, { title: noteTitle, content: noteBody });
      setNotes((list) => list.map((note) => (note.id === noteId ? saved : note)));
    } catch {
      setError("Không lưu được ghi chú.");
    }
  }

  function openRoom(id: string) {
    setPanel("room");
    setSelected(id);
    sceneRef.current?.focus(id);
  }

  const hoverName =
    hover?.kind === "room"
      ? rooms.find((room) => room.id === hover.id)?.name
      : hover?.kind === "notes"
        ? "Sổ tay"
        : hover?.kind === "side"
          ? sides.find((side) => side.id === hover.id)?.name
          : null;

  return (
    <div className="garden">
      <canvas ref={canvasRef} aria-label="Khu vườn các đầu việc trong tuần" />
      {!ready && !error && <div className="garden-loading">Đang mở vườn…</div>}
      {webgl === false && (
        <div className="garden-fallback" aria-label="Danh sách đầu việc">
          {rooms.map((room) => (
            <button key={room.id} type="button" onClick={() => openRoom(room.id)}>
              <strong>{room.name}</strong>
              <span>
                {" "}
                · {speciesLabel(room.species)} · {room.done}/{room.total}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="garden-top">
        <div className="garden-week">
          <button
            className="garden-icon"
            type="button"
            aria-label="Tuần trước"
            onClick={() => week && setWeek(shiftWeek(week, -1))}
          >
            ‹
          </button>
          <strong>{week ? weekLabel(week) : "…"}</strong>
          <button
            className="garden-icon"
            type="button"
            aria-label="Tuần sau"
            onClick={() => week && setWeek(shiftWeek(week, 1))}
          >
            ›
          </button>
        </div>
        <span className="garden-chip">
          <em>{counts.doing} đang làm</em>
          <span>{counts.todo} chưa</span>
          <span className="done">{counts.done} xong</span>
        </span>
        <Link className="garden-chip" href="/dashboard">
          Bảng tuần
        </Link>
      </div>

      <div className="garden-dock">
        {preview && <p className="garden-banner">Bản xem thử. Đăng nhập để thấy việc thật trong Firestore.</p>}
        {error && <p className="garden-error">{error}</p>}
        <div className="garden-dots" aria-label="Các căn trong vườn">
          {rooms.map((room, index) => (
            <button
              key={room.id}
              type="button"
              aria-label={`${index + 1}. ${room.name}`}
              aria-pressed={selected === room.id}
              title={room.name}
              style={{ background: room.color }}
              onClick={() => openRoom(room.id)}
            />
          ))}
        </div>
        <p className="garden-hint">
          Kéo để xoay, cuộn để lại gần. Bấm con vật để mở việc tuần. Chim trên hàng rào là việc phụ. Quyển sổ bên trái là ghi chú. Phím 1–9, Esc.
        </p>
      </div>

      {hover && hoverName && (
        <div className="garden-tip" style={{ left: hover.x, top: hover.y }}>
          {hoverName}
        </div>
      )}

      {panel && (
        <aside className="garden-panel" aria-label="Chi tiết">
          <button className="garden-text-btn quiet" type="button" onClick={() => setPanel(null)}>
            Đóng
          </button>
          {panel === "room" && current && (
            <>
              <p className="garden-kicker">
                {speciesLabel(current.species)}
                {current.archived ? " · đang cất" : ""}
              </p>
              <h2>{current.name}</h2>
              <p className="garden-sub">
                {current.mood === "work"
                  ? "Đang đi lại, vì tuần này còn việc dở."
                  : current.mood === "wait"
                    ? "Đang ngồi chờ, vì chưa việc nào được bắt đầu."
                    : "Đang ngủ. Tuần này trống hoặc đã xong."}
              </p>
              {tasks.length === 0 && <p className="garden-sub">Chưa có việc trong tuần này.</p>}
              {tasks.map((task) => (
                <button key={task.id} className="garden-task" type="button" onClick={() => changeStatus(task)}>
                  <span className={`garden-status ${task.status === "IN_PROGRESS" ? "doing" : task.status === "DONE" ? "done" : ""}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                  <span>
                    <p>{task.content}</p>
                    {task.note ? <small>{task.note}</small> : null}
                  </span>
                </button>
              ))}
              <form className="garden-add" onSubmit={addTask}>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Thêm việc trong tuần"
                  aria-label="Thêm việc trong tuần"
                />
                <button type="submit">Thêm</button>
              </form>
              {roomResources.length > 0 && (
                <div className="garden-links">
                  {roomResources.map((item) =>
                    /^https?:\/\//.test(item.link) ? (
                      <a key={item.id} href={item.link} target="_blank" rel="noreferrer">
                        {item.title}
                      </a>
                    ) : (
                      <span key={item.id}>{item.title}</span>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {panel === "notes" && (
            <>
              <p className="garden-kicker">Sổ tay</p>
              <h2>Ghi chú</h2>
              {notes.map((note) => (
                <button
                  key={note.id}
                  className="garden-note"
                  type="button"
                  onClick={() => setNoteId(note.id)}
                  aria-pressed={noteId === note.id}
                >
                  <p>{note.title || "Không tiêu đề"}</p>
                  <small>{noteTag(note.color)}</small>
                </button>
              ))}
              {noteId && (
                <form
                  className="garden-note-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveNote();
                  }}
                >
                  <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} aria-label="Tiêu đề ghi chú" />
                  <textarea rows={8} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} aria-label="Nội dung ghi chú" />
                  <button type="submit">Lưu ghi chú</button>
                </form>
              )}
            </>
          )}

          {panel === "side" && currentSide && (
            <>
              <p className="garden-kicker">Việc phụ</p>
              <h2>{currentSide.name}</h2>
              <p className="garden-sub">Xong thì gỡ khỏi hàng rào. Việc phụ đã xong không giữ lại trong danh sách.</p>
              <button className="garden-text-btn" type="button" onClick={() => finishSide(currentSide.id)}>
                Xong, gỡ khỏi danh sách
              </button>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
