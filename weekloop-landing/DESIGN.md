# Thiết kế giao diện

Skill evon:ui-ux đọc file này trước khi dựng. Sửa tay được; file trái với code thì code thắng.

## Sản phẩm
- Sản phẩm: WeekLoop — app quản lý kế hoạch tuần cá nhân
- Người dùng: một người tự quản việc học, dự án và thể hình; dùng máy tính là chính, điện thoại khi cần
- Việc chính: lên kế hoạch tuần trượt theo từng đầu việc, xem việc cần làm của từng thứ trong tuần, ghi việc phụ và ghi chú
- Nền tảng: web Next.js 16, responsive; điện thoại dùng thanh tab dưới
- Điểm khác biệt: cửa sổ 3 tuần trượt, mỗi tuần chẻ tiếp được thành 7 thứ

## Giao diện
- Bộ mặt: **Calm / Paper** theo `UI-DESIGN-REPORT.md`, skin B: giữ web hiện có nhưng đổi sang palette + radius + shell của bản mobile.
- Màu nền: giấy ấm `#FAFAF9` (dark `#09090B`), card trắng `#FFFFFF` (dark `#18181B`), input `#F5F5F4` (dark `#27272A`).
- Accent duy nhất: emerald `#16A34A` (dark `#16A34A`, chữ accent `#15803D` / dark `#4ADE80`); không gradient ngoài logo.
- Chữ: Inter cho app shell; tiêu đề 17–19/800, thân 13.5–15/500, meta 10.5–12; viền mảnh 1px thay vì đổ bóng, shadow mềm `--shadow-soft` (dark: không shadow).
- Bo góc: input 14, chip/nút 8–12, card 16, sheet/modal 20–24, pill 9999. Khoảng cách 4-based, padding ngang trang 16 (mobile) / 24 (desktop).
- Nền tối: có, token trong `[data-theme="dark"]` (`app/globals.css`); card dark dùng viền thay bóng.
- Shell desktop: sidebar 260px + topbar 64px + vùng nội dung tối đa 1440px; topbar có title/subtitle, week navigator dạng card và cụm theme/ngôn ngữ/avatar.
- Mobile: topbar 56px (menu + title), week navigator là card trong nội dung, thanh tab dưới 5 mục: Kế hoạch · Cần làm · Tầm nhìn · Việc phụ · Ghi chú; danh mục mở bằng menu hamburger.
- Copy: vi/en trong `lib/translations.ts`, mặc định tiếng Việt.

## Người dùng dặn
- Planner **không có trạng thái**; trạng thái (cần làm/đang làm/xong) chỉ thuộc module Việc cần làm.
- Mỗi khi code thay đổi, cập nhật `handoff.md` ngay trong cùng lần làm.

## Màn đã dựng
- `/dashboard` Planner: 3 cột tuần trượt (giữ layout 3 tuần của bản web); card đầu việc header tint 6% màu nhóm, count "N việc", radius 16, viền 1px; không có trạng thái.
- `/dashboard` Việc cần làm: week navigator + progress stick header; hàng đợi "Chưa xếp thứ" dạng card thường (không dashed) có icon inbox + nút "Tự xếp lịch"; 7 thẻ thứ radius 16, thẻ hôm nay viền accent; chọn nhiều thứ, "Chọn cả tuần", kéo-thả thứ tự, bỏ khỏi thứ; composer thêm việc kèm danh sách task có sẵn trong Planner; tự xếp lịch không giới hạn/ngày, có Hoàn tác; tuần cũ read-only.
- `/dashboard` Tầm nhìn: card radius 16 + header tint, chip lọc, nhóm việc dense list, trạng thái vision dạng pill; empty state chuẩn.
- `/dashboard` Ghi chú: search card, chip lọc, masonry 2/3/4 cột, note card pastel radius 16, editor modal/sheet.
- `/dashboard` Việc phụ: panel card list + checkbox 22, capture dock dưới.
- `/login`: logo gradient 68 radius 20, segmented login/signup, field radius 14, nút accent.
- `/garden` Văn phòng: 3D (không thuộc phạm vi redesign này); `/` landing giữ brand.
