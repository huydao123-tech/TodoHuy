"use client";

import { useState } from "react";
import { ArrowSquareOut, Trash } from "@phosphor-icons/react";
import type { ResourceApiData } from "@/lib/api";
import { groupResources, isWebLink, normalizeLink, type GardenGroup } from "@/lib/garden/model";

export interface ResourceDraft {
  title: string;
  link: string;
  description: string;
  taskGroupId: string | null;
}

export function ResourceRow({ item, onDelete }: { item: ResourceApiData; onDelete: () => void }) {
  const web = isWebLink(item.link);
  const meta = [web ? "" : item.link, item.description].filter(Boolean).join(" · ");
  const body = (
    <>
      <span className="g-row-title">
        {item.title || item.link}
        {web ? <ArrowSquareOut size={14} aria-hidden /> : null}
      </span>
      {meta ? <span className="g-row-meta">{meta}</span> : null}
    </>
  );
  return (
    <li className="g-row">
      {web ? (
        <a className="g-row-main" href={item.link} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        <div className="g-row-main">{body}</div>
      )}
      <button type="button" className="g-btn ghost icon g-row-action" aria-label={`Xoá tài liệu ${item.title}`} title="Xoá" onClick={onDelete}>
        <Trash size={16} aria-hidden />
      </button>
    </li>
  );
}

export function ResourceForm({
  groups,
  fixedGroupId,
  onAdd,
}: {
  groups?: GardenGroup[];
  fixedGroupId?: string;
  onAdd: (draft: ResourceDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  return (
    <form
      className="g-form divided"
      onSubmit={(event) => {
        event.preventDefault();
        if (!title.trim()) return;
        onAdd({
          title: title.trim(),
          link: normalizeLink(link),
          description: description.trim(),
          taskGroupId: fixedGroupId ?? (groupId || null),
        });
        setTitle("");
        setLink("");
        setDescription("");
      }}
    >
      <h3 className="g-label">Thêm tài liệu</h3>
      <label className="g-field">
        <span>
          Tên <em>*</em>
        </span>
        <input className="g-input" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <label className="g-field">
        <span>Đường dẫn</span>
        <input className="g-input" value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://" />
      </label>
      <label className="g-field">
        <span>Mô tả</span>
        <input className="g-input" value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {groups && !fixedGroupId && (
        <label className="g-field">
          <span>Phòng ban</span>
          <select className="g-input" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="">Chung, không thuộc phòng nào</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="g-actions">
        <button type="submit" className="g-btn form primary">
          Thêm tài liệu
        </button>
      </div>
    </form>
  );
}

interface Props {
  resources: ResourceApiData[];
  groups: GardenGroup[];
  onAdd: (draft: ResourceDraft) => void;
  onDelete: (resource: ResourceApiData) => void;
  onOpenRoom: (groupId: string) => void;
}

export default function ResourcesPanel({ resources, groups, onAdd, onDelete, onOpenRoom }: Props) {
  const sections = groupResources(resources, groups);
  return (
    <>
      <h2 className="g-title">Tài liệu</h2>
      <p className="g-sub">Xếp theo phòng ban. Tài liệu của phòng nào cũng hiện trong phòng đó.</p>
      {sections.length === 0 && <p className="g-empty">Chưa có tài liệu nào. Thêm tài liệu đầu tiên ở form bên dưới.</p>}
      {sections.map((section) => (
        <section key={section.groupId ?? "loose"} className="g-section">
          {section.groupId ? (
            <button type="button" className="g-label link" onClick={() => onOpenRoom(section.groupId!)}>
              {section.name} · {section.items.length}
            </button>
          ) : (
            <h3 className="g-label">
              {section.name} · {section.items.length}
            </h3>
          )}
          <ul className="g-list">
            {section.items.map((item) => (
              <ResourceRow key={item.id} item={item} onDelete={() => onDelete(item)} />
            ))}
          </ul>
        </section>
      ))}
      <ResourceForm groups={groups.filter((group) => !group.isArchived)} onAdd={onAdd} />
    </>
  );
}
