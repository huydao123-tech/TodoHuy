package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.User;
import com.weekloop.entity.WeeklyGoal;
import com.weekloop.repository.TaskGroupRepository;
import com.weekloop.repository.WeeklyGoalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class WeeklyGoalService {

    private final WeeklyGoalRepository weeklyGoalRepository;
    private final TaskGroupRepository taskGroupRepository;

    public WeeklyGoalService(WeeklyGoalRepository weeklyGoalRepository, TaskGroupRepository taskGroupRepository) {
        this.weeklyGoalRepository = weeklyGoalRepository;
        this.taskGroupRepository = taskGroupRepository;
    }

    public List<WeeklyGoalResponse> getWeeklyGoals(User user, LocalDate weekStart) {
        List<WeeklyGoal> goals = weeklyGoalRepository.findByTaskGroup_UserAndWeekStartDate(user, weekStart);
        return goals.stream()
            .map(g -> new WeeklyGoalResponse(g.getId(), g.getTaskGroup().getId(), g.getWeekStartDate(), g.getGoalText()))
            .toList();
    }

    @Transactional
    public WeeklyGoalResponse updateWeeklyGoal(User user, Long taskGroupId, LocalDate weekStart, WeeklyGoalRequest req) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(taskGroupId, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));

        WeeklyGoal goal = weeklyGoalRepository.findByTaskGroupAndWeekStartDate(group, weekStart)
            .orElseGet(() -> new WeeklyGoal(group, weekStart, ""));

        goal.setGoalText(req.goalText());
        weeklyGoalRepository.save(goal);

        return new WeeklyGoalResponse(goal.getId(), goal.getTaskGroup().getId(), goal.getWeekStartDate(), goal.getGoalText());
    }
}
