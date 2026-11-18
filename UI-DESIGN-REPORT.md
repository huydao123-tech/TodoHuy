# WeekLoop Mobile — Báo cáo thiết kế UI & blueprint port sang web

> **Ngày:** 18/11/2026 · **App:** WeekLoop (Flutter, `todohuy` 1.4.0+12)
> **Baseline đo đạc:** điện thoại 390 × 844 dp, 100% text scale
> **Mục đích:** ghi lại hệ thống thiết kế + layout thực tế của bản mobile để áp dụng cho bản web (`weekloop-landing`).
> **Quy ước:** số đo lấy trực tiếp từ code Flutter, đơn vị dp. Trên web quy đổi **1 dp ≈ 1 CSS px** ở zoom 100%. Nguồn tham chiếu ở Phụ lục B.

---

## 0. TL;DR — 10 điều quan trọng nhất trước khi port

1. **Layout mobile là “một cột, nhiều lớp”**, không phải dashboard nhiều cột: AppBar → thanh tuần → nội dung cuộn → bottom nav. Web cần chuyển thành **sidebar trái cố định + top bar + vùng nội dung**, giữ nguyên thứ tự thông tin.
2. **Hai màn lõi:** Planner (lưới thẻ đầu việc, mỗi thẻ tự cuộn) và Việc cần làm (7 thẻ thứ + hàng đợi). Đây là layout cần copy trước.
3. **Chất liệu:** nền giấy ấm `#FAFAF9`, thẻ trắng, viền mảnh `1px` (mobile dùng 0.8), bo thẻ **16**, bo sheet **24**, shadow rất nhẹ. Dark mode là zinc đen `#09090B` / `#18181B`.
4. **Một accent duy nhất:** xanh emerald `#16A34A`. Không gradient ngoài logo; không dùng nhiều màu nhấn.
5. **Typography dày, nhỏ, gọn:** tiêu đề 17–19/800, thân 13.5–15/400–500, meta 10.5–12; line-height 1.3–1.6. Font mobile là Roboto mặc định Android.
6. **Khoảng cách 4-based:** 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32. Padding ngang trang **16**; sheet **20–24**.
7. **Bottom sheet là “ngôn ngữ tương tác” chính:** thêm việc, chi tiết việc, chọn thứ, đổi theme, ngôn ngữ, thêm tài liệu. Web nên map sang `<dialog>`/side sheet; mobile giữ bottom sheet.
8. **Trạng thái chỉ sống ở Việc cần làm:** Planner **không** có nút tròn/gạch ngang; đừng port status vào Planner web.
9. **Việc lặp nhiều thứ:** `daysOfWeek = 1…7` (1 = Thứ 2), `dayOrder` lưu thứ tự kéo-thả **riêng từng thứ**. Đây là dữ liệu dùng chung với web.
10. **Bản web hiện tại khác skin:** indigo `#4f46e5`, Inter, flat 1px, radius 8–12, gần như không shadow. Mobile là xanh, 16, shadow mềm. Cần chốt: **port layout + đổi skin theo mobile** (khuyến nghị) hay **chỉ port layout, giữ skin web**.

---

## 1. Định hướng thiết kế

### 1.1 Ba tính từ

| Tính từ | Biểu hiện |
| --- | --- |
| **Calm** | Nền giấy ấm, ít màu, accent xanh dịu, không gradient/neon, shadow gần như không thấy |
| **Dense-but-airy** | Nhiều thông tin trong một thẻ nhưng padding thoáng, đường phân cách mảnh, chữ nhỏ có chủ đích |
| **Paper / Notion-like** | Thẻ trắng viền mảnh, ghi chú pastel, emoji badge, chữ đậm vừa, cảm giác “sổ tay số” |

### 1.2 Nguyên tắc

- **Một accent:** xanh `#16A34A` cho hành động chính, trạng thái xong, focus, badge tuần hiện tại. Màu nhóm/ghi chú chỉ dùng làm nhận diện phụ, không dùng cho nút.
- **Viền thay vì đổ bóng:** card = trắng + viền 0.8–1px; shadow chỉ để tách lớp nhẹ. Dark mode bỏ shadow, dùng viền.
- **Thông tin theo lớp:** tiêu đề đậm → nội dung vừa → meta nhỏ/faint. Không dùng 3 cỡ chữ đậm liên tiếp.
- **Thao tác chính luôn ở đáy màn hình hoặc đáy sheet** (thumb zone), thao tác phụ ở header.
- **Xoá/khôi phục:** xoá ngay + SnackBar Hoàn tác 4–5 giây; chỉ dùng AlertDialog cho thao tác không hoàn tác được (xoá vĩnh viễn, xoá nhóm).
- **Không trang trí thêm:** không banner, không illustration lớn; empty state chỉ là vòng tròn accent nhạt + icon + 2 dòng chữ.

### 1.3 Đối tượng & ngữ cảnh

- Một người dùng cá nhân, tiếng Việt là chính, dùng điện thoại khi cần; bản web dùng máy tính là chính.
- Nền tảng tinh thần: **Material 3, Android-first** (không dùng Cupertino); iOS dùng Material + safe area, không giả lập back gesture của iOS.
- Nội dung tiếng Việt có dấu → cần line-height thoáng (≥1.3) và tránh cắt chữ ở tiêu đề dài.
- Mobile ưu tiên **một tay**: tab bar dưới, FAB, sheet đáy, nút hành động trong tầm ngón cái.

---

## 2. Design tokens

### 2.1 Màu — Light

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `bg` | `#FAFAF9` | Nền toàn app (scaffold) |
| `bgAlt` | `#F5F5F4` | Nền input, vùng subtle, segmented control |
| `surface` | `#FFFFFF` | Card, AppBar, Drawer, sheet |
| `surfaceSubtle` | `#F8FAFC` | Nền phụ rất nhẹ (ít dùng) |
| `border` | `#E7E5E4` | Viền card/input/divider |
| `borderSubtle` | `#F1F5F9` | Divider rất nhẹ |
| `text` | `#1C1917` | Tiêu đề, nội dung chính |
| `textSecondary` | `#475569` | Chữ phụ đậm vừa |
| `textMuted` | `#78716C` | Mô tả, meta, label |
| `textFaint` | `#A8A29E` | Placeholder, icon phụ, meta rất nhỏ |
| `accent` | `#16A34A` | Nút chính, trạng thái xong, focus, tab active |
| `accentLight` | `#DCFCE7` | Nền chip selected, highlight nhẹ |
| `accentSubtle` | `#F0FDF4` | Nền rất nhạt cho empty state/selected |
| `accentDark` | `#15803D` | Text accent trên nền sáng (dùng khi cần contrast) |

### 2.2 Màu — Dark

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `darkBg` | `#09090B` | Nền toàn app |
| `darkSurface` | `#18181B` | Card, AppBar, Drawer, sheet |
| `darkSurfaceSubtle` | `#27272A` | Input, segmented, vùng subtle |
| `darkBorder` | `#27272A` | Viền card/input/divider |
| `darkText` | `#F4F4F5` | Chữ chính |
| `darkTextMuted` | `#A1A1AA` | Chữ phụ |
| `darkTextFaint` | `#71717A` | Placeholder, icon phụ |

### 2.3 Accent & màu chức năng

| Vai trò | Màu |
| --- | --- |
| Accent / primary | `#16A34A` |
| Accent hover (web) | `#15803D` |
| Accent dark mode | vẫn `#16A34A`; text accent trên dark có thể dùng `#4ADE80` nếu cần |
| Trạng thái TODO | `textFaint` (`#A8A29E` / `#71717A`) |
| Trạng thái IN_PROGRESS | `#D97706` (amber-600) |
| Trạng thái DONE | `#16A34A` |
| Nguy hiểm / xoá | `#DC2626` → `#B91C1C`; bg `#FEF2F2` |
| Thông tin / nhắc | accent nhạt `#F0FDF4`, viền accent 20% |
| Lỗi | đỏ `#DC2626`, text lỗi trên nền `#FEF2F2` |

