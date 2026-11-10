"use client";

import { useState } from "react";

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
      <p className="garden-kicker">Hàng rào</p>
      <h2>Việc phụ</h2>
      <p className="garden-sub">Mỗi việc phụ là một con chim. Tick xong thì chim bay, việc được gỡ khỏi danh sách.</p>
      {sides.length === 0 && <p className="garden-empty">Hàng rào đang trống.</p>}
      {sides.map((side) => (
        <div key={side.id} className={`garden-row ${side.id === highlightId ? "hot" : ""}`}>
          <button
            type="button"
            className="garden-check"
            aria-label={`Xong: ${side.name}`}
            title="Xong, gỡ khỏi danh sách"
            onClick={() => onFinish(side)}
          />
          <div className="garden-row-body static">
            <p>{side.name}</p>
          </div>
        </div>
      ))}
      <form
        className="garden-add"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (!name) return;
          onAdd(name);
          setDraft("");
        }}
      >
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Thêm việc phụ" aria-label="Thêm việc phụ" />
        <button type="submit">Thêm</button>
      </form>
    </>
  );
}
