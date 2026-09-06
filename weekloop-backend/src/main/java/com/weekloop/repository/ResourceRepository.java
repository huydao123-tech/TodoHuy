package com.weekloop.repository;

import com.weekloop.entity.Resource;
import com.weekloop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByUserOrderByCreatedAtDesc(User user);
    List<Resource> findByUserAndTaskGroupIdOrderByCreatedAtDesc(User user, Long taskGroupId);
    List<Resource> findByUserAndTaskGroupIsNullOrderByCreatedAtDesc(User user);
    Optional<Resource> findByIdAndUser(Long id, User user);
}
