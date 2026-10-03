// Mock data layer cho ứng dụng Quản lý kế hoạch tuần cá nhân (WeekLoop).
// Dữ liệu được tổ chức theo cặp "groupId:absoluteWeekOffset"
// Trong đó: offset 0 = tuần hiện tại (01/09 - 07/09/2026),
// -1 = tuần trước, +1 = tuần sau.

export type WorkItemStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface TaskGroup {
  id: string | number;
  name: string;
  color: string; // mã màu điểm nhấn
}

export interface WorkItemData {
  id: string | number;
  content: string;
  status: WorkItemStatus;
  note: string;
}

export interface SideTaskData {
  id: string | number;
  name: string;
  isDone: boolean;
}

export interface ResourceData {
  id: string | number;
  groupId: string | number | null;
  title: string;
  link: string;
  description: string;
}

// ─── ĐẦU VIỆC CHÍNH ─────────────────────────────────────────
export const TASK_GROUPS: TaskGroup[] = [
  { id: "1", name: "Tiếng Nhật", color: "#16A34A" },       // xanh lá cây
  { id: "2", name: "Cờ vua (Chess)", color: "#7C3AED" },   // tím hoa cà
  { id: "3", name: "Thể hình (Gym)", color: "#D97706" },   // vàng hổ phách
];

// ─── MỤC TIÊU TUẦN (WEEKLY GOALS) ──────────────────────────
// Khóa: "groupId:absoluteOffset"
const WEEKLY_GOALS: Record<string, string> = {
  "1:-1": "Hoàn thành chương 5 Minna no Nihongo",
  "1:0":  "Học từ vựng bài 26-27, luyện nghe đề thi N4",
  "1:1":  "Ôn tập tổng hợp ngữ pháp chương 5-6",
  "2:-1": "Giải 50 bài chiến thuật tàn cuộc xe",
  "2:0":  "Phân tích 10 ván chớp, nghiên cứu biến thể Sicilian",
  "2:1":  "Tham gia giải đấu Arena Lichess cuối tuần",
  "3:-1": "3 buổi tập: ngực, vai, chân",
  "3:0":  "4 buổi tập, tăng tạ Bench Press lên 62.5kg",
  "3:1":  "Duy trì 4 buổi tập, bổ sung 20 phút cardio mỗi buổi",
};

export function getGoalText(groupId: string | number, absoluteOffset: number): string {
  return WEEKLY_GOALS[`${groupId}:${absoluteOffset}`] ?? "";
}

// ─── CÔNG VIỆC CON THEO TUẦN (WORK ITEMS) ───────────────────
const WORK_ITEMS_MAP: Record<string, WorkItemData[]> = {
  "1:-1": [
    { id: "1",  content: "Xong bài 25 ngữ pháp Minna",        status: "DONE",        note: "" },
    { id: "2",  content: "Anki 50 thẻ từ vựng mỗi ngày x 7 ngày", status: "DONE",    note: "" },
    { id: "3",  content: "Luyện nghe NHK Easy 3 bài",          status: "DONE",        note: "" },
  ],
  "1:0": [
    { id: "4",  content: "Xong bài 26 ngữ pháp Minna",        status: "IN_PROGRESS", note: "Đang làm phần 3/5" },
    { id: "5",  content: "Học từ vựng Anki đến bài 27",       status: "TODO",        note: "" },
    { id: "6",  content: "Làm bài thi thử JLPT N4 lần 1",      status: "TODO",        note: "" },
  ],
  "1:1": [],
  "2:-1": [
    { id: "7",  content: "50 bài giải đố tàn cuộc xe",         status: "DONE",        note: "" },
    { id: "8",  content: "Xem chuỗi video tàn cuộc của Silman", status: "DONE",        note: "" },
  ],
  "2:0": [
    { id: "9",  content: "Phân tích 5 ván chớp cùng Stockfish", status: "IN_PROGRESS", note: "" },
    { id: "10", content: "Học biến thể Be3 Sicilian Najdorf", status: "TODO",        note: "" },
    { id: "11", content: "Đấu 10 ván cờ chớp trên Lichess",    status: "TODO",        note: "" },
  ],
  "2:1": [],
  "3:-1": [
    { id: "12", content: "Đẩy ngực ngang 3x8 60kg",            status: "DONE",        note: "" },
    { id: "13", content: "Đẩy vai qua đầu 3x10",               status: "DONE",        note: "" },
    { id: "14", content: "Gánh đùi và kéo tạ buổi thứ 3",      status: "DONE",        note: "" },
  ],
  "3:0": [
    { id: "15", content: "Đẩy ngực 62.5kg x 3 hiệp",           status: "DONE",        note: "Đã xong hôm thứ Hai" },
    { id: "16", content: "Chạy bộ 20 phút sau buổi tập",       status: "IN_PROGRESS", note: "Đã hoàn thành 3/4 buổi" },
    { id: "17", content: "Gánh tạ Squat 70kg x 5 lần",         status: "TODO",        note: "" },
  ],
  "3:1": [],
};

