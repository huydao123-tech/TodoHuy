package com.weekloop.repository;

import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.TaskGroupType;
import com.weekloop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskGroupRepository extends JpaRepository<TaskGroup, Long> {
    List<TaskGroup> findByUserAndIsArchivedFalseOrderByDisplayOrderAsc(User user);
    List<TaskGroup> findByUserAndTypeAndIsArchivedFalseOrderByDisplayOrderAsc(User user, TaskGroupType type);
    List<TaskGroup> findByUserAndIsArchivedTrueOrderByCreatedAtDesc(User user);
    Optional<TaskGroup> findByIdAndUser(Long id, User user);
}
