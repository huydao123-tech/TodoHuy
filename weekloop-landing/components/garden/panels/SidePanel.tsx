"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";

export interface SideItem {
  id: string;
  name: string;
  isDone: boolean;
}

interface Props {
  sides: SideItem[];
  highlightId: string | null;
  onAdd: (name: string) => void;
  onFinish: (side: SideItem) => void;
}

export default function SidePanel({ sides, highlightId, onAdd, onFinish }: Props) {
  const [draft, setDraft] = useState("");
  return (
    <>
      <h2 className="g-title">Việc phụ</h2>
      <p className="g-sub">Việc lặt vặt không thuộc phòng ban nào. Tick xong thì việc được gỡ khỏi bảng ghim.</p>
      <form
        className="g-add"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (!name) return;
          onAdd(name);
          setDraft("");
        }}
      >
        <input className="g-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Thêm việc phụ" aria-label="Thêm việc phụ" />
        <button type="submit" className="g-btn form">
          Thêm
        </button>
      </form>
      {sides.length === 0 && <p className="g-empty">Không còn việc phụ nào.</p>}
      <ul className="g-list">
        {sides.map((side) => (
          <li key={side.id} className={side.id === highlightId ? "g-row current" : "g-row"}>
            <button type="button" className="g-check" aria-label={`Xong: ${side.name}`} title="Đánh dấu xong" onClick={() => onFinish(side)}>
              <Check size={12} weight="bold" aria-hidden />
            </button>
            <div className="g-row-main">
              <span className="g-row-title">{side.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
