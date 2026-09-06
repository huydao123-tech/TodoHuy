package com.weekloop.repository;

import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.User;
import com.weekloop.entity.WeeklyGoal;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WeeklyGoalRepository extends JpaRepository<WeeklyGoal, Long> {
    Optional<WeeklyGoal> findByTaskGroupAndWeekStartDate(TaskGroup taskGroup, LocalDate weekStartDate);
    List<WeeklyGoal> findByTaskGroup_UserAndWeekStartDate(User user, LocalDate weekStartDate);
    @EntityGraph(attributePaths = {"taskGroup"})
    List<WeeklyGoal> findByTaskGroup_UserAndWeekStartDateIn(User user, Collection<LocalDate> weekStartDates);
}
