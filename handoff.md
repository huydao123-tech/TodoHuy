# Handoff — WeekLoop, module “Việc cần làm”

> Cập nhật: 18/11/2026 · Nhánh: `main` · Repo: `huydao123-tech/TodoHuy`
> Tài liệu này ghi lại toàn bộ thay đổi đã làm cho app trong phiên làm việc này, dùng để bàn giao cho người/phiên sau.

## 1. Trạng thái repo sau phiên

Năm commit đã push lên `main`:

| Commit | Nội dung |
| --- | --- |
| `2c095fd` | Add weekly to-do agenda with repeat days and auto-planning |
| `5d6294c` | Move task status into the to-do module and reorder tasks by drag |
| `49c7854` | Remove a task from one weekday without deleting it |
| `79689d5` | Add session handoff notes for the weekly to-do module |
| `e143dfc` | List existing planner tasks in the day task composer |

`git log` từ đầu phiên: `64df183` (Merge PR #6 — remove second-brain) → các commit trên → `origin/main` khớp local.

Chưa commit (có từ trước phiên, không thuộc tính năng):
- `skills-lock.json` (sửa) — do cài skill `ui-ux`.
- `.agents/skills/ui-ux/` (thư mục mới).
- `scratch/` — ảnh chụp màn hình kiểm tra tạm.

Phạm vi thay đổi: **chỉ app web `weekloop-landing`** (Next.js 16 + Firebase Firestore). Backend Spring Boot trong `weekloop-backend/` **không đụng tới** vì web app không gọi backend.

---

## 2. Tính năng mới: tab “Việc cần làm”

Thêm **một module màn hình mới** (không thay Planner), nằm ở `/dashboard` với `activeTab = "agenda"`.

### 2.1. Trải nghiệm chính

- Hiển thị **việc cần làm của từng thứ trong tuần**: 7 thẻ T2 → CN của tuần đang xem, cạnh nhau dạng lưới (desktop 4 cột → 3 → 2 → 1 theo bề rộng).
- **Hàng đợi “Chưa xếp thứ”** nằm trên cùng: mọi việc của tuần chưa gán thứ nào (kể cả toàn bộ task cũ chưa từng có ngày) đều nằm đây, kèm nút **“Tự xếp lịch”**.
- **Thêm việc** ngay trong từng thẻ thứ: chọn **đầu việc (task group) từ Planner** + nhập nội dung; việc tạo ra thuộc đúng tuần, đúng thứ và **xuất hiện ngay bên Planner** (dùng chung một nguồn dữ liệu `work_items`).
- Ngay dưới ô chọn đầu việc, composer hiện **“Việc đã có trong Planner”**: danh sách task của đúng đầu việc đó trong tuần đang xem (bỏ qua việc đã xong và việc đã nằm ở thứ đang mở). Bấm một dòng là **thêm ngày đó vào task có sẵn** — không tạo bản copy; task đang ở thứ khác hiện kèm nhãn ngày (`T3·T5`). Vẫn tạo việc mới bằng ô nhập bên dưới; danh sách tự cập nhật sau mỗi lần thêm.
- Việc **có thể lặp ở nhiều thứ** trong tuần bằng ô chọn nhiều thứ (xem mục 2.2).
- **Kéo-thả đổi thứ tự** trong từng thứ (xem mục 2.4).
- Nút **bỏ khỏi thứ này** chỉ gỡ việc khỏi ngày, không xoá (xem mục 2.5).
- Đầu trang: nhãn tuần (`16/11 - 22/11/2026`), tiến độ `xong/tổng + %`, nút ẩn/hiện việc đã xong (chỉ hiện khi có việc xong).
- Tuần trước: chỉ xem (không thêm, không sửa, không kéo, không xoá), có dòng thông báo read-only.
- Chưa có đầu việc nào: trạng thái rỗng có nút mở Planner.

### 2.2. Việc lặp lại nhiều thứ trong tuần

- Bấm ô **📅 ngày** trên dòng → popover 7 nút **T2…CN**; bấm để bật/tắt từng thứ (chọn nhiều cùng lúc).
- Có nút **“Chọn cả tuần”** (bật cả 7 thứ) và **“Bỏ hết thứ”**.
- Chốt bằng **Áp dụng**, hoặc bấm ra ngoài, hoặc bấm lại chính nút đó. **Esc** là huỷ, không lưu.
- Việc đã chọn nhiều thứ xuất hiện ở **tất cả** các thẻ thứ đó. Dưới tên việc có dòng `↻ T3 · T5 · T7` để thấy nhanh các ngày lặp.
- Tiến độ tuần đếm việc lặp **1 lần** (không bị đội số theo số ngày).
- Trạng thái của việc lặp là **một trạng thái chung** cho mọi ngày (một task, một status); tick xong ở một ngày là xong cả task.

### 2.3. “Tự xếp lịch” (auto-schedule)

Chỉ hiện khi còn việc chưa gán thứ chưa xong. Một cú bấm, áp dụng ngay, có toast + **Hoàn tác**.

Luật hiện tại:
- Chỉ xếp việc **chưa xong** và **chưa có thứ nào**.
- Tuần này: bắt đầu từ **hôm nay** trở đi; tuần sau: từ **Thứ 2**. Tuần cũ không cho chạy.
- **Việc đang làm** (`IN_PROGRESS`) đặt vào ngày sớm nhất còn chỗ (để làm tiếp).
- **Việc cần làm** (`TODO`) rải vào ngày **ít việc nhất**, bằng nhau thì lấy ngày sớm hơn; xét theo thứ tự ưu tiên đầu việc ở Planner.
- Việc đã xếp sẵn (kể cả việc lặp nhiều ngày) vẫn được tính vào tải của từng ngày để không dồn thêm.
- **Không giới hạn số việc mỗi ngày** (đã bỏ cap 3 việc/ngày theo yêu cầu).
- Lưu bằng **một batch Firestore**; Hoàn tác trả lại đúng danh sách thứ cũ (kể cả về hàng đợi).

### 2.4. Kéo-thả đổi thứ tự trong một thứ

- Mỗi dòng trong thẻ thứ có **tay cầm ⠿** bên trái (mờ 0.3, rõ lên khi rê vào hoặc chạm).
- Dùng **Pointer Events** nên chạy được **cả chuột lẫn cảm ứng**, không thêm thư viện DnD.
- Kéo dọc trong cùng một ngày; danh sách cập nhật ngay khi kéo (live reorder), thả tay là lưu.
- Thứ tự lưu **riêng cho từng thứ** trong field `dayOrder` của task, nên cùng một việc lặp có thể nằm vị trí khác nhau ở mỗi ngày.
- Việc đã xong vẫn kéo được (thứ tự tay thắng thứ tự trạng thái). Khi bật “Ẩn việc đã xong” thì tạm ẩn tay cầm để tránh kéo trên danh sách đã lọc.
- Không kéo được ở tuần cũ.

### 2.5. Bỏ khỏi một thứ ≠ xoá việc

- Nút **📅✕ “Bỏ khỏi thứ này”** trên dòng (hiện khi rê vào, cạnh ô chọn thứ) chỉ **gỡ đúng ngày đó** khỏi `daysOfWeek`:
  - việc vẫn còn trong Planner,
  - vẫn còn ở các thứ khác,
  - nếu là thứ duy nhất → việc quay về hàng đợi “Chưa xếp thứ” (không bị xoá).
  - Có toast + Hoàn tác.
- **Đã bỏ toàn bộ nút thùng rác trên các dòng** (cả thẻ thứ lẫn hàng đợi) để tránh xoá nhầm làm Planner mất việc.
- Muốn **xoá hẳn** khỏi Planner: mở **Chi tiết công việc** → **Xóa** → bấm lần nữa để xác nhận. Chỉ hành động này mới xoá task khỏi Firestore.

---

## 3. Thay đổi ở Planner và các màn khác

### 3.1. Planner bỏ hẳn trạng thái

- Trong [WeekGrid.tsx](weekloop-landing/components/app/WeekGrid.tsx): bỏ nút tròn trạng thái, bỏ gạch ngang việc đã xong, bỏ hàm cycle status, bỏ prop `onCycleStatus`.
- Badge trên thẻ đầu việc giờ là **tổng số việc** (trước là số việc chưa xong).
- Nút “Dời sang tuần này” ở tuần cũ giờ hiện cho **mọi** việc (trước lọc theo status).
- **TaskDetailModal** có thêm prop `showStatus` (mặc định `true`): Planner truyền `false` → hộp chi tiết mở từ Planner **không còn hàng “Trạng thái”**; agenda vẫn hiện và đổi được trạng thái.
- `status` vẫn tồn tại trong dữ liệu vì agenda/Tầm nhìn dùng; Planner **không đọc/không hiển thị** nữa.
- Tab **Tầm nhìn** (`VisionsBoard`) vẫn đang hiển thị status và lọc việc chưa xong — chưa đụng trong phiên này (nếu muốn bỏ luôn thì nói).

### 3.2. Shell / điều hướng

- Sidebar trái có mục mới **“Việc cần làm”** (icon `ListChecks`) kèm badge số việc chưa xong của tuần đang xem.
- Thanh chuyển tuần trên top bar dùng chung cho Planner và Việc cần làm (cùng `viewOffset`).
- Thanh tab dưới (mobile) thành 5 tab: Planner · Việc cần làm · Tầm nhìn · Ghi chú · Danh mục. **Bỏ tab “Việc phụ”** khỏi thanh dưới để đủ chỗ; nút mở Việc phụ trên top bar (chỉ ở Planner) vẫn còn.
- `#agenda-view` được thêm vào layout app shell (`app/sb-skin.css`) và padding bottom cho mobile.

---

## 4. Thay đổi dữ liệu (Firestore `users/{uid}/work_items`)

Task vẫn là một document trong `work_items`; thêm/sửa các field:

| Field | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `daysOfWeek` | `number[]` | Các thứ việc được làm (1 = Thứ 2 … 7 = Chủ nhật). Rỗng = chưa xếp. |
| `dayOrder` | `Record<string, number>` | Thứ tự kéo-thả **riêng từng thứ**, key `"1"`…`"7"`. |
| `status` | `"TODO" \| "IN_PROGRESS" \| "DONE"` | Giữ nguyên field cũ; giờ chỉ module Việc cần làm (và Tầm nhìn) dùng. |

Tương thích ngược:
- Tài liệu cũ chỉ có `dayOfWeek` (một số) vẫn đọc được: `dashboardApi` đọc `data.daysOfWeek ?? data.dayOfWeek` rồi chuẩn hoá thành mảng.
- Khi ghi `daysOfWeek` mới, code ghi kèm `dayOfWeek: null` để dọn field cũ.
- Không cần migration thủ công; dữ liệu cũ tự được đọc và tự chuyển dạng ở lần chỉnh sửa kế tiếp.

API trong [lib/api.ts](weekloop-landing/lib/api.ts):
- `workItemApi.create(..., daysOfWeek: number[] = [])` — tạo task kèm ngày (mặc định rỗng).
- `workItemApi.update(id, { daysOfWeek?, dayOrder?, ... })` — chuẩn hoá trước khi ghi.
- `workItemApi.assignDays(assignments)` — batch cập nhật `daysOfWeek` cho nhiều task (dùng cho tự xếp lịch + hoàn tác).
- `workItemApi.setDayOrder(updates)` — batch cập nhật `dayOrder` cho nhiều task (dùng cho kéo-thả).
- `dashboardApi.getDashboard()` trả thêm `daysOfWeek`, `dayOrder` cho từng work item.

Chuẩn hoá dữ liệu nằm ở [lib/weekAgenda.ts](weekloop-landing/lib/weekAgenda.ts): `normalizeDaysOfWeek`, `normalizeDayOrder`, chấp nhận cả dữ liệu cũ, bỏ trùng, sắp tăng dần, loại giá trị không hợp lệ.

---

## 5. File đã thêm/sửa

### File mới

| File | Vai trò |
| --- | --- |
| `weekloop-landing/components/app/WeekAgenda.tsx` | Toàn bộ màn “Việc cần làm”: 7 thẻ thứ, hàng đợi, popover chọn nhiều thứ, kéo-thả, composer thêm việc (kèm danh sách task có sẵn của đầu việc đang chọn), tự xếp lịch, empty/read-only states, CSS scoped. |
| `weekloop-landing/lib/weekAgenda.ts` | Logic thuần: chuẩn hoá ngày/thứ tự, gom việc theo thứ, sắp xếp, ngày thật của từng thứ, kế hoạch tự xếp lịch. |
| `weekloop-landing/tests/weekAgenda.test.mjs` | 23 test cho module (lặp ngày, gộp trùng, thứ tự tay, tự xếp lịch không giới hạn, bỏ một thứ…). |
| `weekloop-landing/DESIGN.md` | Ghi quyết định giao diện: bộ mặt, màu nhấn, planner không trạng thái, mô tả module (theo skill `ui-ux`). |

### File sửa

| File | Thay đổi chính |
| --- | --- |
| `components/app/Dashboard.tsx` | Tab `agenda`; mục sidebar + badge; top bar tuần cho agenda; thanh tab dưới mobile; handler `handleAssignDays`, `handleAutoSchedule`, `handleReorderDay`, `handleRemoveFromDay`; map thêm `daysOfWeek`, `dayOrder`; bỏ `onCycleStatus` khỏi WeekGrid; truyền props mới cho WeekAgenda. |
| `components/app/WeekGrid.tsx` | Bỏ toàn bộ UI trạng thái; badge đếm tổng việc; bỏ prop `onCycleStatus`; modal chi tiết `showStatus={false}`; sửa đồng bộ `localItems` sang render-time (bỏ effect, memo hoá fallback mock). |
| `components/app/TaskDetailModal.tsx` | Thêm `showStatus`; đồng bộ nội dung khi đổi task bằng render-time thay vì effect; `handleSave`/`handleDelete` chuyển lên trước effect bàn phím; nút “dời tuần” không còn phụ thuộc status khi `showStatus=false`. |
| `lib/api.ts` | Thêm `daysOfWeek`, `dayOrder` vào type + đọc/ghi; batch `assignDays`, `setDayOrder`; tương thích `dayOfWeek` cũ. |
| `lib/mockData.ts` | `WorkItemData` thêm `daysOfWeek?`, `dayOrder?`. |
| `lib/translations.ts` | Thêm ~27 key vi/en cho module (tên tab, hàng đợi, chọn thứ, tự xếp lịch, kéo-thả, bỏ khỏi thứ, danh sách việc có sẵn từ Planner…). |
| `app/sb-skin.css` | Thêm `#agenda-view` vào layout grid + mobile padding. |
| `tests/weekAgenda.test.mjs` | Thêm test cho các thay đổi mới (tổng 23 test trong file). |

---

## 6. Kiểm tra đã chạy

- **Unit test:** `node --experimental-strip-types --test tests/*.test.mjs` → **49/49 pass** (23 test của `weekAgenda`, còn lại là test cũ).
- **Typecheck:** `tsc --noEmit` → không lỗi ở code mới; còn **3 lỗi có sẵn từ trước** do `node_modules` thiếu gói `three` của `/garden` (`GardenScene.ts`). Lỗi này không liên quan module mới.
- **ESLint:** các file đã sửa → **0 error** (chỉ còn warning cũ: biến thừa trong Dashboard, `window.location.href` trong api.ts).
- **Kiểm tra bằng Playwright trên dev server** (dữ liệu mẫu, có tạm tạo preview route rồi xoá):
  - Chọn nhiều thứ T2/T4/T6 cho một việc → việc xuất hiện đúng 3 thẻ; bỏ tick/áp dụng; Esc huỷ; bấm ra ngoài lưu.
  - Kéo dòng đầu của T3 xuống dưới → DOM đổi thứ tự, lưu vào state; tay cầm hiển thị trong thẻ thứ, không có ở hàng đợi.
  - Tự xếp lịch: 5 việc chưa xếp được rải hết (có ngày nhận nhiều việc hơn 3 → xác nhận không còn cap).
  - Trạng thái trong to-do vẫn bấm đổi được; Planner không còn chữ “Cần làm/Đang làm/Đã xong”; modal mở từ Planner không có hàng Trạng thái.
  - Bỏ việc 3 ngày khỏi T3 → chỉ mất T3, còn T5/T7; bỏ việc 1 ngày → về hàng đợi; nút Xóa hẳn vẫn còn trong modal.
  - Mở composer “Thêm việc” trong T4: danh sách “Việc đã có trong Planner” hiện đúng 2 task của đầu việc (1 task đang ở T3 có nhãn ngày, 1 task chưa xếp); bấm 1 dòng → task vào T4, biến khỏi danh sách chọn; đổi đầu việc → danh sách đổi theo (3 task Gym kèm nhãn ngày).
  - Không có lỗi console; 390px không tràn ngang; kiểm tra cả dark mode ở các vòng trước.
- Lưu ý khi dev: dùng `http://localhost:3123` (không dùng `127.0.0.1`) để Next dev không chặn HMR/JS do cross-origin dev resource.

---

## 7. Hành vi cần biết / giới hạn hiện tại

1. **Một task = một trạng thái chung cho mọi ngày lặp.** Tick xong ở T2 là xong ở T4/T6. Nếu muốn tick riêng từng lần lặp thì phải tách dữ liệu theo “occurrence” (task con hoặc bảng riêng) — chưa làm.
2. **Kéo-thả chỉ trong một thứ**, không kéo giữa các thứ (muốn đổi thứ thì dùng ô chọn ngày) và **không có kéo bằng bàn phím**.
3. Khi bật **“Ẩn việc đã xong”**, tay cầm kéo bị ẩn và không kéo được cho tới khi hiện lại.
4. Danh sách “Việc đã có trong Planner” trong composer **chỉ lấy task của đầu việc đang chọn trong tuần đang xem**, bỏ qua việc DONE và việc đã có mặt ở thứ đang mở; danh sách không phân trang, cuộn trong khung cao ~150px.
5. **Tự xếp lịch chỉ gán 1 ngày cho mỗi việc chưa xếp**, không tự tạo việc lặp; muốn việc lặp thì chọn tay bằng ô ngày.
6. Dữ liệu dashboard load **một lần** khi mở app rồi cập nhật optimistic trong state chung; chưa có `onSnapshot` realtime cho work_items. Thao tác ở tab này thấy ngay ở tab kia vì dùng chung state, nhưng mở nhiều tab/thiết bị cùng lúc thì cần tải lại.
7. Planner vẫn giữ field `status` trong dữ liệu (agenda/Tầm nhìn dùng); Planner chỉ không hiển thị. **Tầm nhìn** vẫn hiển thị status và vẫn lọc việc chưa xong.
8. Những việc đã xong mà chưa từng xếp thứ sẽ nằm lại “Chưa xếp thứ” (không tự xếp khi chạy auto vì auto bỏ qua việc DONE).
9. Backend Spring Boot không được cập nhật `daysOfWeek`/`dayOrder`; nếu sau này chuyển sang dùng backend thì cần thêm cột/bảng tương ứng.
10. Hai file `skills-lock.json` và `.agents/skills/ui-ux/` vẫn ngoài commit; nếu muốn đưa skill vào repo thì cần commit riêng.

## 8. Gợi ý việc tiếp theo

- Tick riêng từng lần lặp (occurrence) nếu nhu cầu học/gym hằng ngày cần đánh dấu từng ngày.
- Bỏ status khỏi tab Tầm nhìn cho đồng bộ với Planner.
- Thêm realtime `onSnapshot` cho work_items để đồng bộ nhiều thiết bị.
- Kéo-thả giữa các thứ (drag qua thẻ thứ khác) và kéo-thả trong hàng đợi.
- Tuỳ chọn cho auto-schedule: né cuối tuần, tự lặp việc “hằng ngày”, số việc/ngày.
- Keyboard reorder (Alt+↑/↓) cho người dùng bàn phím.

## 9. Cách chạy & kiểm tra

```bash
cd weekloop-landing
pnpm dev          # hoặc npm run dev; mở http://localhost:3000
pnpm test         # node --experimental-strip-types --test tests/*.test.mjs
pnpm lint         # eslint
```

Luồng kiểm tra nhanh tính năng:
1. Vào Planner, tạo/sửa vài đầu việc + việc trong tuần.
2. Sang tab **Việc cần làm**: thấy việc trong hàng đợi → bấm **Tự xếp lịch** hoặc chọn thứ bằng ô 📅.
3. Chọn 3 thứ cho một việc lặp → kiểm tra việc xuất hiện ở cả 3 thẻ, dòng `↻` đúng.
4. Kéo ⠿ trong một thẻ để đổi thứ tự; tải lại trang để kiểm tra đã lưu (`dayOrder`).
5. Bấm 📅✕ trên một dòng → việc chỉ mất ở ngày đó, Planner vẫn còn.
6. Mở một việc → **Xóa** (2 lần) → việc mới mất hẳn khỏi Planner.
