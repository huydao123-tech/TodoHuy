# SRS v2 — Personal Weekly Task Tracker
**Stack:** Spring Boot (backend) + React (frontend) + MySQL
---

## 1. Mục đích & phạm vi

Ứng dụng quản lý công việc **cá nhân**, không phải team collaboration tool. Người dùng dùng để:
- Lên kế hoạch cho các "đầu việc chính" (mục tiêu dài hạn, lặp lại: học tiếng Nhật, dự án chess, gym...) theo cửa sổ **3 tuần trượt** (tuần trước – tuần này – tuần sau).
- Với mỗi đầu việc chính, chẻ nhỏ thành các **công việc cụ thể trong tuần** (kèm trạng thái, mô tả).
- Theo dõi **đầu việc phụ** — việc lặt vặt một lần, chỉ cần biết đã xong hay chưa.
- Lưu **tài liệu tham khảo** (link, mô tả) gắn theo từng đầu việc.

Không cần: multi-user, phân quyền, comment giữa nhiều người, file đính kèm nặng, hệ thống thông báo phức tạp.

---

## 2. Khái niệm dữ liệu chính (mapping trực tiếp từ file của bạn)

| Khái niệm trong file | Tên thực thể trong hệ thống | Ghi chú |
|---|---|---|
| Mục "Tài liệu" | `Resource` | Có thể gắn hoặc không gắn với 1 đầu việc |
| "Các đầu việc chính" | `TaskGroup` (type=MAIN) | Có kế hoạch theo tuần |
| Cột "Deadline tuần trước/này/sau" | `WeeklyGoal` | 1 dòng mục tiêu ngắn cho 1 group trong 1 tuần cụ thể |
| "Các đầu việc phụ" | `TaskGroup` (type=SIDE) — hoặc bảng `SideTask` riêng | Chỉ cần done/chưa done |
| Bảng phân chia công việc (Công việc/Trạng thái/Mô tả theo từng tuần) | `WorkItem` | Sub-item cụ thể, thuộc 1 đầu việc chính + 1 tuần |

---

## 3. Yêu cầu chức năng

### FR-1: Tài khoản
- FR-1.1: Đăng ký / đăng nhập (JWT) — phục vụ đồng bộ dữ liệu nhiều thiết bị.
- FR-1.2: Đổi mật khẩu, cập nhật thông tin cá nhân.

### FR-2: Quản lý đầu việc (Task Group)
- FR-2.1: Tạo đầu việc, chọn loại: `MAIN` (theo dõi theo tuần) hoặc `SIDE` (checklist đơn giản).
- FR-2.2: Sửa/xóa/ẩn đầu việc (ẩn thay vì xóa nếu đã có dữ liệu tuần để không mất lịch sử).
- FR-2.3: Sắp xếp thứ tự hiển thị đầu việc (kéo-thả).

### FR-3: Tài liệu tham khảo (Resource)
- FR-3.1: Thêm tài liệu: tiêu đề, link, mô tả, tùy chọn gắn với 1 đầu việc.
- FR-3.2: Sửa/xóa tài liệu.
- FR-3.3: Xem danh sách tài liệu theo đầu việc, hoặc xem tất cả (tab "Tài liệu chung" cho các link không gắn đầu việc nào — như "Kết quả bóng đá", "Kỹ năng làm việc với AI agent" trong file gốc).

### FR-4: Kế hoạch tuần (Weekly Goal) — chỉ áp dụng cho đầu việc MAIN
- FR-4.1: Hệ thống tự tính "tuần hiện tại" theo ngày thực (Thứ 2 → Chủ nhật), hiển thị 3 cột: tuần trước / tuần này / tuần sau.
- FR-4.2: Với mỗi đầu việc MAIN, nhập/sửa mục tiêu ngắn (`goal_text`) cho từng tuần trong 3 tuần đó.
- FR-4.3: Có thể xem lại các tuần cũ hơn (lịch sử) qua điều hướng tuần (prev/next), không giới hạn ở đúng 3 tuần.

### FR-5: Công việc chi tiết theo tuần (Work Item)
- FR-5.1: Trong 1 tuần cụ thể, với mỗi đầu việc MAIN, thêm danh sách công việc con (VD: "Xong bài 26 ngữ pháp", "Học từ vựng đến bài 27 anki").
- FR-5.2: Mỗi công việc con có: nội dung, trạng thái (`TODO`/`IN_PROGRESS`/`DONE`), mô tả/ghi chú.
- FR-5.3: Sửa/xóa/đổi trạng thái công việc con.
- FR-5.4: (Tùy chọn, bật/tắt được) Khi sang tuần mới, tự động chuyển các công việc con **chưa DONE** của tuần trước sang tuần hiện tại — tránh phải chép tay việc còn dang dở.

### FR-6: Đầu việc phụ (Side Task)
- FR-6.1: Thêm việc phụ (tên việc), không cần theo tuần.
- FR-6.2: Đánh dấu đã xong / chưa xong (toggle, tương đương ký hiệu "x" trong file gốc).
- FR-6.3: Lọc xem: tất cả / chưa xong / đã xong.

