package com.weekloop.controller;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.User;
import com.weekloop.service.ResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getResources(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestParam(required = false) Long groupId
    ) {
        return ResponseEntity.ok(resourceService.getResources(user, groupId));
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestBody ResourceRequest request
    ) {
        return ResponseEntity.ok(resourceService.createResource(user, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> updateResource(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id,
        @RequestBody ResourceRequest request
    ) {
        return ResponseEntity.ok(resourceService.updateResource(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(
        @AuthenticationPrincipal(expression = "user") User user,
        @PathVariable Long id
    ) {
        resourceService.deleteResource(user, id);
        return ResponseEntity.noContent().build();
    }
}
