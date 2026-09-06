package com.weekloop.controller;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.TaskGroupType;
import com.weekloop.entity.User;
import com.weekloop.service.ResourceService;
import com.weekloop.service.TaskGroupService;
import com.weekloop.service.WeeklyGoalService;
import com.weekloop.service.WorkItemService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/task-groups")
public class TaskGroupController {

    private final TaskGroupService taskGroupService;
    private final ResourceService resourceService;
    private final WorkItemService workItemService;
    private final WeeklyGoalService weeklyGoalService;

    public TaskGroupController(
        TaskGroupService taskGroupService,
        ResourceService resourceService,
        WorkItemService workItemService,
        WeeklyGoalService weeklyGoalService
    ) {
        this.taskGroupService = taskGroupService;
        this.resourceService = resourceService;
        this.workItemService = workItemService;
        this.weeklyGoalService = weeklyGoalService;
    }

    @GetMapping
    public ResponseEntity<List<TaskGroupResponse>> getTaskGroups(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestParam(required = false) TaskGroupType type
    ) {
        return ResponseEntity.ok(taskGroupService.getTaskGroups(user, type));
    }

    @PostMapping
    public ResponseEntity<TaskGroupResponse> createTaskGroup(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestBody TaskGroupRequest request
    ) {
        return ResponseEntity.ok(taskGroupService.createTaskGroup(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskGroupResponse> updateTaskGroup(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id,
        @RequestBody TaskGroupRequest request
    ) {
        return ResponseEntity.ok(taskGroupService.updateTaskGroup(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTaskGroup(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        taskGroupService.archiveTaskGroup(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/trash")
    public ResponseEntity<List<TaskGroupResponse>> getTrash(@AuthenticationPrincipal(expression = "user") User user) {
        return ResponseEntity.ok(taskGroupService.getArchivedTaskGroups(user));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<TaskGroupResponse> restoreTaskGroup(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(taskGroupService.restoreTaskGroup(user, id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> permanentlyDeleteTaskGroup(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        taskGroupService.deleteTaskGroup(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/resources")
    public ResponseEntity<List<ResourceResponse>> getGroupResources(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(resourceService.getResources(user, id));
    }

    @GetMapping("/{id}/work-items")
    public ResponseEntity<List<WorkItemResponse>> getGroupWorkItems(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart
    ) {
        return ResponseEntity.ok(workItemService.getWorkItems(user, id, weekStart));
    }

    @PutMapping("/{id}/weekly-goals/{weekStart}")
    public ResponseEntity<WeeklyGoalResponse> updateWeeklyGoal(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id,
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
        @RequestBody WeeklyGoalRequest request
    ) {
        return ResponseEntity.ok(weeklyGoalService.updateWeeklyGoal(user, id, weekStart, request));
    }
}
