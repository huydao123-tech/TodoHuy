"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Buildings, CaretLeft, CaretRight, FolderSimple, Notebook, PushPin, X } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import {
  dashboardApi,
  getCurrentUser,
  noteApi,
  resourceApi,
  sideTaskApi,
  taskGroupApi,
  workItemApi,
  type NoteData,
  type ResourceApiData,
} from "@/lib/api";
import { formatWeekDateStr, getMonday } from "@/lib/mockData";
import { compareTaskGroups, moveTaskGroup } from "@/lib/taskGroupPriority";
import {
  cycleStatus,
  moodFor,
  staffFor,
  shiftWeek,
  visibleGroups,
  weekCounts,
  weekLabel,
  weekWorks,
  type GardenGroup,
  type GardenWork,
  type WorkStatus,
} from "@/lib/garden/model";
import type { GardenScene, ScenePick, SceneRoom } from "./GardenScene";
import NotesPanel from "./panels/NotesPanel";
import ResourcesPanel, { type ResourceDraft } from "./panels/ResourcesPanel";
import RoomPanel from "./panels/RoomPanel";
import SidePanel, { type SideItem } from "./panels/SidePanel";
import "./garden.css";

/** One panel at a time. The yard is for looking and walking; everything editable lives here. */
type Panel =
  | { kind: "rooms" }
  | { kind: "room"; id: string }
  | { kind: "notes"; noteId: string | null }
  | { kind: "side"; id: string | null }
  | { kind: "resources" };

interface Toast {
  text: string;
  undo?: () => void;
}

