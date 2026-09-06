package com.weekloop.controller;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.User;
import com.weekloop.service.WorkItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-items")
public class WorkItemController {

    private final WorkItemService workItemService;

    public WorkItemController(WorkItemService workItemService) {
        this.workItemService = workItemService;
    }

    @PostMapping
    public ResponseEntity<WorkItemResponse> createWorkItem(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestBody WorkItemRequest request
    ) {
        return ResponseEntity.ok(workItemService.createWorkItem(user, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WorkItemResponse> updateWorkItem(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id,
        @RequestBody WorkItemUpdateRequest request
    ) {
        return ResponseEntity.ok(workItemService.updateWorkItem(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkItem(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        workItemService.deleteWorkItem(user, id);
        return ResponseEntity.noContent().build();
    }
}
