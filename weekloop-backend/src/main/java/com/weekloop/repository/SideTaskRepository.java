package com.weekloop.repository;

import com.weekloop.entity.SideTask;
import com.weekloop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SideTaskRepository extends JpaRepository<SideTask, Long> {
    List<SideTask> findByUserOrderByCreatedAtDesc(User user);
    List<SideTask> findByUserAndIsDoneOrderByCreatedAtDesc(User user, Boolean isDone);
    Optional<SideTask> findByIdAndUser(Long id, User user);
}