### 2.4 Palette nhóm việc (6 màu, dùng cho chấm màu/đầu việc)

`#16A34A` emerald · `#7C3AED` violet · `#D97706` amber · `#2563EB` blue · `#DC2626` rose · `#0D9488` teal.

### 2.5 Palette ghi chú (8 pastel)

| Key | Nền (light) | Viền/nhấn |
| --- | --- | --- |
| `stone` | `#FAFAF9` | `#E7E5E4` |
| `red` | `#FEF2F2` | `#FECACA` |
| `orange` | `#FFF7ED` | `#FED7AA` |
| `yellow` | `#FEFCE8` | `#FEF08A` |
| `green` | `#F0FDF4` | `#BBF7D0` |
| `blue` | `#EFF6FF` | `#BFDBFE` |
| `violet` | `#FAF5FF` | `#DDD6FE` |
| `pink` | `#FDF2F8` | `#FBCFE8` |

Trong dark mode: nền note = trộn 10% màu viền với `#18181B`; header note = trộn 22%; viền = màu nhấn 35%. Card note vẫn giữ viền màu 1.2 nhưng nền tối.

### 2.6 Typography

Font mobile: **Roboto** (mặc định Android, không khai báo fontFamily). Weight dùng: 400 / 500 / 600 / 700 / 800.

| Vai trò | Size | Weight | Line-height | Letter-spacing | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| Logo/app name (login) | 28 | 800 | ~1.1 | -0.8 | “WeekLoop” |
| Tiêu đề màn (AppBar) | 19 | 800 | 1.2 | -0.5 | Kèm subtitle 11/500 |
| Subtitle AppBar | 11 | 500 | 1.2 | 0 | Màu muted |
| Tiêu đề sheet/settings | 18 | 700–800 | 1.25 | -0.4 | “Chế độ giao diện” |
| Tiêu đề section/card lớn | 16–17 | 700 | 1.3 | -0.2 | Tên tầm nhìn, empty state |
| Tiêu đề thẻ đầu việc | 14 | 700 | 1.25 | 0 | Màu theo nhóm |
| Nội dung việc | 13.5–14.5 | 500 | 1.3–1.4 | 0 | Có thể 3 dòng trong Planner |
| Body/nội dung note | 15 | 400 | 1.6 | 0 | Dễ đọc |
| Tiêu đề note trong card | 14.5 | 700 | 1.3 | -0.2 | Tối đa 2 dòng |
| Meta/label | 10.5–12 | 500–600 | 1.2–1.35 | 0 | Group name, ngày, category |
| Micro/badge | 9.5–10.5 | 600–700 | 1 | 0–0.2 | “Hôm nay”, count |
| Nút | 12.5–16 | 600 | 1.2 | 0 | |
| Tab label | 11.5 | 600–700 | 1 | -0.2 | Bottom nav |
| Section uppercase | 11 | 700 | 1.2 | 0.8 | Drawer “NHÓM CÔNG VIỆC” |

Nguyên tắc: **không dùng quá 3 cỡ trong một card**. Tiêu đề 14–16, body 12.5–14, meta 10.5–11.

### 2.7 Spacing

Thang dùng thật trong app: **2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 100**.

| Ngữ cảnh | Giá trị |
| --- | --- |
| Padding ngang trang | 16 |
| Padding ngang sheet | 20 (settings/agenda) hoặc 24 (thêm việc/tài liệu) |
| Padding dọc trang | 8–12 đầu, 24–100 cuối (chừa FAB/tab) |
| Khoảng giữa card | 10–12 |
| Padding trong card | 12–16 |
| Khoảng giữa section | 8–16 |
| Chiều cao hàng list | 40–56 |

### 2.8 Radius

| Thành phần | Radius |
| --- | --- |
| Bottom sheet | 24 (top) |
| Dialog cập nhật | 20 |
| Card, note, goal card | 16 |
| Input, search, side-task card | 14 |
| Nút, chip, segmented item, resource icon | 10–12 |
| Badge/pill nhỏ | 8 |
| Chip tròn/checkbox | 999 |
| FAB | 16 |
| Logo login | 20 |

### 2.9 Border & shadow

| Token | Giá trị |
| --- | --- |
| Viền mặc định | `0.8px` (mobile) / khuyến nghị web `1px` |
| Viền nhấn/selected | `1.2–1.5px` |
| Viền divider | `1px` (đôi khi 0.6–0.8) |
| `softShadow` | `0 4px 12px rgba(0,0,0,0.04)` |
| `elevatedShadow` | `0 6px 20px rgba(0,0,0,0.08)` |
| Shadow đáy thanh | `0 -2px 10px rgba(0,0,0,0.03)` |
| Glow accent (FAB/send) | `0 2px 8px rgba(22,163,74,0.35)` |
| Shadow sheet note | `0 -4px 20px rgba(0,0,0,0.15)` |

Dark mode: **bỏ softShadow**, giữ viền; chỉ giữ shadow cho lớp nổi (dialog/sheet).

### 2.10 Motion & haptic

| Tương tác | Thời lượng / curve |
| --- | --- |
| Chọn chip/màu | 150–180ms |
| Card fade/opacity | 200–250ms |
| Chuyển tuần (PageView) | 320ms easeInOut |
| Về tuần hiện tại | 350ms easeInOut |
| Bottom sheet | mặc định Material (~250–300ms) |
| Haptic chọn | `selectionClick()` |
| Haptic hành động | `lightImpact()` / `mediumImpact()` khi hoàn thành/xoá |

Web nên tôn trọng `prefers-reduced-motion`; giảm còn 0–120ms.

### 2.11 Iconography

- Bộ icon: **Material Symbols/Icons Rounded** (outlined cho trạng thái thường, filled khi active).
- Size: 11–16 trong meta; 18–22 trong hàng; 24 ở bottom nav; 28 ở FAB; 32–38 ở empty state/logo.
- Icon màu: `textMuted`/`textFaint`; icon hành động accent; icon xoá đỏ.
- Emoji dùng cho ghi chú (12 emoji: 📝 💡 📌 🎯 📚 💼 🎨 🔖 ⭐ 🚀 ❤️ 🌱).
- Không dùng icon đa màu ngoài emoji.

---

## 3. App shell (khung ứng dụng)

### 3.1 Cấu trúc mobile

```
┌──────────────────────────────────────────┐
│ ☰   WeekLoop                      ◐  (H) │  AppBar 56 + status
│     Kế hoạch tuần & Quản lý công việc    │
├──────────────────────────────────────────┤
│  ←  TUẦN HIỆN TẠI        16/11 – 22/11  → │  Week navigator
│         (chạm để về hôm nay)             │
├──────────────────────────────────────────┤
│  [Tất cả nhóm] [Học tập] [Sức khỏe] …    │  Filter chips
│                                          │
│  ┌──────────────┐  ┌──────────────┐      │
│  │ GoalCard     │  │ GoalCard     │      │  Grid 2 cột
│  │ (tự cuộn)    │  │ (tự cuộn)    │      │  cao 340
│  └──────────────┘  └──────────────┘      │
│                                          │
│                              (+) FAB     │
├──────────────────────────────────────────┤
│ Planner  Cần làm  Tầm nhìn  Việc phụ  Ghi chú │ Bottom nav 5 tab
└──────────────────────────────────────────┘
```

### 3.2 AppBar

