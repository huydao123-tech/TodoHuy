package com.weekloop.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "weekly_goals", uniqueConstraints = {
    @UniqueConstraint(name = "uq_weekly_goals", columnNames = {"task_group_id", "week_start_date"})
})
public class WeeklyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_group_id", nullable = false)
    private TaskGroup taskGroup;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "goal_text", length = 255)
    private String goalText;

    public WeeklyGoal() {}

    public WeeklyGoal(TaskGroup taskGroup, LocalDate weekStartDate, String goalText) {
        this.taskGroup = taskGroup;
        this.weekStartDate = weekStartDate;
        this.goalText = goalText;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TaskGroup getTaskGroup() {
        return taskGroup;
    }

    public void setTaskGroup(TaskGroup taskGroup) {
        this.taskGroup = taskGroup;
    }

    public LocalDate getWeekStartDate() {
        return weekStartDate;
    }

    public void setWeekStartDate(LocalDate weekStartDate) {
        this.weekStartDate = weekStartDate;
    }

    public String getGoalText() {
        return goalText;
    }

    public void setGoalText(String goalText) {
        this.goalText = goalText;
    }
}
