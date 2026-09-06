package com.weekloop.controller;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.User;
import com.weekloop.service.WeeklyGoalService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/weekly-goals")
public class WeeklyGoalController {

    private final WeeklyGoalService weeklyGoalService;

    public WeeklyGoalController(WeeklyGoalService weeklyGoalService) {
        this.weeklyGoalService = weeklyGoalService;
    }

    @GetMapping
    public ResponseEntity<List<WeeklyGoalResponse>> getWeeklyGoals(
        @AuthenticationPrincipal(expression = "user") User user,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart
    ) {
        return ResponseEntity.ok(weeklyGoalService.getWeeklyGoals(user, weekStart));
    }
}