- Cao mặc định **56** + status bar; nền = `scaffoldBgColor`, elevation 0, không surface tint.
- Trái: icon menu 24 mở Drawer; vùng chạm 48.
- Giữa: **title 19/800** + **subtitle 11/500** xếp dọc, căn trái; title đổi theo tab (WeekLoop / Việc cần làm / Tầm nhìn / Việc phụ / Ghi chú).
- Phải: icon theme 20 (toggle sáng/tối) + avatar tròn **34** nền accent 10%, chữ cái đầu 14/800 accent; padding phải 12.
- Không có back button ở màn chính; màn phụ (quên mật khẩu) dùng AppBar riêng có back.

### 3.3 Bottom navigation

- 5 tab cố định, luôn hiện: **Planner · Cần làm · Tầm nhìn · Việc phụ · Ghi chú**.
- `BottomNavigationBarType.fixed`; icon 24; label 11.5; selected accent, unselected muted.
- Nền `cardBgColor`; viền trên 0.8; shadow `0 -2px 10px rgba(0,0,0,0.03)`.
- Label agenda trên mobile rút gọn **“Cần làm”** để không xuống dòng; title đầy đủ “Việc cần làm” nằm ở AppBar.
- Tab không có FAB: Agenda, Tầm nhìn, Việc phụ (Agenda thêm việc bằng nút trong từng thẻ).

### 3.4 Drawer (menu trái)

- Rộng mặc định Material **304**; nền `cardBgColor`; không bo.
- Header profile: padding 20/20/16, avatar gradient 44, tên 15/700, email 12 muted; divider dưới.
- Section “NHÓM CÔNG VIỆC”: label 11/700 letter-spacing 0.8, nút + accent; danh sách ListTile dense, chấm màu 10, tên 14/500; icon sửa/lưu trữ 16.
- Divider.
- Section “TIỆN ÍCH”: Tài liệu & Link, Thùng rác, Ngôn ngữ, Giao diện, Kiểm tra cập nhật. Mỗi hàng: icon 20 muted + text 14/500 + trailing badge nhỏ (ngôn ngữ/giao diện).
- Cuối: Đăng xuất đỏ + version `v1.4.0+12` 11 faint.

### 3.5 FAB

- Chỉ Planner (thêm việc) và Ghi chú (tạo note). FAB Material 56, radius 16, nền accent, icon trắng 28, elevation 3.
- Vị trí mặc định bottom-right, cách bottom nav 16; danh sách phía sau chừa padding bottom 100.

### 3.6 Week navigator (dùng chung Planner + Agenda)

- Card nền surface, margin ngang 16, trên/dưới 8, padding 8/6, radius 16, viền 0.8, soft shadow.
- Trái/phải: nút chevron 40×40 nền `subtleBgColor`, radius 10.
- Giữa: dòng trên 10/700 letter-spacing 0.8 (`TUẦN HIỆN TẠI` / `TUẦN ĐÃ QUA` / `TUẦN SẮP TỚI`) + dot 6 accent; dòng dưới 14/800 `16/11 – 22/11`; nếu không phải tuần hiện tại có chip “Về hôm nay” 10/700 accent trên nền accent 12%, radius 8.
- Chạm giữa = về tuần hiện tại.
- Trạng thái tuần: hiện tại = accent; cũ = muted; tương lai = muted.

---

## 4. Planner

### 4.1 Cây layout

```
WeekNavigatorBar
Vision filter chips (nếu có tầm nhìn)
“Sắp xếp ưu tiên” (nếu >1 nhóm)
PageView tuần (vuốt ngang, mở quanh tuần đang chọn)
  └ GridView thẻ đầu việc
```

### 4.2 Lưới thẻ

- Padding: 12 trái/phải, 8 trên, **100 dưới** (chừa FAB).
- Số cột: `floor((width - 20) / 150).clamp(1, 4)`.
  - 320–390px → **2 cột**; 600px → 3–4 cột; text scale > 1.6 → **1 cột**.
- Khoảng cách: 12 ngang, 12 dọc.
- Chiều cao mỗi thẻ: **340 × textScale.clamp(1.0, 2.0)**; nội dung danh sách tự cuộn bên trong, không làm thẻ cao lên.
- Thẻ compact: `GoalCard(compact: true)`.

### 4.3 Thẻ đầu việc (GoalCard)

```
┌──────────────────────────────┐
│ ● Học tiếng Nhật       🗑     │  header tint 6% màu nhóm
│ 5 việc                       │  11 muted
├──────────────────────────────┤
│ Nhiệm vụ 1              📝   │  row 10 dọc
│ Nhiệm vụ 2                   │  (tap mở chi tiết)
│ …                            │  list tự cuộn
├──────────────────────────────┤
│ + Thêm công việc…       ↑    │  add row
└──────────────────────────────┘
```

| Phần | Spec |
| --- | --- |
| Container | surface, radius 16, viền `border` 0.8, soft shadow; margin 0 vì nằm trong grid |
| Header compact | padding 10/10/4/4; nền màu nhóm 6%; radius top 16; tên nhóm 14/700 màu nhóm, tối đa 2 dòng; dòng dưới “5 việc” 11 muted + icon xoá nhóm 20 |
| Divider | 1px `border` |
| Danh sách | ListView tự cuộn, row padding ngang 10, dọc 10; divider indent 48 |
| Row | text 14/500, tối đa 3 dòng (ellipsis); icon note 15 nếu có; tuần cũ có nút “dời sang tuần này” 18 accent |
| Add row | viền trên 0.8; padding 8/6; icon + nếu non-compact; TextField hint 13.5; nút gửi 28×28, nền accent 10%, icon 18 accent |
| Empty | “Chưa có công việc nào. Thêm công việc bên dưới...” 13 italic faint |

- **Không còn status** trong Planner: không nút tròn, không gạch ngang, không làm mờ việc xong.
- Badge header = **tổng số việc** (`5 việc`), không phải số còn lại.
- Nhóm ở tuần cũ: header hiện badge “Tuần cũ” thay cho count; add row ẩn; nút dời hiện cho mọi việc.
- Chạm row mở `TaskDetailSheet` **không có hàng Trạng thái** (chỉ sửa nội dung/ghi chú, xoá, dời tuần).

### 4.4 Empty state Planner (khi chưa có nhóm)

- Vòng tròn 72 nền accent 8%, viền accent 20%, icon lịch 36 accent.
- Tiêu đề 17/700; mô tả 13/1.5 muted; nút “Tạo nhóm đầu tiên” accent, padding 22/12, radius 14.

### 4.5 Task detail sheet (dùng chung)

- `showModalBottomSheet(isScrollControlled: true)` + `DraggableScrollableSheet`:
  - initial 0.65, min 0.4, max 0.92 chiều cao màn hình.
- Container surface, radius top 24; handle 36×4; header padding ngang 20; chip nhóm: nền màu nhóm 10%, viền 30%, radius 12, chấm 8 + tên 12/600; nút đóng.
- Nội dung cuộn, padding ngang 20:
  - Nếu tuần cũ: banner “Công việc thuộc tuần cũ…” 12.5 muted, nền subtle, radius 12.
  - Tên việc: TextField 20/700, không viền.
  - **Trạng thái** (chỉ khi mở từ Agenda): 3 ô đều nhau, padding dọc 12, radius 12, icon 18 + label 12; selected nền màu 10%, viền 1.5.
  - Ghi chú: label 12/600 letter-spacing 0.5; TextField 14/1.5, nền subtle, radius 12, min 3 dòng.
  - Hàng nút: Xoá (outlined đỏ) + dời tuần (menu) + Lưu (filled accent).
  - Tuần cũ: chỉ dời tuần này/sau, không xoá.

---

## 5. Việc cần làm (Agenda)

### 5.1 Cây layout

```
WeekNavigatorBar
ListView (padding 12/0/12/100)
  ├ Progress card (nếu có việc)
  ├ Read-only banner (tuần cũ)
  ├ Unscheduled card (“Chưa xếp thứ”)
  ├ Day card T2
  ├ Day card T3
  ├ …
  └ Day card CN
```

