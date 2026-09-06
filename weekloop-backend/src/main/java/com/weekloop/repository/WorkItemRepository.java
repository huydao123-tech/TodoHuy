package com.weekloop.repository;

import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.User;
import com.weekloop.entity.WorkItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkItemRepository extends JpaRepository<WorkItem, Long> {
    List<WorkItem> findByTaskGroupAndWeekStartDate(TaskGroup taskGroup, LocalDate weekStartDate);
    List<WorkItem> findByTaskGroup_UserAndWeekStartDate(User user, LocalDate weekStartDate);
    @EntityGraph(attributePaths = {"taskGroup"})
    List<WorkItem> findByTaskGroup_UserAndWeekStartDateIn(User user, Collection<LocalDate> weekStartDates);
    Optional<WorkItem> findByIdAndTaskGroup_User(Long id, User user);
}
