"use client";

import { useState } from "react";
import type { ResourceApiData } from "@/lib/api";
import { speciesLabel, type GardenWork, type WorkStatus } from "@/lib/garden/model";
import type { SceneRoom } from "../GardenScene";
import { ResourceForm, ResourceRow, type ResourceDraft } from "./ResourcesPanel";

const STATUS_LABEL: Record<WorkStatus, string> = {
  TODO: "Chưa làm",
  IN_PROGRESS: "Đang làm",
  DONE: "Xong",
};

const MOOD_LINE = {
  work: "Đang đi lại, vì tuần này còn việc dở.",
  wait: "Đang ngồi chờ, vì chưa việc nào được bắt đầu.",
  sleep: "Đang ngủ. Tuần này trống hoặc đã xong.",
};

interface Props {
  room: SceneRoom;
  tasks: GardenWork[];
  resources: ResourceApiData[];
  onCycle: (task: GardenWork) => void;
  onAdd: (content: string) => void;
  onSave: (task: GardenWork, changes: { content: string; note: string }) => void;
  onDelete: (task: GardenWork) => void;
  onMoveNext: (task: GardenWork) => void;
  onAddResource: (draft: ResourceDraft) => void;
  onDeleteResource: (resource: ResourceApiData) => void;
}

export default function RoomPanel(props: Props) {
  const { room, tasks, resources } = props;
  const [tab, setTab] = useState<"tasks" | "resources">("tasks");
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <p className="garden-kicker">
        {speciesLabel(room.species)}
        {room.archived ? " · đang cất" : ""}
      </p>
      <h2>{room.name}</h2>
      <p className="garden-sub">{MOOD_LINE[room.mood]}</p>

      <div className="garden-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "tasks"} onClick={() => setTab("tasks")}>
          Việc tuần <span>{tasks.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === "resources"} onClick={() => setTab("resources")}>
          Tài liệu <span>{resources.length}</span>
        </button>
      </div>

      {tab === "tasks" && (
        <>
          {tasks.length === 0 && <p className="garden-empty">Chưa có việc trong tuần này.</p>}
          {tasks.map((task) =>
            openId === task.id ? (
              <TaskEditor
                key={task.id}
                task={task}
                onClose={() => setOpenId(null)}
                onSave={(changes) => {
                  props.onSave(task, changes);
                  setOpenId(null);
                }}
                onDelete={() => props.onDelete(task)}
                onMoveNext={() => props.onMoveNext(task)}
              />
            ) : (
              <div key={task.id} className="garden-row">
                <button
                  type="button"
                  className={`garden-status ${task.status === "IN_PROGRESS" ? "doing" : task.status === "DONE" ? "done" : ""}`}
                  title="Bấm để đổi trạng thái"
                  aria-label={`${STATUS_LABEL[task.status]}. Bấm để đổi trạng thái`}
                  onClick={() => props.onCycle(task)}
                >
                  {STATUS_LABEL[task.status]}
                </button>
                <button type="button" className="garden-row-body" onClick={() => setOpenId(task.id)}>
                  <p className={task.status === "DONE" ? "struck" : ""}>{task.content}</p>
                  {task.note ? <small>{task.note}</small> : null}
                </button>
              </div>
            )
          )}
          <form
            className="garden-add"
            onSubmit={(event) => {
              event.preventDefault();
              const content = draft.trim();
              if (!content) return;
              props.onAdd(content);
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Thêm việc trong tuần"
              aria-label="Thêm việc trong tuần"
            />
            <button type="submit">Thêm</button>
          </form>
        </>
      )}

      {tab === "resources" && (
        <>
          {resources.length === 0 && <p className="garden-empty">Đầu việc này chưa có tài liệu.</p>}
          {resources.map((item) => (
            <ResourceRow key={item.id} item={item} onDelete={() => props.onDeleteResource(item)} />
          ))}
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
      className="garden-edit"
      onSubmit={(event) => {
        event.preventDefault();
        if (!content.trim()) return;
        onSave({ content: content.trim(), note });
      }}
    >
      <input value={content} onChange={(event) => setContent(event.target.value)} aria-label="Tên việc" autoFocus />
      <textarea
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ghi chú cho việc này"
        aria-label="Ghi chú cho việc này"
      />
      <div className="garden-actions">
        <button type="submit" className="garden-text-btn">
          Lưu
        </button>
        <button type="button" className="garden-text-btn quiet" onClick={onClose}>
          Thôi
        </button>
        <span className="spacer" />
        <button type="button" className="garden-link-btn" onClick={onMoveNext}>
          Sang tuần sau
        </button>
        <button type="button" className="garden-link-btn danger" onClick={onDelete}>
          Xoá
        </button>
      </div>
    </form>
  );
}