### 5.2 Progress card

- Container surface, radius 14, viền 0.8, padding 14/10/10/10, margin bottom 10.
- Trái: `3/10 đã xong` 12 muted + `30%` 12.5/700 text; dưới là progress bar **4px**, nền border, fill accent, radius 4.
- Phải: toggle “Ẩn việc đã xong” (icon checkbox 16 + label 11.5/600), chỉ hiện khi có việc xong.
- Không dùng card riêng cho progress; nó là một dải mỏng, không chiếm spotlight.

### 5.3 Hàng đợi “Chưa xếp thứ”

- Card surface thường (không dashed như bản web), radius 16, viền 0.8.
- Header padding 12/10/8/2: icon inbox 16 muted + tiêu đề 14/700 + badge count 10.5; bên phải nút **“Tự xếp lịch”** (icon auto_awesome 14 + text 12/600 accent, chỉ hiện khi còn việc chưa xong).
- Hint 11/1.35 faint.
- Divider.
- Danh sách row (không có drag/remove), padding ngang 6, dọc 6.
- Nếu rỗng: text 12 italic faint.
- Footer (tuần hiện tại/tương lai): divider + nút “Thêm việc” 12.5/600 accent, padding dọc 10.

### 5.4 Thẻ thứ

- Mỗi thứ một card; thứ hôm nay viền **1.2 accent** thay vì 0.8 border; vẫn radius 16 và soft shadow.
- Header padding 12/9/10/8:
  - `T2` 14/800; ngày `16/11` 11 muted; chip “Hôm nay” 9.5/700 accent trên nền accent 12%, radius 999.
  - Phải: badge `2/5` (done/total) 10.5/700 muted, nền subtle, viền.
- Divider.
- Danh sách:
  - 1 việc → Column thường.
  - ≥2 việc → `ReorderableListView` (shrinkWrap, không cuộn riêng) với tay cầm kéo.
  - Ẩn việc xong → không kéo, render Column.
- Empty: “Chưa có việc nào.” hoặc “Đã xong hết việc của ngày này.” 12 italic faint.
- Footer “Thêm việc” như hàng đợi.

### 5.5 Row việc (AgendaTaskRow)

```
⠿  ○  Ôn từ vựng 30 phút              📅  📅✕
       ● Học tiếng Nhật  ↻ T2 · T4 · T6  📝
```

| Phần | Spec |
| --- | --- |
| Drag handle | vùng 24×30, icon 16 faint, opacity 0.45; chỉ trong thẻ thứ, khi ≥2 việc và không ẩn done |
| Status | icon 21: TODO `radio_button_unchecked` faint; IN_PROGRESS `schedule` amber; DONE `check_circle` accent; tap đổi trạng thái, tooltip trạng thái kế tiếp |
| Nội dung | 13.5/500/1.35; done: faint + gạch ngang |
| Meta | chấm nhóm 6 + tên nhóm 10.5 faint; `↻ T2 · T4` 10.5; icon note 11 nếu có |
| Nút ngày | icon lịch 15, vùng chạm 28; mở bottom sheet chọn thứ |
| Nút bỏ khỏi thứ | icon `event_busy` 15, chỉ hiện với việc đã xếp; gỡ đúng ngày, không xoá task |
| Row padding | ngang 6, dọc 2; hit target toàn hàng mở detail |

### 5.6 Composer thêm việc (bottom sheet)

- `showModalBottomSheet` scroll-controlled; container radius top 24; maxHeight **0.82 màn hình**; nền surface; handle 36×4.
- Header: tiêu đề 17/700 (`Thêm việc · T3 18/11` hoặc `Thêm việc chưa xếp thứ`) + nút X.
- Dropdown đầu việc: `InputDecoration` label + border 12, nền subtle, padding 14/10; mỗi item chấm màu 9 + tên 14.
- Khi mở cho một thứ: section “Việc đã có trong Planner” 11/700 letter-spacing 0.6 muted + badge count 11; danh sách max-height **186**, nền subtle, radius 12, viền; row 10/9: icon + 7 + text 13 + nhãn ngày 10.5; bấm là thêm ngày vào task có sẵn (không tạo bản copy).
- Ô nhập: hint 13.5; input radius 12, nền subtle, padding 14/12; nút thêm 54×48 accent radius 12; keyboard đẩy sheet lên.
- Sheet giữ mở sau khi thêm để thêm tiếp; danh sách tự cập nhật realtime.

### 5.7 Day picker (chọn nhiều thứ)

- Bottom sheet radius 24, padding 20, handle.
- Tiêu đề “Chọn thứ” 17/700 + nút “Chọn cả tuần” 12 accent.
- 7 `FilterChip` xếp Wrap, gap 8; selected: nền `accentLight`, viền accent, checkmark accentDark; unselected: viền border.
- Footer: “Bỏ hết thứ” 12.5 muted; “Áp dụng” filled accent, padding 22/10, radius 12.
- Bấm ra ngoài = huỷ (khác web bấm ra ngoài = lưu). Nếu port web, nên giữ hành vi web hoặc thống nhất.

### 5.8 Trạng thái tuần cũ

- Banner read-only: nền subtle, radius 12, icon history 16 + text 12 muted (`Tuần cũ chỉ xem...`).
- Không progress toggle? Vẫn hiện progress; không auto, không thêm, không kéo, không chọn thứ, không nút bỏ; row chỉ mở chi tiết (chỉ dời tuần, không xoá).

### 5.9 Tự xếp lịch

- Chỉ hiện khi còn việc chưa xong & chưa có thứ; một cú bấm áp dụng ngay.
- Toast/SnackBar “Đã tự xếp N việc vào các thứ.” 5 giây + **Hoàn tác** (ghi lại daysOfWeek cũ).
- Luật: IN_PROGRESS vào ngày sớm nhất; TODO rải ngày ít việc nhất; bắt đầu từ hôm nay (tuần này) hoặc T2 (tuần sau); không giới hạn việc/ngày.

---

## 6. Ghi chú

### 6.1 Màn danh sách

```
Padding 16/10/16/8
┌──────────────────────────────┐
│ 🔍 Tìm kiếm tiêu đề, nội dung…│  search card radius 14
└──────────────────────────────┘
[ Tất cả ] [Ý tưởng] [Công việc] …    chips 38
┌────────────┐  ┌────────────┐
│ note card  │  │ note card  │        masonry 2 cột
└────────────┘  └────────────┘
```

- Search: card trắng, radius 14, viền 0.8, soft shadow, padding 14/12; icon search 20 muted; hint 13.5 faint; nút clear 18.
- Category chips: cao 38, padding ngang 16, gap 8; `ChoiceChip` radius 12; selected nền accent 12%, viền accent 1.2, label 12.5/700 accent; unselected nền card, viền border 0.8, label muted 500.
- Masonry: **2 cột cố định**, gap 12, padding 16/4/16/100; chia cột theo chiều cao ước lượng (title 24, mỗi ~22 ký tự content = 16). Web nên dùng CSS columns/`grid-template-rows: masonry` (fallback CSS columns).
- Card note: surface, radius 16, viền **1.2 màu pastel**, soft shadow, padding 14.
  - Header: badge emoji 32×32 radius 10 nền pastel + viền pastel 0.8 + emoji 16; category pill 8/3 radius 8, text 10.5/600.
  - Title 14.5/700 -0.2, max 2 dòng.
  - Content 12.5/1.4 muted, max 6 dòng.
  - Footer: icon schedule 12 faint + `dd/MM` 11 faint.
- Empty: vòng 64 accent 8%, icon sticky note 32 accent, text 15/600 1.5.
- Search rỗng/filter rỗng: “Không tìm thấy ghi chú phù hợp.”

