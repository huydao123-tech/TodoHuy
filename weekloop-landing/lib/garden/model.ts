export type Species =
  | "fox"
  | "ant"
  | "penguin"
  | "tiger"
  | "dog"
  | "parrot"
  | "cook"
  | "chesscat"
  | "tanuki"
  | "crane"
  | "moth"
  | "hare";

export type Mood = "sleep" | "work" | "wait";
export type WorkStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface GardenGroup {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
  isArchived: boolean;
}

export interface GardenWork {
  id: string;
  taskGroupId: string;
  weekStartDate: string;
  content: string;
  status: WorkStatus;
  note: string;
}

const SPECIES_LABEL: Record<Species, string> = {
  fox: "Cáo",
  ant: "Kiến",
  penguin: "Cánh cụt",
  tiger: "Hổ",
  dog: "Chó",
  parrot: "Vẹt",
  cook: "Mèo bếp",
  chesscat: "Mèo cờ",
  tanuki: "Lửng",
  crane: "Sếu",
  moth: "Bướm đêm",
  hare: "Thỏ",
};

export function speciesLabel(species: Species): string {
  return SPECIES_LABEL[species];
}

export function speciesForGroup(name: string): Species {
  const n = name.toLowerCase();
  if (/đại học|dai hoc|đh|aizu|trường/.test(n)) return "crane";
  if (/nhật|nhat|kanji|jlpt/.test(n)) return "fox";
  if (/nghiệp vụ|nghiep vu|kiến|kien|nest/.test(n)) return "ant";
  if (/\bfpt\b|phỏng vấn|phong van/.test(n)) return "penguin";
  if (/chiến đấu|chien dau|gym|thể hình|the hinh|cardio/.test(n)) return "tiger";
  if (/lái xe|lai xe|bằng lái|bang lai/.test(n)) return "dog";
  if (/nấu|nau ăn|nau an|nấu ăn/.test(n)) return "cook";
  if (/cờ vua|co vua|chess/.test(n)) return "chesscat";
  if (/thú vui|thu vui/.test(n)) return "tanuki";
  if (/mbti|tiktok|page/.test(n)) return "moth";
  if (/tiếng anh|tieng anh|english|toeic|\banh\b/.test(n)) return "parrot";
  return "hare";
}

export function moodFor(items: { status: string }[]): Mood {
  if (items.length === 0) return "sleep";
  if (items.every((item) => item.status === "DONE")) return "sleep";
  if (items.some((item) => item.status === "IN_PROGRESS")) return "work";
  return "wait";
}

function byOrder(a: GardenGroup, b: GardenGroup): number {
  return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "vi");
}

/** Active groups stay in the yard. Archived groups appear only when this week still has work. */
export function visibleGroups(
  groups: GardenGroup[],
  works: GardenWork[],
  week: string
): GardenGroup[] {
  const busy = new Set(
    works.filter((work) => work.weekStartDate === week).map((work) => work.taskGroupId)
  );
  const active = groups.filter((group) => !group.isArchived).sort(byOrder);
  const archivedBusy = groups
    .filter((group) => group.isArchived && busy.has(group.id))
    .sort(byOrder);
  return [...active, ...archivedBusy];
}

export function weekWorks(works: GardenWork[], week: string, groupId?: string): GardenWork[] {
  return works.filter(
    (work) => work.weekStartDate === week && (groupId == null || work.taskGroupId === groupId)
  );
}

export function weekCounts(works: GardenWork[], week: string) {
  const list = weekWorks(works, week);
  return {
    todo: list.filter((work) => work.status === "TODO").length,
    doing: list.filter((work) => work.status === "IN_PROGRESS").length,
    done: list.filter((work) => work.status === "DONE").length,
    total: list.length,
  };
}

export function cycleStatus(status: WorkStatus): WorkStatus {
  if (status === "TODO") return "IN_PROGRESS";
  if (status === "IN_PROGRESS") return "DONE";
  return "TODO";
}

export function shiftWeek(start: string, delta: number): string {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + delta * 7);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function weekLabel(start: string): string {
  const [year, month, day] = start.split("-").map(Number);
  const from = new Date(year, month - 1, day);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  const fmt = (date: Date) => `${date.getDate()} thg ${date.getMonth() + 1}`;
  return `${fmt(from)} – ${fmt(to)}`;
}

export function noteTag(color: string): string {
  const parts = color.split(":");
  return parts[1]?.trim() || "Ghi chú";
}

export const NOTE_CATEGORIES = ["Ý tưởng", "Công việc", "Học tập", "Cá nhân", "Dự án"] as const;

/** Notes keep cover, category and icon packed in one `color` field: "stone:Học tập:📝". */
export function parseNoteColor(color: string): { cover: string; category: string; icon: string } {
  const parts = (color || "").split(":");
  const category = parts[1]?.trim() ?? "";
  return {
    cover: parts[0]?.trim() || "stone",
    category: (NOTE_CATEGORIES as readonly string[]).includes(category) ? category : NOTE_CATEGORIES[0],
    icon: parts[2]?.trim() || "📝",
  };
}

/** Change only the category, so the cover and icon chosen on the dashboard survive. */
export function withNoteCategory(color: string, category: string): string {
  const parsed = parseNoteColor(color);
  return `${parsed.cover}:${category}:${parsed.icon}`;
}

export function filterNotes<T extends { title: string; content: string; color: string; updatedAt: string }>(
  notes: T[],
  query: string,
  category: string | null
): T[] {
  const q = query.trim().toLowerCase();
  return notes
    .filter((note) => !category || parseNoteColor(note.color).category === category)
    .filter((note) => !q || note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export interface ResourceSection<T> {
  groupId: string | null;
  name: string;
  items: T[];
}

/** Resources by task group, in yard order. Loose ones (no group, or a deleted group) go last under "Chung". */
export function groupResources<T extends { taskGroupId: string | null }>(
  resources: T[],
  groups: GardenGroup[]
): ResourceSection<T>[] {
  const known = new Set(groups.map((group) => group.id));
  const sections: ResourceSection<T>[] = [...groups]
    .sort(byOrder)
    .map((group) => ({
      groupId: group.id,
      name: group.name,
      items: resources.filter((item) => item.taskGroupId === group.id),
    }))
    .filter((section) => section.items.length > 0);
  const loose = resources.filter((item) => !item.taskGroupId || !known.has(item.taskGroupId));
  if (loose.length > 0) sections.push({ groupId: null, name: "Chung", items: loose });
  return sections;
}

/** "example.com/a" becomes "https://example.com/a". Anything that is not a web address is kept as plain text. */
export function normalizeLink(raw: string): string {
  const link = raw.trim();
  if (!link || /^https?:\/\//i.test(link)) return link;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(link)) return `https://${link}`;
  return link;
}

export function isWebLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}
