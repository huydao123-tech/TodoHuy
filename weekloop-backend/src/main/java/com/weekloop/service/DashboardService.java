package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.*;
import com.weekloop.repository.*;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    private final TaskGroupRepository taskGroupRepository;
    private final WeeklyGoalRepository weeklyGoalRepository;
    private final WorkItemRepository workItemRepository;
    private final SideTaskRepository sideTaskRepository;

    public DashboardService(
        TaskGroupRepository taskGroupRepository,
        WeeklyGoalRepository weeklyGoalRepository,
        WorkItemRepository workItemRepository,
        SideTaskRepository sideTaskRepository
    ) {
        this.taskGroupRepository = taskGroupRepository;
        this.weeklyGoalRepository = weeklyGoalRepository;
        this.workItemRepository = workItemRepository;
        this.sideTaskRepository = sideTaskRepository;
    }

    public DashboardResponse getDashboard(User user, LocalDate weekStart) {
        LocalDate current = weekStart != null
            ? weekStart
            : LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        LocalDate prev = current.minusWeeks(1);
        LocalDate next = current.plusWeeks(1);

        List<LocalDate> threeWeeks = Arrays.asList(prev, current, next);

        List<TaskGroup> groups = taskGroupRepository.findByUserAndTypeAndIsArchivedFalseOrderByDisplayOrderAsc(user, TaskGroupType.MAIN);
        List<TaskGroupResponse> groupDtos = groups.stream()
            .map(g -> new TaskGroupResponse(g.getId(), g.getName(), g.getType(), g.getDisplayOrder(), g.getIsArchived()))
            .toList();

        List<WeeklyGoal> goals = weeklyGoalRepository.findByTaskGroup_UserAndWeekStartDateIn(user, threeWeeks);
        List<WeeklyGoalResponse> goalDtos = goals.stream()
            .filter(g -> !g.getTaskGroup().getIsArchived())
            .map(g -> new WeeklyGoalResponse(g.getId(), g.getTaskGroup().getId(), g.getWeekStartDate(), g.getGoalText()))
            .toList();

        List<WorkItem> items = workItemRepository.findByTaskGroup_UserAndWeekStartDateIn(user, threeWeeks);
        List<WorkItemResponse> itemDtos = items.stream()
            .filter(w -> !w.getTaskGroup().getIsArchived())
            .map(w -> new WorkItemResponse(w.getId(), w.getTaskGroup().getId(), w.getWeekStartDate(), w.getContent(), w.getStatus(), w.getNote()))
            .toList();

        List<SideTask> sideTasks = sideTaskRepository.findByUserOrderByCreatedAtDesc(user);
        List<SideTaskResponse> sideTaskDtos = sideTasks.stream()
            .map(t -> new SideTaskResponse(t.getId(), t.getName(), t.getIsDone()))
            .toList();

        long doneCount = sideTasks.stream().filter(SideTask::getIsDone).count();
        long totalCount = sideTasks.size();

        return new DashboardResponse(
            current,
            prev,
            next,
            groupDtos,
            goalDtos,
            itemDtos,
            sideTaskDtos,
            doneCount,
            totalCount
        );
    }
}