### 6.2 Editor (bottom sheet 88%)

- Cao **0.88 màn hình**, radius top 24, nền pastel theo màu note (light) / màu trộn tối (dark), shadow `0 -4 20 rgba(0,0,0,.15)`.
- Header gradient từ màu pastel đậm → nền sheet; handle 36×4; hàng 8 chấm màu 28/22 selected; metadata row: nút emoji + dropdown arrow 18, 5 chip category (cao 36, radius 10).
- Nội dung: padding 20/8/20/16; title 22/700 -0.3; divider màu pastel; body 15/1.6; min 8 dòng.
- Bottom dock: nền card, viền trên 0.9 pastel, shadow nhẹ; Xoá (outlined đỏ, radius 12), Hủy (outlined), Lưu/Cập nhật (filled accent, radius 12); SafeArea bottom.
- Icon picker: bottom sheet nhỏ radius 20, grid 6 cột, ô 56 (grid spacing 12), selected nền accent 12% + viền 1.5.

---

## 7. Việc phụ

```
Padding top 8
ListView 16/4/16/20, gap 8
┌──────────────────────────────┐
│ ○  Mua sữa tươi          ✎   │  card radius 14
└──────────────────────────────┘
…
┌──────────────────────────────┐
│ + Thêm việc lặt vặt…     [➤] │  capture dock
└──────────────────────────────┘
```

- Card: surface, radius 14, viền 0.8, soft shadow (dark: không shadow), padding 14/12; checkbox tròn 24 (accent khi xong, viền `#CBD5E1` 1.8); text 14.5/500/1.3; icon sửa 18 faint.
- Tương tác: chạm card/checkbox = hoàn thành + **xoá sau 350ms** (fade opacity 0.4, gạch ngang), SnackBar 4s + Hoàn tác; vuốt trái = xoá ngay + Hoàn tác; nhấn giữ = sửa tên.
- Capture dock: viền trên 0.8, padding 16/10/16/(12 + keyboard), nền surface; input nền subtle radius 14, icon add_task 20, hint 13.5; nút gửi 44×44 accent radius 14, icon send 20 trắng, glow accent 35%.
- Empty: vòng 64 accent 8%, icon task_alt 32, title 15/600, mô tả 13 muted.

---

## 8. Tầm nhìn

- ListView padding 16/12/16/24.
- Nút “Tầm nhìn mới”: FilledButton accent, icon add, padding mặc định.
- Card: surface, radius 16, viền 1, padding 14/12/14/8; title 16/700; outcome 14 muted 1.35; horizon 12 faint.
- Nhóm thuộc tầm nhìn: ListTile dense, chấm màu 10, tên nhóm, nút gỡ X 18.
- Dropdown “Gán nhóm việc” cho nhóm chưa thuộc tầm nhìn.
- Empty: text 14 muted 1.4.
- Đây là màn **ít được trau chuốt nhất**; khi port web nên nâng cấp theo ngôn ngữ card của Planner (header màu, empty state, spacing).

---

## 9. Auth (Đăng nhập / Quên mật khẩu)

### 9.1 Login

- `Scaffold` nền bg; `SafeArea`; `Center` + `SingleChildScrollView` padding 24/32; **maxWidth 440**.
- Trên cùng phải: language pill (nền subtle, radius 20, padding 3, 2 item padding 10/5, item active nền card + shadow 0 1 4 8%, text 12/700 accent).
- Logo: 68×68, gradient `#16A34A → #0D9488` chéo, radius 20, icon check 38 trắng, shadow accent 35% blur 16 y4.
- App name 28/800 -0.8; tagline 14 muted; gap 32.
- Segmented Login/Signup: container nền subtle, radius 14, viền 0.8, padding 4; item padding dọc 10, radius 10, active nền card + shadow 0 1 4 5%, text 13.5/700 accent.
- Field: `TextFormField` với `OutlineInputBorder()` **radius 4** (khác phần còn lại!), prefix icon 24, label; gap 16.
- Nút chính: filled `#16A34A`, padding dọc 16, radius 10, text 16 bold.
- Divider “HOẶC” 12 grey; nút Google outlined padding dọc 14, radius 10, icon 20.
- TextButton chuyển mode 13 accent.
- **Nên sửa khi port web:** đổi field login sang radius 12–14 cho đồng bộ.

### 9.2 Quên mật khẩu

- AppBar riêng, title 18/700.
- Nội dung maxWidth 440, padding 24/32; icon lock_reset 56 accent; title 24/800; mô tả 14 muted 1.5; field email radius 12; nút gửi filled accent.
- Trạng thái gửi: icon check circle 56 accent, title 24/800, mô tả 14 muted, nút quay lại.

---

## 10. Sheet, dialog & settings

### 10.1 Bottom sheet — anatomy chung

```
        ▁▁▁▁  (36×4, radius 2, border)
  Tiêu đề 18/700                          ✕
  nội dung padding 20–24
  …
  [ hành động chính ]  (filled accent)
```

- Nền `cardBgColor`, radius top 24, không surface tint, barrier đen 54%.
- Handle 36×4 màu border, margin top 12–16.
- Title 18/700–800, letter-spacing -0.4.
- Padding ngang 20 (settings/agenda) hoặc 24 (thêm việc/tài liệu); bottom = `viewInsets.bottom + 20/24`.
- Modal luôn `isScrollControlled: true`, `backgroundColor: Colors.transparent`.

### 10.2 Các sheet đã dùng

| Sheet | Spec |
| --- | --- |
| Chọn giao diện | 3 option card radius 16, padding 16/14, icon tròn 34 (nền accent nếu selected), title 15/700, subtitle 12 muted, check 20; selected nền accent 10%, viền 1.5 |
| Chọn ngôn ngữ | option 2 dòng, flag 24, title 15/600, subtitle 12 muted, radio/check 22; selected nền accent 8%, viền 1.5 |
| Tài liệu & Link | DraggableSheet initial 0.75/min 0.4/max 0.95; header 20/12/12; tile 42 icon link, title 14/600, link 12 accent, description 12 muted, open icon 18; swipe trái xoá + undo 5s |
| Thùng rác | DraggableSheet 0.6/0.35/0.9; header icon thùng 24 + title 18/700; info banner accent 8% radius 10; hàng ListTile chấm màu 10, title 15/600, subtitle 12 muted, nút Khôi phục filled accent + xoá vĩnh viễn icon đỏ 20 (AlertDialog xác nhận) |
| Sắp xếp ưu tiên | Cao 75% màn hình; title titleLarge; mô tả; ReorderableListView; số thứ tự trong CircleAvatar accent 10%; tay cầm drag_handle 48×48; nút Lưu |
| Chọn icon note | Grid 6 cột, ô 56, radius 12, selected accent 12% + viền 1.5 |

### 10.3 Dialog cập nhật

- Dialog radius **20**, nền surface, padding 24, inset 24.
- Header: icon 48×48 nền accent 12% radius 14 + title 18/700 + version 13/600 accent.
- Version comparison pill nền subtle radius 10, viền 1, text 12.
- Progress bar 6–8px accent; nút “Cập nhật ngay” filled accent; “Để sau” text.
- Không dismiss khi đang tải.

### 10.4 SnackBar

- Nền mặc định Material dark; text trắng 14; action “HOÀN TÁC” accent (hoặc trắng); duration 4–5s.
- Luôn `clearSnackBars()` trước khi hiện snackbar mới để tránh xếp chồng.
- Dùng cho: xoá việc phụ, xoá note, xoá resource, bỏ khỏi thứ, tự xếp lịch, dời tuần.

---

## 11. Component anatomy & states

