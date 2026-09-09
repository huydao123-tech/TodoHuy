-- Schema MySQL 8.x — Chuẩn hóa 100% tương thích với Backend Spring Boot & Frontend Next.js

DROP DATABASE IF EXISTS todohuy;
CREATE DATABASE todohuy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todohuy;

-- ========== 1. USERS ==========
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== 2. TASK_GROUPS (Đầu việc chính) ==========
CREATE TABLE task_groups (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    type            ENUM('MAIN', 'SIDE') NOT NULL DEFAULT 'MAIN',
    color           VARCHAR(30) DEFAULT '#16A34A', -- Màu nhận diện đầu việc
    display_order   INT NOT NULL DEFAULT 0,
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ xóa mềm (chuyển thùng rác)
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_groups_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_groups_active (user_id, is_archived, display_order)
) ENGINE=InnoDB;

-- ========== 3. WEEKLY_GOALS (Mục tiêu tuần theo đầu việc) ==========
CREATE TABLE weekly_goals (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_group_id   BIGINT NOT NULL,
    week_start_date DATE NOT NULL,
    goal_text       VARCHAR(255),
    CONSTRAINT fk_weekly_goals_group FOREIGN KEY (task_group_id) REFERENCES task_groups(id) ON DELETE CASCADE,
    UNIQUE KEY uq_weekly_goals (task_group_id, week_start_date),
    INDEX idx_weekly_goals_week (week_start_date)
) ENGINE=InnoDB;

-- ========== 4. WORK_ITEMS (Công việc con trong tuần) ==========
CREATE TABLE work_items (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_group_id   BIGINT NOT NULL,
    week_start_date DATE NOT NULL,
    content         VARCHAR(255) NOT NULL,
    status          ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
    note            TEXT, -- Nội dung ghi chú chi tiết của task (hỗ trợ nhiều dòng, link, markdown)
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_work_items_group FOREIGN KEY (task_group_id) REFERENCES task_groups(id) ON DELETE CASCADE,
    INDEX idx_work_items_group_week (task_group_id, week_start_date)
) ENGINE=InnoDB;

-- ========== 5. SIDE_TASKS (Đầu việc phụ, checklist nhanh) ==========
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

-- ========== 6. RESOURCES (Tài liệu tham khảo) ==========
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

-- ========== 7. NOTES (Ghi chú Notion Gallery) [BỔ SUNG MỚI] ==========
CREATE TABLE notes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    title           VARCHAR(180) NOT NULL,
    content         TEXT,
    color           VARCHAR(20) DEFAULT 'stone', -- stone, amber, emerald, blue, purple, rose
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notes_user (user_id)
) ENGINE=InnoDB;

-- =========================================================================
-- HƯỚNG DẪN MIGRATION DATABASE ĐANG CHẠY (TiDB Cloud / MySQL Render):
-- Nếu database đã được tạo trước đó với note VARCHAR(255), hãy chạy lệnh này:
-- =========================================================================
-- ALTER TABLE work_items MODIFY COLUMN note TEXT;