const localId = () => `local-${Date.now()}-${Math.round(Math.random() * 1e4)}`;

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
  const [sceneReady, setSceneReady] = useState(false);
  const [week, setWeek] = useState<string | null>(null);
  const [groups, setGroups] = useState<GardenGroup[]>([]);
  const [works, setWorks] = useState<GardenWork[]>([]);
  const [sides, setSides] = useState<SideItem[]>([]);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [resources, setResources] = useState<ResourceApiData[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [webgl, setWebgl] = useState(true);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [hover, setHover] = useState<ScenePick | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [savingPriority, setSavingPriority] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setError("");
      if (preview) {
        const chosen = week ?? formatWeekDateStr(getMonday());
        const bundle = buildPreview(chosen);
        if (cancel) return;
        setGroups(bundle.groups);
        // Preview keeps local edits when the week changes; only the first load seeds data.
        setWorks((list) => (list.length ? list : bundle.works));
        setSides((list) => (list.length ? list : bundle.sides));
        setNotes((list) => (list.length ? list : bundle.notes));
        setResources((list) => (list.length ? list : bundle.resources));
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
          archived: group.isArchived,
          mood: moodFor(items),
          staff: staffFor(items),
          done: items.filter((item) => item.status === "DONE").length,
          total: items.length,
        };
      }),
    [shown, works, week]
  );
  // The scene is rebuilt only when something it draws changes, not on every keystroke.
  const roomKey = rooms.map((room) => `${room.id}:${room.staff.join("")}:${room.name}:${room.archived}:${room.color}`).join("|");
  const sideKey = sides.map((side) => side.id).join("|");
  const counts = week ? weekCounts(works, week) : { todo: 0, doing: 0, done: 0, total: 0 };
  const selected = panel?.kind === "room" ? panel.id : null;
  const current = rooms.find((room) => room.id === selected) ?? null;

  const openRoom = useCallback((id: string) => {
    setPanel({ kind: "room", id });
    sceneRef.current?.focus(id);
  }, []);

  const closePanel = useCallback(() => {
    setPanel(null);
    sceneRef.current?.focus(null);
  }, []);

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
            if (pick.kind === "notes") setPanel({ kind: "notes", noteId: null });
            else if (pick.kind === "resources") setPanel({ kind: "resources" });
            else if (pick.kind === "side") setPanel({ kind: "side", id: pick.id ?? null });
            else if (pick.kind === "room" && pick.id) {
              setPanel({ kind: "room", id: pick.id });
              scene?.focus(pick.id);
            }
          },
          (pick) => setHover(pick)
        );
        if (preview) {
          (window as unknown as { __garden?: GardenScene }).__garden = scene;
        }
        setSceneReady(true);
      } catch {
        if (!dead) setWebgl(false);
      }
    })();
    // The stage changes width when the detail panel opens, so watch the canvas itself.
    const observer = new ResizeObserver(() => sceneRef.current?.resize());
    observer.observe(canvas);
    return () => {
      dead = true;
      observer.disconnect();
      scene?.dispose();
      if (sceneRef.current === scene) sceneRef.current = null;
      setSceneReady(false);
    };
  }, [ready, preview]);

  useEffect(() => {
    if (sceneReady) sceneRef.current?.setRooms(rooms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady, roomKey]);

  useEffect(() => {
    if (sceneReady) sceneRef.current?.setSides(sides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady, sideKey]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (event.key === "Escape") {
        closePanel();
        return;
      }
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key >= "1" && event.key <= "9") {
        const room = rooms[Number(event.key) - 1];
        if (room) openRoom(room.id);
      }
      if (event.key === "n") setPanel({ kind: "notes", noteId: null });
      if (event.key === "p") setPanel({ kind: "side", id: null });
      if (event.key === "t") setPanel({ kind: "resources" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rooms, openRoom, closePanel]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const flash = (text: string, undo?: () => void) => setToast({ text, undo });

  /** Runs the Firestore write unless this is the preview. Returns false and shows the message when it fails. */
  async function remote<T>(write: () => Promise<T>, failed: string): Promise<T | false> {
    if (preview) return undefined as T;
    try {
      return await write();
    } catch {
      setError(failed);
      return false;
    }
  }

  // ─── Việc trong tuần ────────────────────────────────────────────────────
  const patchWork = (id: string, patch: Partial<GardenWork>) =>
    setWorks((list) => list.map((work) => (work.id === id ? { ...work, ...patch } : work)));

  async function changeStatus(item: GardenWork) {
    const next = cycleStatus(item.status);
    patchWork(item.id, { status: next });
    const ok = await remote(() => workItemApi.update(item.id, { status: next }), "Không lưu được trạng thái.");
    if (ok === false) patchWork(item.id, { status: item.status });
  }

  async function addTask(groupId: string, content: string, note = "", status: WorkStatus = "TODO", toWeek = week) {
    if (!toWeek) return;
    if (preview) {
      setWorks((list) => [...list, { id: localId(), taskGroupId: groupId, weekStartDate: toWeek, content, status, note }]);
      return;
    }
    const created = await remote(async () => {
      const row = await workItemApi.create(groupId, toWeek, content, note);
      if (status !== "TODO") await workItemApi.update(row.id, { status });
      return { ...row, status };
    }, "Không thêm được việc.");
    if (created) setWorks((list) => [...list, created]);
  }

  async function saveTask(item: GardenWork, changes: { content: string; note: string }) {
    patchWork(item.id, changes);
    const ok = await remote(() => workItemApi.update(item.id, changes), "Không lưu được việc.");
    if (ok === false) patchWork(item.id, { content: item.content, note: item.note });
  }

  async function deleteTask(item: GardenWork) {
    setWorks((list) => list.filter((work) => work.id !== item.id));
    const ok = await remote(() => workItemApi.delete(item.id), "Không xoá được việc.");
    if (ok === false) {
      setWorks((list) => [...list, item]);
      return;
    }
    flash(`Đã xoá "${item.content}"`, () =>
      void addTask(item.taskGroupId, item.content, item.note, item.status, item.weekStartDate)
    );
  }

  async function moveTaskNext(item: GardenWork) {
    const target = shiftWeek(item.weekStartDate, 1);
    patchWork(item.id, { weekStartDate: target });
    const ok = await remote(() => workItemApi.moveToWeek(item.id, target), "Không chuyển được việc.");
    if (ok === false) {
      patchWork(item.id, { weekStartDate: item.weekStartDate });
      return;
    }
    flash(`Đã chuyển "${item.content}" sang tuần sau`, () => {
      patchWork(item.id, { weekStartDate: item.weekStartDate });
      void remote(() => workItemApi.moveToWeek(item.id, item.weekStartDate), "Không hoàn tác được.");
    });
  }

  // ─── Độ ưu tiên của phòng ban ───────────────────────────────────────────
  // Same rule as the dashboard: priority is the position among active groups, stored as displayOrder.
  const activeGroups = useMemo(
    () => groups.filter((group) => !group.isArchived).sort(compareTaskGroups),
    [groups]
  );

  async function changePriority(id: string, position: number) {
    if (savingPriority) return;
    const reordered = moveTaskGroup(activeGroups, id, position);
    if (reordered === activeGroups) return;
    const previous = groups;
    const archived = groups.filter((group) => group.isArchived).sort(compareTaskGroups);
    const order = new Map([...reordered, ...archived].map((group, index) => [group.id, index + 1]));
    setGroups((list) => list.map((group) => ({ ...group, displayOrder: order.get(group.id) ?? group.displayOrder })));
    setSavingPriority(true);
    const ok = await remote(() => taskGroupApi.reorder([...order.keys()]), "Không lưu được độ ưu tiên.");
    setSavingPriority(false);
    if (ok === false) setGroups(previous);
    else flash("Đã cập nhật độ ưu tiên");
  }

  // ─── Việc phụ ───────────────────────────────────────────────────────────
  async function addSide(name: string) {
    if (preview) {
      setSides((list) => [...list, { id: localId(), name, isDone: false }]);
      return;
    }
    const created = await remote(() => sideTaskApi.create(name), "Không thêm được việc phụ.");
    if (created) setSides((list) => [...list, created]);
  }

  async function finishSide(side: SideItem) {
    setSides((list) => list.filter((item) => item.id !== side.id));
    const ok = await remote(() => sideTaskApi.completeAndRemove(side.id), "Không gỡ được việc phụ.");
    if (ok === false) {
      setSides((list) => [...list, side]);
      return;
    }
    flash(`Xong "${side.name}"`, () => void addSide(side.name));
  }

  // ─── Ghi chú ────────────────────────────────────────────────────────────
  async function createNote(seed?: NoteData) {
    const title = seed?.title ?? "";
    const content = seed?.content ?? "";
    const color = seed?.color ?? "stone:Ý tưởng:📝";
    let created: NoteData | false;
    if (preview) created = { id: localId(), title, content, color, updatedAt: new Date().toISOString() };
    else created = await remote(() => noteApi.create(title, content, color), "Không tạo được ghi chú.");
    if (!created) return;
    const note = created;
    setNotes((list) => [note, ...list]);
    if (!seed) setPanel({ kind: "notes", noteId: note.id });
  }

  async function saveNote(note: NoteData, changes: { title: string; content: string; color: string }) {
    if (preview) {
      setNotes((list) =>
        list.map((item) => (item.id === note.id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item))
      );
      return;
    }
    const saved = await remote(() => noteApi.update(note.id, changes), "Không lưu được ghi chú.");
    if (saved) setNotes((list) => list.map((item) => (item.id === note.id ? saved : item)));
  }

  async function deleteNote(note: NoteData) {
    setNotes((list) => list.filter((item) => item.id !== note.id));
    setPanel({ kind: "notes", noteId: null });
    const ok = await remote(() => noteApi.delete(note.id), "Không xoá được ghi chú.");
    if (ok === false) {
      setNotes((list) => [note, ...list]);
      return;
    }
    flash(`Đã xoá ghi chú "${note.title || "Không tiêu đề"}"`, () => void createNote(note));
  }

  // ─── Tài liệu ───────────────────────────────────────────────────────────
  async function addResource(draft: ResourceDraft) {
    if (preview) {
      setResources((list) => [...list, { id: localId(), ...draft }]);
      return;
    }
    const created = await remote(
      () => resourceApi.create(draft.title, draft.link, draft.description, draft.taskGroupId),
      "Không thêm được tài liệu."
    );
    if (created) setResources((list) => [...list, created]);
  }

  async function deleteResource(item: ResourceApiData) {
    setResources((list) => list.filter((row) => row.id !== item.id));
    const ok = await remote(() => resourceApi.delete(item.id), "Không xoá được tài liệu.");
    if (ok === false) {
      setResources((list) => [...list, item]);
      return;
    }
    flash(`Đã xoá tài liệu "${item.title}"`, () => void addResource(item));
  }

  const hoverName =
    hover?.kind === "room"
      ? rooms.find((room) => room.id === hover.id)?.name
      : hover?.kind === "notes"
        ? `Sổ tay · ${notes.length} ghi chú`
        : hover?.kind === "resources"
          ? `Tủ tài liệu · ${resources.length} tài liệu`
          : hover?.kind === "side"
            ? (sides.find((side) => side.id === hover.id)?.name ?? `Bảng ghim · ${sides.length} việc phụ`)
            : null;

  const places = (
    <>
      <button type="button" className="g-place" aria-pressed={panel?.kind === "notes"} onClick={() => setPanel({ kind: "notes", noteId: null })}>
        <Notebook size={18} aria-hidden />
        <span>Ghi chú</span>
        <b>{notes.length}</b>
      </button>
      <button type="button" className="g-place" aria-pressed={panel?.kind === "side"} onClick={() => setPanel({ kind: "side", id: null })}>
        <PushPin size={18} aria-hidden />
        <span>Việc phụ</span>
        <b>{sides.length}</b>
      </button>
      <button type="button" className="g-place" aria-pressed={panel?.kind === "resources"} onClick={() => setPanel({ kind: "resources" })}>
        <FolderSimple size={18} aria-hidden />
        <span>Tài liệu</span>
        <b>{resources.length}</b>
      </button>
    </>
  );

  const roomList = (
    <ul className="g-list">
      {rooms.map((room, index) => (
        <li key={room.id}>
          <button type="button" className="g-nav-row" aria-current={selected === room.id || undefined} onClick={() => openRoom(room.id)}>
            <em aria-hidden>{room.archived ? "" : index + 1}</em>
            <i style={{ background: room.archived ? "var(--text-faint)" : room.color }} aria-hidden />
            <span>{room.name}</span>
            <b>
              {room.done}/{room.total}
            </b>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="garden" data-panel={panel ? "open" : undefined}>
      <header className="g-header">
        <Link className="g-btn ghost" href="/dashboard">
          <ArrowLeft size={16} aria-hidden />
          Bảng tuần
        </Link>
        <div className="g-week">
          <button className="g-btn icon" type="button" aria-label="Tuần trước" onClick={() => week && setWeek(shiftWeek(week, -1))}>
            <CaretLeft size={16} aria-hidden />
          </button>
          <strong>{week ? weekLabel(week) : "…"}</strong>
          <button className="g-btn icon" type="button" aria-label="Tuần sau" onClick={() => week && setWeek(shiftWeek(week, 1))}>
            <CaretRight size={16} aria-hidden />
          </button>
        </div>
        <p className="g-counts">
          <span>
            <b>{counts.doing}</b> đang làm
          </span>
          <span>
            <b>{counts.todo}</b> chưa làm
          </span>
          <span>
            <b>{counts.done}</b> xong
          </span>
        </p>
        <nav className="g-places in-header" aria-label="Ghi chú, việc phụ, tài liệu">
          {places}
        </nav>
      </header>

      <aside className="g-sidebar" aria-label="Phòng ban">
        <h2 className="g-label">Phòng ban, theo độ ưu tiên</h2>
        {rooms.length === 0 && ready ? <p className="g-empty">Chưa có đầu việc nào.</p> : roomList}
        <dl className="g-legend">
          <div>
            <dt>Đi lại</dt>
            <dd>việc đang làm</dd>
          </div>
          <div>
            <dt>Ngồi chờ</dt>
            <dd>việc chưa làm</dd>
          </div>
          <div>
            <dt>Gục nghỉ</dt>
            <dd>việc đã xong</dd>
          </div>
        </dl>
      </aside>

      <main className="g-stage">
        <canvas ref={canvasRef} aria-label="Văn phòng các đầu việc trong tuần" />
        {!ready && !error && <p className="g-loading">Đang mở văn phòng…</p>}
        {webgl === false && (
          <div className="g-fallback">
            <p className="g-empty">Trình duyệt này không vẽ được 3D. Chọn phòng ban trong danh sách để làm việc.</p>
          </div>
        )}
        <div className="g-notices">
          {preview && <p className="g-banner">Bản xem thử, dữ liệu mẫu. Thay đổi không được lưu.</p>}
          {error && (
            <p className="g-banner error" role="alert">
              {error}
            </p>
          )}
        </div>
        {webgl && ready && <p className="g-hint">Kéo để di chuyển · Cuộn để phóng · Chuột phải để xoay</p>}
        {hover && hoverName && (
          <div className="g-tip" style={{ left: hover.x, top: hover.y }}>
            {hoverName}
          </div>
        )}
        {toast && (
          <div className="g-toast" role="status">
            <span>{toast.text}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Hoàn tác
              </button>
            )}
          </div>
        )}
      </main>

      {panel && (
        <aside className="g-panel" aria-label="Chi tiết">
          <button className="g-btn ghost icon g-close" type="button" aria-label="Đóng" onClick={closePanel}>
            <X size={16} aria-hidden />
          </button>
          {panel.kind === "rooms" && (
            <>
              <h2 className="g-title">Phòng ban</h2>
              <p className="g-sub">Mỗi đầu việc là một phòng. Số bên phải là việc đã xong trên tổng việc tuần này.</p>
              {roomList}
            </>
          )}
          {panel.kind === "room" && current && week && (
            <RoomPanel
              key={current.id}
              room={current}
              priority={{
                position: activeGroups.findIndex((group) => group.id === current.id),
                count: activeGroups.length,
                saving: savingPriority,
                onChange: (position) => void changePriority(current.id, position),
              }}
              tasks={weekWorks(works, week, current.id)}
              resources={resources.filter((item) => item.taskGroupId === current.id)}
              onCycle={changeStatus}
              onAdd={(content) => void addTask(current.id, content)}
              onSave={saveTask}
              onDelete={deleteTask}
              onMoveNext={moveTaskNext}
              onAddResource={addResource}
              onDeleteResource={deleteResource}
            />
          )}
          {panel.kind === "room" && !current && <p className="g-empty">Phòng này không có trong tuần đang xem.</p>}
          {panel.kind === "notes" && (
            <NotesPanel
              notes={notes}
              openId={panel.noteId}
              onOpen={(noteId) => setPanel({ kind: "notes", noteId })}
              onCreate={() => void createNote()}
              onSave={saveNote}
              onDelete={deleteNote}
            />
          )}
          {panel.kind === "side" && (
            <SidePanel sides={sides} highlightId={panel.id} onAdd={addSide} onFinish={finishSide} />
          )}
          {panel.kind === "resources" && (
            <ResourcesPanel
              resources={resources}
              groups={groups}
              onAdd={addResource}
              onDelete={deleteResource}
              onOpenRoom={openRoom}
            />
          )}
        </aside>
      )}

      <nav className="g-places in-footer" aria-label="Phòng ban, ghi chú, việc phụ, tài liệu">
        <button type="button" className="g-place" aria-pressed={panel?.kind === "rooms" || panel?.kind === "room"} onClick={() => setPanel({ kind: "rooms" })}>
          <Buildings size={18} aria-hidden />
          <span>Phòng ban</span>
          <b>{rooms.length}</b>
        </button>
        {places}
      </nav>
    </div>
  );
}