| Component | Default | Selected / Active | Disabled | Ghi chú |
| --- | --- | --- | --- | --- |
| Filled button | accent, text trắng, radius 12–14, padding 16/10–12 | hover darken 10% (web) | opacity 0.5, no fill | Hành động chính |
| Outlined button | viền border, text text/muted | — | opacity 0.5 | Hủy, xoá (viền đỏ) |
| Text button | text accent/muted | — | opacity 0.5 | Link phụ |
| Icon button | icon 18–22 | nền subtle khi hover | disabled faint | Vùng chạm ≥40 |
| Input | nền subtle, viền 1, radius 14, padding 16/12 | viền accent 1.5 | fill bgAlt, text faint | Label/hint 13.5–14 |
| Chip | nền card, viền 0.8, radius 12, text 12.5/500 | nền accent 12%, viền accent, text accent 700 | — | ChoiceChip |
| Card | surface, viền 0.8, radius 16, shadow soft | viền accent nếu “hôm nay” | — | Dark: bỏ shadow |
| Badge count | nền subtle, radius 8, text 10.5/700 | — | — | “5”, “2/5” |
| Today chip | nền accent 12%, radius 999, text 9.5/700 accent | — | — | “Hôm nay” |
| Progress bar | track border, fill accent, cao 4 | — | — | Determinate |
| Checkbox tròn | viền `#CBD5E1` 1.8 | accent, check trắng | — | Việc phụ |
| Drag handle | icon faint opacity 0.45 | opacity 1 khi kéo | ẩn khi hideDone/past | Agenda/priority |
| Empty state | vòng 64–72 accent 8%, icon 32–36, title 15–17/700, body 13–14 | — | — | Không illustration |
| Loading | CircularProgressIndicator accent stroke 2.5 | — | — | Không skeleton |
| Error | text `Lỗi: …` đỏ | — | — | Thô, nên cải thiện web |

---

## 12. Responsive & adaptive (hiện tại)

| Khu vực | Hành vi hiện tại |
| --- | --- |
| Toàn app | Thiết kế cho phone; không có layout tablet/web riêng |
| Planner grid | Tính cột theo bề rộng: `((w-20)/150).floor().clamp(1,4)`; textScale > 1.6 → 1 cột; card cao 340×scale |
| Agenda | Luôn 1 cột dọc, 7 thẻ thứ xếp lần lượt; không lưới ngang |
| Notes | Luôn 2 cột masonry |
| Login/forgot | Max width 440, căn giữa |
| Sheet | Luôn bottom sheet; chưa có side sheet/desktop dialog |
| Navigation | Bottom nav + Drawer; không sidebar |

**Hệ quả khi lên web:** nếu chỉ kéo giãn layout mobile, Agenda sẽ rất dài và Planner card sẽ quá to. Cần breakpoint + lưới ngang cho Agenda (như bản web hiện tại: 4 → 3 → 2 → 1 cột).

---

## 13. Dark mode

- Chuyển bằng `ThemeMode` (light/dark/system), lưu local; toggle ở AppBar và Drawer.
- Nền `#09090B`, card `#18181B`, input `#27272A`, viền `#27272A`, chữ `#F4F4F5` / `#A1A1AA`.
- **Bỏ shadow card**; chỉ giữ viền. Bottom nav vẫn có shadow rất nhẹ.
- Note: nền/hiệu ứng pastel được trộn với `#18181B` (10%/22%) và viền màu 35%; không dùng pastel sáng nguyên bản.
- Accent giữ `#16A34A`; nếu chữ accent trên nền tối khó đọc, dùng `#4ADE80` cho text nhỏ.
- Login gradient giữ nguyên; tránh dùng trắng tinh trên nền đen tuyệt đối.
- Web: dùng `data-theme="dark"` + CSS variables; tôn trọng `prefers-color-scheme` khi mode = system.

---

## 14. Accessibility & usability

### 14.1 Điểm tốt

- Hầu hết nút chính ≥44; sheet có handle; label tiếng Việt rõ.
- Có empty state, loading, error; có Hoàn tác cho xoá.
- Text scale lớn: Planner tự chuyển 1 cột; card cao theo scale.
- Màu trạng thái không chỉ dựa vào màu: icon khác nhau (tròn/schedule/check) + gạch ngang.

### 14.2 Vấn đề cần xử lý khi lên web

| Vấn đề | Chi tiết | Cách sửa |
| --- | --- | --- |
| Contrast accent | `#16A34A` trên trắng ~3.2:1, không đạt AA cho text nhỏ | Dùng `#15803D` cho text accent trên nền sáng; giữ `#16A34A` cho fill/icon lớn |
| Text faint | `#A8A29E` trên trắng ~2.4:1 | Chỉ dùng cho meta trang trí; label quan trọng dùng muted `#78716C` |
| Hit target nhỏ | Nút lịch/bỏ ngày 28×28, drag 24×30; Material khuyến nghị **48×48** | Web: hit area 40–44; mobile nới hit area lên 44–48 dù icon vẫn nhỏ |
| Icon-only thiếu label | Một số nút chỉ có icon, chưa có Semantics/tooltip | Thêm `aria-label`/`semanticsLabel` cho mọi nút icon (kể cả drag handle) |
| Fixed card height | Planner 340 có thể cắt khi zoom 200% | Web dùng `min-height`, không fixed; hoặc tăng theo scale |
| Bottom nav label | “Việc cần làm” bị rút “Cần làm” | Web sidebar dùng label đầy đủ; mobile giữ rút gọn |
| Drag-only reorder | Không có alternative bàn phím | Web thêm nút lên/xuống hoặc Alt+↑/↓ |
| Không có focus ring | App mobile không cần | Web thêm `:focus-visible` 2px accent, offset 2 |
| SnackBar thấp | Có thể bị bottom nav che | Web toast đặt trên tab bar; mobile đã có scaffold xử lý |

### 14.3 Tiếng Việt

- Dùng line-height ≥1.3 cho tiêu đề, 1.5–1.6 cho body.
- Tránh `letter-spacing` âm quá lớn cho chữ có dấu; mobile dùng -0.2 → -0.5 ở cỡ lớn.
- Label dài: “Việc cần làm”, “Chưa xếp thứ”, “Tự xếp lịch” cần chỗ; web sidebar 240–260px đủ.

---

## 15. Blueprint port sang web

### 15.1 Chọn skin: 3 phương án

| Phương án | Mô tả | Ưu / nhược |
| --- | --- | --- |
| **A. Faithful mobile** | Xanh `#16A34A`, nền `#FAFAF9`, radius 16, Roboto, soft shadow | Giống app nhất; nhưng lệch web hiện tại (indigo/Inter/flat) và shadow nhiều trên web |
| **B. Hybrid (khuyến nghị)** | Giữ **layout + density + radius 16 + accent xanh**; dùng **Inter**, viền 1px, shadow rất nhẹ hoặc bỏ | Đồng bộ thương hiệu, web đọc tốt, ít sửa CSS hiện tại |
| **C. Layout-only** | Giữ indigo/Inter/flat 8–12 của web, chỉ copy cấu trúc | Ít rủi ro nhất nhưng không giống app, mất “chất” mobile |

Khuyến nghị **B**: đổi accent sang xanh, giữ Inter, dùng radius 16 cho card, 1px border, shadow chỉ ở lớp nổi. Nếu muốn giữ indigo, đổi `--accent` lại và dùng radius 12–16.

### 15.2 Breakpoints đề xuất

| Breakpoint | Shell | Planner | Agenda | Notes |
| --- | --- | --- | --- | --- |
| `< 640px` | Top bar + bottom tab bar 5 tab; drawer cho phụ | 1–2 cột (min 240) | 1 cột dọc | 2 cột |
| `640–1023px` | Sidebar icon rail 72–88 hoặc sidebar 220 | 2–3 cột | 2 cột | 2–3 cột |
| `1024–1439px` | Sidebar 240–260 + top bar | 3 cột | 3 cột | 3 cột |
| `≥ 1440px` | Sidebar 260 + content max 1440 | 3–4 cột | 4 cột | 4 cột |