export function getWorkItems(groupId: string | number, absoluteOffset: number): WorkItemData[] {
  return WORK_ITEMS_MAP[`${groupId}:${absoluteOffset}`] ?? [];
}

// ─── ĐẦU VIỆC PHỤ (SIDE TASKS) ─────────────────────────────
export const INITIAL_SIDE_TASKS: SideTaskData[] = [
  { id: "1", name: "Đặt lịch cắt tóc cuối tuần",           isDone: false },
  { id: "2", name: "Nộp hồ sơ gia hạn visa",               isDone: false },
  { id: "4", name: "Đọc bài: Kỹ năng làm việc với AI Agent", isDone: false },
];

// ─── TÀI LIỆU THAM KHẢO (RESOURCES) ────────────────────────
export const RESOURCES: ResourceData[] = [
  { id: "1", groupId: "1", title: "Minna no Nihongo Sơ cấp I", link: "https://example.com", description: "Giáo trình chính đang học" },
  { id: "2", groupId: "1", title: "Bộ thẻ Anki tiếng Nhật N4", link: "https://ankiweb.net", description: "Flashcard từ vựng ôn tập mỗi ngày" },
  { id: "3", groupId: "2", title: "Nghiên cứu Lichess - Khai cuộc Sicilian", link: "https://lichess.org", description: "Hệ thống biến thể Sicilian Defence" },
  { id: "4", groupId: null, title: "Kết quả bóng đá Việt Nam", link: "https://example.com", description: "Tin tức các giải đấu bóng đá trong nước" },
  { id: "5", groupId: null, title: "Kinh nghiệm ứng dụng AI Agent", link: "https://example.com", description: "Tài liệu phương pháp làm việc cùng Agent" },
];

