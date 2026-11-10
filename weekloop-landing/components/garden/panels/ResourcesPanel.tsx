"use client";

import { useState } from "react";
import type { ResourceApiData } from "@/lib/api";
import { groupResources, isWebLink, normalizeLink, type GardenGroup } from "@/lib/garden/model";

export interface ResourceDraft {
  title: string;
  link: string;
  description: string;
  taskGroupId: string | null;
}

export function ResourceRow({ item, onDelete }: { item: ResourceApiData; onDelete: () => void }) {
  return (
    <div className="garden-row">
      <div className="garden-row-body static">
        {isWebLink(item.link) ? (
          <a href={item.link} target="_blank" rel="noreferrer">
            {item.title || item.link} ↗
          </a>
        ) : (
          <p>{item.title}</p>
        )}
        {!isWebLink(item.link) && item.link ? <small>{item.link}</small> : null}
        {item.description ? <small>{item.description}</small> : null}
      </div>
      <button type="button" className="garden-x" aria-label={`Xoá tài liệu ${item.title}`} title="Xoá" onClick={onDelete}>
        ×
      </button>
    </div>
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
      className="garden-edit"
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
      <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên tài liệu *" aria-label="Tên tài liệu" />
      <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Đường dẫn (https://…)" aria-label="Đường dẫn" />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Mô tả ngắn (không bắt buộc)"
        aria-label="Mô tả"
      />
      {groups && !fixedGroupId && (
        <select value={groupId} onChange={(event) => setGroupId(event.target.value)} aria-label="Thuộc đầu việc">
          <option value="">Chung, không thuộc đầu việc nào</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      )}
      <div className="garden-actions">
        <button type="submit" className="garden-text-btn">
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
      <p className="garden-kicker">Kệ sách</p>
      <h2>Tài liệu</h2>
      <p className="garden-sub">Xếp theo đầu việc. Tài liệu của một đầu việc cũng hiện trong căn của nó.</p>
      {sections.length === 0 && <p className="garden-empty">Chưa có tài liệu nào.</p>}
      {sections.map((section) => (
        <section key={section.groupId ?? "loose"} className="garden-section">
          {section.groupId ? (
            <button type="button" className="garden-section-head" onClick={() => onOpenRoom(section.groupId!)}>
              {section.name} <span>{section.items.length}</span>
            </button>
          ) : (
            <p className="garden-section-head">
              {section.name} <span>{section.items.length}</span>
            </p>
          )}
          {section.items.map((item) => (
            <ResourceRow key={item.id} item={item} onDelete={() => onDelete(item)} />
          ))}
        </section>
      ))}
      <ResourceForm groups={groups.filter((group) => !group.isArchived)} onAdd={onAdd} />
    </>
  );
}