Giữ breakpoint **768** của web hiện tại nếu muốn ít sửa: dưới 768 dùng bottom tab, trên 768 dùng sidebar 16rem.

### 15.3 CSS variables đề xuất

```css
:root {
  /* surfaces */
  --bg: #FAFAF9;
  --bg-alt: #F5F5F4;
  --surface: #FFFFFF;
  --surface-subtle: #F8FAFC;
  --border: #E7E5E4;
  --border-subtle: #F1F5F9;

  /* text */
  --text: #1C1917;
  --text-secondary: #475569;
  --text-muted: #78716C;
  --text-faint: #A8A29E;

  /* brand */
  --accent: #16A34A;
  --accent-hover: #15803D;
  --accent-soft: #DCFCE7;
  --accent-ghost: #F0FDF4;
  --accent-contrast: #15803D; /* dùng cho text accent trên nền sáng */

  /* feedback */
  --danger: #DC2626;
  --danger-bg: #FEF2F2;
  --warning: #D97706;

  /* shape */
  --radius-sm: 8px;
  --radius: 12px;
  --radius-card: 16px;
  --radius-sheet: 24px;
  --border-width: 1px;

  /* shadow */
  --shadow-soft: 0 4px 12px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 6px 20px rgba(0, 0, 0, 0.08);
  --shadow-bar: 0 -2px 10px rgba(0, 0, 0, 0.03);

  /* type */
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
}

[data-theme="dark"] {
  --bg: #09090B;
  --bg-alt: #18181B;
  --surface: #18181B;
  --surface-subtle: #27272A;
  --border: #27272A;
  --border-subtle: #27272A;
  --text: #F4F4F5;
  --text-secondary: #D4D4D8;
  --text-muted: #A1A1AA;
  --text-faint: #71717A;
  --accent: #16A34A;
  --accent-hover: #22C55E;
  --accent-soft: rgba(22, 163, 74, 0.18);
  --accent-ghost: rgba(22, 163, 74, 0.10);
  --accent-contrast: #4ADE80;
  --shadow-soft: none;
  --shadow-elevated: 0 6px 20px rgba(0, 0, 0, 0.35);
}
```

### 15.4 Shell CSS

```css
.app-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100dvh;
  background: var(--bg);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100dvh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 20px 16px;
  overflow-y: auto;
}

.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 64px;
  padding: 0 24px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(8px);
}

.content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 24px 32px;
}

@media (max-width: 767px) {
  .app-shell { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .topbar { min-height: 56px; padding: 0 16px; }
  .content { padding: 12px 12px 96px; }
}
```

### 15.5 Mapping component Flutter → web

| Flutter | Web |
| --- | --- |
| `AppBar` | `<header class="topbar">` sticky, cao 56–64 |
| `BottomNavigationBar` | `<nav class="tabbar">` dưới 768; icon + label 11.5 |
| `Drawer` | `<aside class="sidebar">` trên 768; dưới 768 là drawer trượt |
| `FloatingActionButton` | Nút nổi `position: fixed` hoặc nút trong header; giữ radius 16 |
| `Card` | `<article class="card">` surface + 1px border + radius 16 + shadow-soft |
| `ListView.separated` | `display: grid/flex` + `gap`; tránh divider nếu gap đủ |
| `ChoiceChip` | `<button class="chip" aria-pressed>` radius 12 |
| `showModalBottomSheet` | `<dialog>`/`<div role="dialog">`; mobile bottom sheet, desktop center hoặc side panel |
| `DraggableScrollableSheet` | Sheet có `max-height: 90dvh`, header sticky, body scroll |
| `SnackBar` | Toast góc dưới, 4–5s, có action Hoàn tác |
| `AlertDialog` | `<dialog>` nhỏ 400–480, radius 16–20 |
| `TextField` | `<input>`/`<textarea>` nền `--bg-alt`, border 1px, radius 14 |
| `AnimatedContainer` | CSS transition 150–250ms |
| `ReorderableListView` | dnd-kit/HTML5 pointer; lưu `dayOrder` |
| `CircularProgressIndicator` | spinner 20–24, accent |
| `SafeArea` | `env(safe-area-inset-*)` |

### 15.6 Planner trên web

- Grid: `repeat(auto-fill, minmax(260px, 1fr))`, gap 16; card `min-height: 340px`, `display: flex; flex-direction: column`.
- Danh sách trong card: `overflow: auto`, `max-height` phần còn lại; add row dính đáy card.
- Header card nền màu nhóm 6%, tên nhóm 14/700, badge “N việc”.
- Không status. Nút “Dời sang tuần này” ở tuần cũ.
- Week navigator đặt trên top bar (giữa) và dùng chung state `weekStart` với Agenda; có nút prev/next + “Về hôm nay”.
- Vision filter: hàng chip 36–40px dưới top bar, scroll ngang khi hẹp.

### 15.7 Agenda trên web

- Header sticky: tuần + progress + hide done.
- Queue full-width phía trên.
- Grid 7 thẻ:
  ```css
  .agenda-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  @media (max-width: 1199px) { .agenda-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 899px)  { .agenda-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 639px)  { .agenda-grid { grid-template-columns: 1fr; } }
  ```
- Card thứ: header 3 phần (tên + ngày + chip hôm nay | count), list, footer “Thêm việc”.
- Row: grip + status + content/meta + day picker + remove; hover hiện action; focus ring.
- Composer: desktop có thể là popover cạnh thẻ hoặc `<dialog>` nhỏ; mobile bottom sheet.
- Day picker: popover 7 nút + “Chọn cả tuần”/“Bỏ hết thứ”/“Áp dụng”; click ra ngoài = lưu (theo web) hoặc hủy (theo mobile) — chốt một hành vi.
- Drag: pointer events, live reorder, lưu `dayOrder`; thêm nút lên/xuống cho keyboard.
- Auto schedule: một nút trong queue; toast + Hoàn tác.
- Tuần cũ: read-only, banner.

### 15.8 Notes trên web

```css
.notes-masonry {
  columns: 3 260px;
  column-gap: 16px;
}
.note-card {
  break-inside: avoid;
  margin-bottom: 16px;
}
```
- 2 cột < 768, 3 cột 768–1279, 4 cột ≥1280 (hoặc `columns: 4 240px`).
- Search + chip filter giữ nguyên; sticky ở đầu vùng nội dung.
- Note editor: desktop dùng modal 640–720px hoặc side panel; mobile bottom sheet 88%.
- Màu pastel giữ; dark mode dùng màu trộn.

### 15.9 Tương tác & trạng thái web cần thêm

- **Hover:** card `background: color-mix(in srgb, var(--text) 3%, transparent)`; icon action hiện; row agenda hiện nút.
- **Focus-visible:** outline 2px accent, offset 2; không bỏ outline mặc định mà không thay.
- **Active:** scale 0.99 hoặc darker 5%.
- **Loading:** skeleton cho danh sách (mobile chỉ spinner; web nên skeleton).
- **Empty:** dùng đúng empty state mobile (vòng accent + icon + 2 dòng).
- **Toast:** góc dưới phải, 4–5s, action accent; xếp chồng tối đa 1.
- **Keyboard:** Esc đóng dialog/sheet; Enter submit; Alt+↑/↓ đổi thứ tự; tab order hợp lý.
- **URL state:** `?week=2026-11-16&tab=agenda` để chia sẻ/refresh; mobile dùng provider.

### 15.10 Những gì **không** nên copy nguyên

