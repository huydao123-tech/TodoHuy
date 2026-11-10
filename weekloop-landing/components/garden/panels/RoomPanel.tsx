"use client";

import { useState } from "react";
import { ArrowRight, Trash } from "@phosphor-icons/react";
import type { ResourceApiData } from "@/lib/api";
import type { GardenWork, WorkStatus } from "@/lib/garden/model";
import type { SceneRoom } from "../GardenScene";
import { ResourceForm, ResourceRow, type ResourceDraft } from "./ResourcesPanel";

const STATUS_LABEL: Record<WorkStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Xong",
};

const STATUS_CLASS: Record<WorkStatus, string> = {
  TODO: "",
  IN_PROGRESS: "doing",
  DONE: "done",
};

interface Props {
  room: SceneRoom;
  tasks: GardenWork[];
  resources: ResourceApiData[];
  /** Position among active departments, 0 = most important. -1 for a shelved one. */
  priority: { position: number; count: number; saving: boolean; onChange: (position: number) => void };
  onCycle: (task: GardenWork) => void;
  onAdd: (content: string) => void;
  onSave: (task: GardenWork, changes: { content: string; note: string }) => void;
  onDelete: (task: GardenWork) => void;
  onMoveNext: (task: GardenWork) => void;
  onAddResource: (draft: ResourceDraft) => void;
  onDeleteResource: (resource: ResourceApiData) => void;
}

export default function RoomPanel(props: Props) {
  const { room, tasks, resources, priority } = props;
  const [tab, setTab] = useState<"tasks" | "resources">("tasks");
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <h2 className="g-title">
        <i style={{ background: room.archived ? "var(--text-faint)" : room.color }} aria-hidden />
        {room.name}
      </h2>
      <p className="g-sub">
        Xong {room.done}/{room.total} việc tuần này
        {room.archived ? " · Đầu việc đang cất" : ""}
      </p>

      {priority.position >= 0 && (
        <label className="g-inline-field">
          <span>Độ ưu tiên</span>
          <select
            className="g-input compact"
            value={priority.position}
            disabled={priority.saving}
            onChange={(event) => priority.onChange(Number(event.target.value))}
          >
            {Array.from({ length: priority.count }, (_, index) => (
              <option key={index} value={index}>
                {index + 1} / {priority.count}
                {index === 0 ? " (cao nhất)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="g-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "tasks"} onClick={() => setTab("tasks")}>
          Việc tuần <span>{tasks.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "resources"} onClick={() => setTab("resources")}>
          Tài liệu <span>{resources.length}</span>
        </button>
      </div>

      {tab === "tasks" && (
        <>
          <form
            className="g-add"
            onSubmit={(event) => {
              event.preventDefault();
              const content = draft.trim();
              if (!content) return;
              props.onAdd(content);
              setDraft("");
            }}
          >
            <input
              className="g-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Thêm việc cho tuần này"
              aria-label="Thêm việc cho tuần này"
            />
            <button type="submit" className="g-btn form">
              Thêm
            </button>
          </form>
          {tasks.length === 0 && <p className="g-empty">Tuần này phòng chưa có việc. Thêm việc đầu tiên ở ô phía trên.</p>}
          <ul className="g-list">
            {tasks.map((task) =>
              openId === task.id ? (
                <li key={task.id}>
                  <TaskEditor
                    task={task}
                    onClose={() => setOpenId(null)}
                    onSave={(changes) => {
                      props.onSave(task, changes);
                      setOpenId(null);
                    }}
                    onDelete={() => props.onDelete(task)}
                    onMoveNext={() => props.onMoveNext(task)}
                  />
                </li>
              ) : (
                <li key={task.id} className="g-row">
                  <button type="button" className="g-row-main" onClick={() => setOpenId(task.id)}>
                    <span className={task.status === "DONE" ? "g-row-title struck" : "g-row-title"}>{task.content}</span>
                    {task.note ? <span className="g-row-meta">{task.note}</span> : null}
                  </button>
                  <button
                    type="button"
                    className={`g-status ${STATUS_CLASS[task.status]}`}
                    title="Bấm để đổi trạng thái"
                    aria-label={`${STATUS_LABEL[task.status]}. Bấm để đổi trạng thái`}
                    onClick={() => props.onCycle(task)}
                  >
                    {STATUS_LABEL[task.status]}
                  </button>
                </li>
              )
            )}
          </ul>
        </>
      )}

      {tab === "resources" && (
        <>
          {resources.length === 0 && <p className="g-empty">Phòng này chưa có tài liệu.</p>}
          <ul className="g-list">
            {resources.map((item) => (
              <ResourceRow key={item.id} item={item} onDelete={() => props.onDeleteResource(item)} />
            ))}
          </ul>
          <ResourceForm fixedGroupId={room.id} onAdd={props.onAddResource} />
        </>
      )}
    </>
  );
}

function TaskEditor({
  task,
  onClose,
  onSave,
  onDelete,
  onMoveNext,
}: {
  task: GardenWork;
  onClose: () => void;
  onSave: (changes: { content: string; note: string }) => void;
  onDelete: () => void;
  onMoveNext: () => void;
}) {
  const [content, setContent] = useState(task.content);
  const [note, setNote] = useState(task.note);
  return (
    <form
      className="g-form boxed"
      onSubmit={(event) => {
        event.preventDefault();
        if (!content.trim()) return;
        onSave({ content: content.trim(), note });
      }}
    >
      <label className="g-field">
        <span>Tên việc</span>
        <input className="g-input" value={content} onChange={(event) => setContent(event.target.value)} autoFocus />
      </label>
      <label className="g-field">
        <span>Ghi chú</span>
        <textarea className="g-input" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="g-actions">
        <button type="submit" className="g-btn form primary">
          Lưu
        </button>
        <button type="button" className="g-btn form" onClick={onClose}>
          Huỷ
        </button>
      </div>
      <div className="g-actions split">
        <button type="button" className="g-btn ghost" onClick={onMoveNext}>
          <ArrowRight size={16} aria-hidden />
          Chuyển sang tuần sau
        </button>
        <button type="button" className="g-btn danger" onClick={onDelete}>
          <Trash size={16} aria-hidden />
          Xoá
        </button>
      </div>
    </form>
  );
}