// ─── TIỆN ÍCH TÍNH TUẦN DÙNG CHUNG VỚI FLUTTER ───────────────
export function getMonday(d: Date = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatWeekDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStartOfWeekByOffset(absoluteOffset: number = 0): Date {
  const monday = getMonday();
  monday.setDate(monday.getDate() + absoluteOffset * 7);
  return monday;
}

export function getWeekDateStr(absoluteOffset: number = 0): string {
  return formatWeekDateStr(getStartOfWeekByOffset(absoluteOffset));
}

export function getWeekRange(absoluteOffset: number): string {
  const start = getStartOfWeekByOffset(absoluteOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

export function getWeekYear(absoluteOffset: number): number {
  return getStartOfWeekByOffset(absoluteOffset).getFullYear();
}

export function getNavLabel(absoluteOffset: number): string {
  const start = getStartOfWeekByOffset(absoluteOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(start)} - ${fmt(end)}/${end.getFullYear()}`;
}

export function dateStrToOffset(weekStartDateStr: string): number {
  if (!weekStartDateStr) return 0;
  const currentMonday = getMonday();
  const parts = weekStartDateStr.split("-").map(Number);
  if (parts.length !== 3) return 0;
  // Year, Month (0-based), Day
  const targetMonday = new Date(parts[0], parts[1] - 1, parts[2]);
  targetMonday.setHours(0, 0, 0, 0);
  const diffMs = targetMonday.getTime() - currentMonday.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

// ─── GHI CHÚ PHONG CÁCH NOTION GALLERY ───────────────────────
export interface GalleryNote {
  id: string | number;
  title: string;
  content: string;
  category: "Ý tưởng" | "Công việc" | "Học tập" | "Cá nhân" | "Dự án";
  icon: string;
  coverGradient: string;
  color: string;
  updatedAt: string;
}

export const NOTION_COVERS = [
  { id: "stone", name: "Đá xám", gradient: "#F4F4F5" },
  { id: "amber", name: "Vàng nhạt", gradient: "#FEF9C3" },
  { id: "mint",  name: "Bạc hà dịu", gradient: "#ECFDF5" },
  { id: "lilac", name: "Tím hoa cà", gradient: "#F5F3FF" },
  { id: "sky",   name: "Xanh mây", gradient: "#F0F9FF" },
  { id: "rose",  name: "Hồng phấn", gradient: "#FFF1F2" },
];

export const NOTION_ICONS = ["💡", "📝", "🎯", "🚀", "📚", "☕", "🎨", "⚡", "🧠", "🌱", "📊", "🧭"];

export const NOTION_CATEGORIES = ["Ý tưởng", "Công việc", "Học tập", "Cá nhân", "Dự án"] as const;

export const INITIAL_NOTES: GalleryNote[] = [
  {
    id: 1,
    title: "Chiến lược học từ vựng Anki & Tiếng Nhật N4",
    content: "Mục tiêu duy trì 50 thẻ từ vựng mỗi sáng trước 8h. Tập trung các cặp tha động từ - tự động từ trong Minna no Nihongo. Kết hợp Shadowing các đoạn hội thoại ngắn mỗi cuối tuần.",
    category: "Học tập",
    icon: "📚",
    coverGradient: "linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)",
    color: "mint",
    updatedAt: "2026-09-06T20:30:00Z",
  },
  {
    id: 2,
    title: "Ý tưởng sản phẩm: WeekLoop AI Assistant",
    content: "Nghiên cứu cơ chế gợi ý phân bổ đầu việc tuần thông minh dựa trên thói quen làm việc. Sử dụng mô hình local LLM hoặc API để tự động tổng hợp báo cáo tiến độ vào tối Chủ Nhật.",
    category: "Ý tưởng",
    icon: "💡",
    coverGradient: "linear-gradient(135deg, #FEF3C7 0%, #F59E0B 100%)",
    color: "amber",
    updatedAt: "2026-09-06T18:15:00Z",
  },
  {
    id: 3,
    title: "Phân tích biến thể cờ vua Sicilian Defence",
    content: "Najdorf 6.Be3 e5 7.Nb3 Be7. Chú ý các phương án phản công ở cánh hậu với b5 và d5 phá vỡ cấu trúc trung tâm của Trắng. Thực hành giải thêm các bài puzzle tàn cuộc xe.",
    category: "Dự án",
    icon: "🎯",
    coverGradient: "linear-gradient(135deg, #EDE9FE 0%, #8B5CF6 100%)",
    color: "lilac",
    updatedAt: "2026-09-05T14:20:00Z",
  },
  {
    id: 4,
    title: "Giáo án tập Gym 4 buổi & Dinh dưỡng",
    content: "Lịch tập Push - Pull - Legs - Upper. Bench press mục tiêu 65kg x 5 reps. Bổ sung đủ 1.6g protein/kg cân nặng và duy trì uống tối thiểu 2.5 lít nước mỗi ngày.",
    category: "Cá nhân",
    icon: "⚡",
    coverGradient: "linear-gradient(135deg, #FFE4E6 0%, #F43F5E 100%)",
    color: "rose",
    updatedAt: "2026-09-04T09:00:00Z",
  },
  {
    id: 5,
    title: "Ghi chú họp kỹ thuật & Tối ưu hóa hiệu năng",
    content: "Xem xét chuyển đổi các truy vấn Spring Boot sang projection để giảm tải bộ nhớ. Áp dụng cache cho dashboard 3 tuần và kiểm tra thời gian phản hồi dưới 50ms.",
    category: "Công việc",
    icon: "🚀",
    coverGradient: "linear-gradient(135deg, #E0F2FE 0%, #0284C7 100%)",
    color: "sky",
    updatedAt: "2026-09-03T16:45:00Z",
  },
];