- Bottom nav 5 tab trên desktop (dùng sidebar).
- Fixed card height 340 khi text scale lớn (dùng min-height).
- Bottom sheet cho mọi thứ trên desktop (dùng dialog/popover).
- Nút 28×28 (web cần 40–44 hit area).
- `0.8px` border (web dùng 1px).
- Shadow trên mọi card (web giữ flat hơn).
- Login field radius 4 (lỗi nhất quán).
- Drag-only (thêm keyboard).

---

## 16. Điểm chưa nhất quán / quyết định cần chốt

1. **Skin:** mobile xanh/16/shadow vs web indigo/Inter/flat 8–12. Chọn A/B/C ở §15.1.
2. **Radius input login:** 4px trong khi phần còn lại 12–14. Sửa thành 12–14.
3. **Padding ngang:** trang 16, sheet 20, sheet thêm việc 24. Web nên chuẩn hoá: page 24 (desktop) / 16 (mobile), sheet 24.
4. **Bottom tab label:** “Cần làm” bị rút; web sidebar dùng “Việc cần làm”.
5. **Màu accent text:** `#16A34A` không đạt AA cho chữ nhỏ; dùng `#15803D` cho text.
6. **Note category hardcode tiếng Việt**; web nên đưa vào i18n.
7. **Visions screen** chưa theo ngôn ngữ card của Planner; nên nâng cấp khi port.
8. **Side task tap = complete + delete** khác mô hình checkbox thông thường; web cần mô tả rõ hoặc đổi thành toggle + xoá riêng.
9. **Bottom sheet vs popover** cho day picker; chốt hành vi click-outside.
10. **Shadow/flat:** nếu giữ skin web (C), bỏ shadow card; nếu A/B, giảm shadow trên web để tránh nặng.

---

## 17. Checklist port (thứ tự đề xuất)

- [ ] 1. Chốt skin (A/B/C) và cập nhật CSS variables.
- [ ] 2. Dựng shell: sidebar 260 + topbar 64 + content max 1440; mobile bottom tab 5 + drawer.
- [ ] 3. Dựng component cơ bản: Card, Button, Chip, Input, Badge, EmptyState, Toast.
- [ ] 4. Planner: week nav dùng chung, filter chip, grid card, add row, detail dialog (không status).
- [ ] 5. Agenda: progress, queue, 7 day cards, row, composer, day picker, auto schedule, read-only.
- [ ] 6. Notes: search, chip, masonry, card, editor.
- [ ] 7. Side tasks + Visions + settings sheets + auth.
- [ ] 8. Dark mode + responsive breakpoints.
- [ ] 9. Hover/focus/keyboard + reduced motion.
- [ ] 10. So sánh screenshot mobile 390×844 với web 390/768/1280/1440; kiểm tra tiếng Việt, text scale 200%.
- [ ] 11. Kiểm tra dữ liệu `daysOfWeek`/`dayOrder` giữa web và app.

---

## Phụ lục A — Bảng kích thước nhanh

| Màn / vùng | Giá trị chính |
| --- | --- |
| AppBar | 56 + status; title 19/800; subtitle 11/500; avatar 34 |
| Bottom nav | 5 tab; icon 24; label 11.5; viền trên 0.8 |
| Drawer | 304; header pad 20/20/16; avatar 44; section 11/700 |
| Week nav | margin 16/8; pad 8/6; radius 16; chevron 40; label 10/14 |
| Planner grid | pad 12/8/12/100; gap 12; card 340; 2 cột @390 |
| GoalCard header | pad 10/10/4/4; tên 14/700; tint 6% |
| GoalCard row | pad 10/10; text 14/500; divider indent 48 |
| Agenda page | pad 12/0/12/100; card gap 10 |
| Agenda card | radius 16; viền 0.8 (hôm nay 1.2); header pad 12/9/10/8 |
| Agenda row | status 21; text 13.5; meta 10.5; action 28; grip 24×30 |
| Composer | max 82% screen; pad 20; input 12; add 54×48 |
| Day picker | pad 20; chip wrap gap 8; apply 22/10 |
| Notes | search pad 16/10; chips 38; masonry 2 cột gap 12; card pad 14 |
| Note editor | 88% screen; title 22/700; body 15/1.6; dock pad 20/12 |
| Side tasks | card 14 radius; pad 14/12; send 44×44; gap 8 |
| Login | max 440; pad 24/32; logo 68; field radius 4 (nên sửa 12); button 10 |
| Sheet | radius 24; handle 36×4; title 18/700; pad 20–24 |
| Dialog | radius 20; pad 24; icon 48 |
| Empty | vòng 64–72; icon 32–36; title 15–17; body 13–14 |

## Phụ lục B — Nguồn tham chiếu

| Nhóm | File |
| --- | --- |
| Design token | [`lib/core/theme/app_colors.dart`](../lib/core/theme/app_colors.dart) |
| Theme toàn app | [`lib/main.dart`](../lib/main.dart) |
| App shell / drawer / nav / FAB | [`lib/features/dashboard/presentation/dashboard_screen.dart`](../lib/features/dashboard/presentation/dashboard_screen.dart) |
| Week navigator | [`lib/features/planner/presentation/widgets/week_navigator_bar.dart`](../lib/features/planner/presentation/widgets/week_navigator_bar.dart) |
| Planner grid | [`lib/features/planner/presentation/week_grid_mobile.dart`](../lib/features/planner/presentation/week_grid_mobile.dart) |
| Goal card | [`lib/features/planner/presentation/widgets/goal_card.dart`](../lib/features/planner/presentation/widgets/goal_card.dart) |
| Task detail | [`lib/features/planner/presentation/task_detail_sheet.dart`](../lib/features/planner/presentation/task_detail_sheet.dart) |
| Agenda | [`lib/features/agenda/presentation/agenda_screen.dart`](../lib/features/agenda/presentation/agenda_screen.dart) |
| Agenda row | [`lib/features/agenda/presentation/widgets/agenda_task_row.dart`](../lib/features/agenda/presentation/widgets/agenda_task_row.dart) |
| Composer | [`lib/features/agenda/presentation/widgets/agenda_composer_sheet.dart`](../lib/features/agenda/presentation/widgets/agenda_composer_sheet.dart) |
| Day picker | [`lib/features/agenda/presentation/widgets/agenda_day_picker_sheet.dart`](../lib/features/agenda/presentation/widgets/agenda_day_picker_sheet.dart) |
| Notes | [`lib/features/notes/presentation/notes_screen.dart`](../lib/features/notes/presentation/notes_screen.dart) |
| Note editor | [`lib/features/notes/presentation/note_editor_sheet.dart`](../lib/features/notes/presentation/note_editor_sheet.dart) |
| Side tasks | [`lib/features/dashboard/presentation/widgets/side_panel_tab.dart`](../lib/features/dashboard/presentation/widgets/side_panel_tab.dart) |
| Visions | [`lib/features/visions/presentation/visions_screen.dart`](../lib/features/visions/presentation/visions_screen.dart) |
| Settings / language | [`lib/core/theme/theme_mode_sheet.dart`](../lib/core/theme/theme_mode_sheet.dart), [`lib/core/localization/language_switch_button.dart`](../lib/core/localization/language_switch_button.dart) |
| Resources / trash | [`lib/features/resources/presentation/resources_sheet.dart`](../lib/features/resources/presentation/resources_sheet.dart), [`lib/features/task_groups/presentation/trash_sheet.dart`](../lib/features/task_groups/presentation/trash_sheet.dart) |
| Auth | [`lib/features/auth/presentation/login_screen.dart`](../lib/features/auth/presentation/login_screen.dart) |
| Web skin hiện tại | `weekloop-landing/app/sb-skin.css` và `weekloop-landing/DESIGN.md` (repo web riêng): indigo `#4f46e5`, Inter, flat 1px, radius 8–12 |
