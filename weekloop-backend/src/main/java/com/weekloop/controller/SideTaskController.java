package com.weekloop.controller;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.User;
import com.weekloop.service.SideTaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/side-tasks")
public class SideTaskController {

    private final SideTaskService sideTaskService;

    public SideTaskController(SideTaskService sideTaskService) {
        this.sideTaskService = sideTaskService;
    }

    @GetMapping
    public ResponseEntity<List<SideTaskResponse>> getSideTasks(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestParam(required = false) Boolean isDone
    ) {
        return ResponseEntity.ok(sideTaskService.getSideTasks(user, isDone));
    }

    @PostMapping
    public ResponseEntity<SideTaskResponse> createSideTask(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestBody SideTaskRequest request
    ) {
        return ResponseEntity.ok(sideTaskService.createSideTask(user, request));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<SideTaskResponse> toggleSideTask(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(sideTaskService.toggleSideTask(user, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSideTask(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        sideTaskService.deleteSideTask(user, id);
        return ResponseEntity.noContent().build();
    }
}
