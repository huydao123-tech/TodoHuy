package com.weekloop.dto;

import com.weekloop.entity.TaskGroupType;
import com.weekloop.entity.WorkItemStatus;
import java.time.LocalDate;
import java.util.List;

public class Dtos {

    // ─── AUTH DTOs ─────────────────────────────────────────
    public record LoginRequest(String email, String password) {}
    public record RegisterRequest(String fullName, String email, String password) {}
    public record AuthResponse(String token, Long id, String fullName, String email) {}
    public record UserProfileResponse(Long id, String fullName, String email) {}

    // ─── TASK GROUP DTOs ───────────────────────────────────
    public record TaskGroupRequest(String name, TaskGroupType type, Integer displayOrder) {}
    public record TaskGroupResponse(Long id, String name, TaskGroupType type, Integer displayOrder, Boolean isArchived) {}

    // ─── RESOURCE DTOs ─────────────────────────────────────
    public record ResourceRequest(Long taskGroupId, String title, String link, String description) {}
    public record ResourceResponse(Long id, Long taskGroupId, String title, String link, String description) {}

    // ─── WEEKLY GOAL DTOs ──────────────────────────────────
    public record WeeklyGoalRequest(String goalText) {}
    public record WeeklyGoalResponse(Long id, Long taskGroupId, LocalDate weekStartDate, String goalText) {}

    // ─── WORK ITEM DTOs ────────────────────────────────────
    public record WorkItemRequest(Long taskGroupId, LocalDate weekStartDate, String content, WorkItemStatus status, String note) {}
    public record WorkItemUpdateRequest(String content, WorkItemStatus status, String note) {}
    public record WorkItemResponse(Long id, Long taskGroupId, LocalDate weekStartDate, String content, WorkItemStatus status, String note) {}

    // ─── SIDE TASK DTOs ────────────────────────────────────
    public record SideTaskRequest(String name, Boolean isDone) {}
    public record SideTaskResponse(Long id, String name, Boolean isDone) {}

    // ─── DASHBOARD DTO ─────────────────────────────────────
    public record DashboardResponse(
        LocalDate currentWeekStart,
        LocalDate prevWeekStart,
        LocalDate nextWeekStart,
        List<TaskGroupResponse> taskGroups,
        List<WeeklyGoalResponse> weeklyGoals,
        List<WorkItemResponse> workItems,
        List<SideTaskResponse> sideTasks,
        long sideTasksDoneCount,
        long sideTasksTotalCount
    ) {}
}