### FR-7: Dashboard tổng quan
- FR-7.1: Trang chủ hiển thị tuần hiện tại: mỗi đầu việc MAIN kèm goal_text + số work item theo trạng thái (VD: 2 TODO, 1 DONE).
- FR-7.2: % hoàn thành side task.
- FR-7.3: Điều hướng nhanh xem tuần trước/tuần sau.

---

## 4. Yêu cầu phi chức năng
| Loại | Yêu cầu |
|---|---|
| Đơn giản trước tiên | Không thêm bảng/tính năng nếu không xuất hiện trong nhu cầu thực tế ở trên |
| Hiệu năng | Trang dashboard load 3 tuần dữ liệu < 300ms |
| Bảo mật | JWT + BCrypt, mỗi user chỉ thấy dữ liệu của chính mình |
| UI | Responsive; layout 3 cột (tuần trước/này/sau) cần đọc tốt trên mobile (có thể swipe ngang giữa các tuần) |

---

## 5. Thiết kế Database (6 bảng — tối giản cho single-user)

### 5.1 DDL (MySQL)

-- Schema MySQL 8.x — tương thích với SRS v2 (Personal Weekly Task Tracker)

-- ========== USERS ==========
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== TASK_GROUPS (đầu việc chính / phụ) ==========
CREATE TABLE task_groups (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    type            ENUM('MAIN', 'SIDE') NOT NULL,
    display_order   INT NOT NULL DEFAULT 0,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_groups_user (user_id, type)
) ENGINE=InnoDB;

-- ========== RESOURCES (tài liệu tham khảo) ==========
CREATE TABLE resources (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    task_group_id   BIGINT NULL,
    title           VARCHAR(200) NOT NULL,
    link            VARCHAR(500),
    description     VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resources_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_resources_group FOREIGN KEY (task_group_id) REFERENCES task_groups(id) ON DELETE SET NULL,
    INDEX idx_resources_group (task_group_id)
) ENGINE=InnoDB;

-- ========== WEEKLY_GOALS (mục tiêu ngắn theo tuần, chỉ cho MAIN) ==========
CREATE TABLE weekly_goals (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_group_id   BIGINT NOT NULL,
    week_start_date DATE NOT NULL,
    goal_text       VARCHAR(255),
    CONSTRAINT fk_weekly_goals_group FOREIGN KEY (task_group_id) REFERENCES task_groups(id) ON DELETE CASCADE,
    UNIQUE KEY uq_weekly_goals (task_group_id, week_start_date),
    INDEX idx_weekly_goals_week (week_start_date)
) ENGINE=InnoDB;

-- ========== WORK_ITEMS (công việc con, chi tiết theo tuần) ==========
CREATE TABLE work_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_group_id   BIGINT NOT NULL,
    week_start_date DATE NOT NULL,
    content         VARCHAR(255) NOT NULL,
    status          ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
    note            VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_work_items_group FOREIGN KEY (task_group_id) REFERENCES task_groups(id) ON DELETE CASCADE,
    INDEX idx_work_items_group_week (task_group_id, week_start_date)
) ENGINE=InnoDB;

-- ========== SIDE_TASKS (đầu việc phụ, checklist đơn giản) ==========
CREATE TABLE side_tasks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(200) NOT NULL,
    is_done         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_side_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_side_tasks_user (user_id, is_done)
) ENGINE=InnoDB;

---

## 6. API chính

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/task-groups?type=MAIN` | Danh sách đầu việc chính |
| POST | `/api/task-groups` | Tạo đầu việc |
| GET | `/api/task-groups/{id}/resources` | Tài liệu theo đầu việc |
| GET | `/api/weekly-goals?weekStart=2026-09-07` | Mục tiêu tuần của tất cả đầu việc MAIN |
| PUT | `/api/task-groups/{id}/weekly-goals/{weekStart}` | Cập nhật mục tiêu tuần |
| GET | `/api/task-groups/{id}/work-items?weekStart=2026-09-07` | Công việc con trong tuần |
| POST | `/api/work-items` | Thêm công việc con |
| PATCH | `/api/work-items/{id}` | Cập nhật trạng thái/nội dung |
| GET | `/api/side-tasks` | Danh sách đầu việc phụ |
| PATCH | `/api/side-tasks/{id}/toggle` | Đánh dấu xong/chưa xong |
| GET | `/api/dashboard?weekStart=2026-09-07` | Tổng hợp cho trang chủ |

---

## 7. Phase 2 (chưa làm ngay)
- Auto carry-over work item chưa DONE sang tuần sau (FR-5.4) — có thể để phase 2 nếu muốn MVP tối giản nhất.
- Thống kê tiến độ dài hạn (biểu đồ số work item DONE theo từng tuần, theo từng đầu việc).
- Nhắc nhở (reminder) qua email/push cho deadline tuần.
- Export dữ liệu ra file (giống file .docx gốc) để backup.

---

**Tóm lại:** v2 bám sát đúng 4 khối bạn đang dùng tay: đầu việc chính theo tuần, đầu việc phụ, tài liệu tham khảo, và bảng chi tiết công việc/trạng thái/mô tả theo tuần — không còn khái niệm team thừa thãi từ v1.
