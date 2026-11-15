/** Chuẩn hóa để tìm "lap trinh" vẫn khớp "lập trình". */
export function foldText(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function textMatches(query: string, ...parts: string[]): boolean {
  const needle = foldText(query).trim();
  if (!needle) return true;
  return foldText(parts.join(" ")).includes(needle);
}

export interface BrainEntry {
  id: string;
  date: string;
  content: string;
}

const JOIN_WITH_NEWLINE = new Set(["doc", "bulletList", "orderedList", "listItem", "callout"]);

type NoteNode = { type?: string; text?: string; content?: unknown[] };

/** Chữ để tìm kiếm. Các mark trong cùng một đoạn không bị tách dòng. */
export function entryPlainText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return content;
  try {
    const walk = (node: NoteNode): string => {
      if (node.type === "hardBreak") return "\n";
      if (typeof node.text === "string") return node.text;
      const children = (node.content ?? []).map((child) =>
        child && typeof child === "object" ? walk(child as NoteNode) : "",
      );
      return children.join(JOIN_WITH_NEWLINE.has(node.type ?? "") ? "\n" : "");
    };
    return walk(JSON.parse(trimmed) as NoteNode);
  } catch {
    return content;
  }
}

export function emptyNoteDoc(): string {
  return JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
}

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function formatEntryDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime()) || !year || !month || !day) return iso;
  return `${WEEKDAYS[date.getDay()]}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function linkHref(value: string): string | null {
  const href = value.trim();
  return /^(https?:\/\/|mailto:)/i.test(href) ? href : null;
}

export function plainToDoc(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: (text.length ? text.split("\n") : [""]).map((line) =>
      line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" },
    ),
  });
}
