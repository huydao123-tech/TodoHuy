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

export function entryPlainText(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return content;
  try {
    const parts: string[] = [];
    const walk = (node: { text?: string; content?: unknown[] }) => {
      if (typeof node.text === "string") parts.push(node.text);
      node.content?.forEach((child) => {
        if (child && typeof child === "object") walk(child as { text?: string; content?: unknown[] });
      });
    };
    walk(JSON.parse(trimmed));
    return parts.join("\n");
  } catch {
    return content;
  }
}

export function plainToDoc(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: (text.length ? text.split("\n") : [""]).map((line) =>
      line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" },
    ),
  });
}
