# Thiết kế giao diện

Skill evon:ui-ux đọc file này trước khi dựng. Sửa tay được; file trái với code thì code thắng.

## Sản phẩm
- Sản phẩm: WeekLoop — app quản lý kế hoạch tuần cá nhân
- Người dùng: một người tự quản việc học, dự án và thể hình; dùng máy tính là chính, điện thoại khi cần
- Việc chính: lên kế hoạch tuần trượt theo từng đầu việc, xem việc cần làm của từng thứ trong tuần, ghi việc phụ và ghi chú
- Nền tảng: web Next.js 16, responsive; điện thoại dùng thanh tab dưới
- Điểm khác biệt: cửa sổ 3 tuần trượt, mỗi tuần chẻ tiếp được thành 7 thứ

## Giao diện
- Bộ mặt: Clean (P13), flat
- Màu nhấn: indigo `#4f46e5` ở app shell (`app/sb-skin.css`, token `--accent`); landing giữ xanh `#16A34A` (`app/globals.css`)
- Phong cách: flat, viền 1px `--border`/`--border-mid`, bo 8–12px, không bóng trừ lớp nổi (modal, toast)
- Font: Inter (`--font-inter`) cho app shell; Geist cho landing
- Nền tối: có, token trong `[data-theme="dark"]` (`app/globals.css`)
- Copy: vi/en trong `lib/translations.ts`, mặc định tiếng Việt

## Người dùng dặn
- (chưa có)

## Màn đã dựng
- `/dashboard` Planner: 3 cột tuần trượt, mỗi đầu việc một thẻ
- `/dashboard` Việc cần làm: hàng đợi "Chưa xếp thứ" + 7 thẻ thứ 2→CN; mỗi việc chọn được nhiều thứ trong tuần (việc lặp lại), thêm việc theo đầu việc Planner; "Tự xếp lịch" rải việc chưa xếp vào các thứ còn lại (không giới hạn số việc/ngày, việc đang làm trước, có Hoàn tác); tuần cũ chỉ xem
- `/dashboard` Tầm nhìn, Ghi chú; `/garden` Văn phòng; `/` landing
