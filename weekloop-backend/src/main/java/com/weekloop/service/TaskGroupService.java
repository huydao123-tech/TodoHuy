package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.TaskGroupType;
import com.weekloop.entity.User;
import com.weekloop.repository.TaskGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaskGroupService {

    private final TaskGroupRepository taskGroupRepository;

    public TaskGroupService(TaskGroupRepository taskGroupRepository) {
        this.taskGroupRepository = taskGroupRepository;
    }

    public List<TaskGroupResponse> getTaskGroups(User user, TaskGroupType type) {
        List<TaskGroup> list = type == null
            ? taskGroupRepository.findByUserAndIsArchivedFalseOrderByDisplayOrderAsc(user)
            : taskGroupRepository.findByUserAndTypeAndIsArchivedFalseOrderByDisplayOrderAsc(user, type);

        return list.stream()
            .map(g -> new TaskGroupResponse(g.getId(), g.getName(), g.getType(), g.getDisplayOrder(), g.getIsArchived()))
            .toList();
    }

    @Transactional
    public TaskGroupResponse createTaskGroup(User user, TaskGroupRequest req) {
        TaskGroup group = new TaskGroup(
            user,
            req.name(),
            req.type() != null ? req.type() : TaskGroupType.MAIN,
            req.displayOrder() != null ? req.displayOrder() : 0
        );
        taskGroupRepository.save(group);
        return new TaskGroupResponse(group.getId(), group.getName(), group.getType(), group.getDisplayOrder(), group.getIsArchived());
    }

    @Transactional
    public TaskGroupResponse updateTaskGroup(User user, Long id, TaskGroupRequest req) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));

        if (req.name() != null) group.setName(req.name());
        if (req.type() != null) group.setType(req.type());
        if (req.displayOrder() != null) group.setDisplayOrder(req.displayOrder());

        taskGroupRepository.save(group);
        return new TaskGroupResponse(group.getId(), group.getName(), group.getType(), group.getDisplayOrder(), group.getIsArchived());
    }

    @Transactional
    public void archiveTaskGroup(User user, Long id) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));
        group.setIsArchived(true);
        taskGroupRepository.save(group);
    }

    public List<TaskGroupResponse> getArchivedTaskGroups(User user) {
        return taskGroupRepository.findByUserAndIsArchivedTrueOrderByCreatedAtDesc(user).stream()
            .map(g -> new TaskGroupResponse(g.getId(), g.getName(), g.getType(), g.getDisplayOrder(), true))
            .toList();
    }

    @Transactional
    public TaskGroupResponse restoreTaskGroup(User user, Long id) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));
        group.setIsArchived(false);
        taskGroupRepository.save(group);
        return new TaskGroupResponse(group.getId(), group.getName(), group.getType(), group.getDisplayOrder(), false);
    }

    @Transactional
    public void deleteTaskGroup(User user, Long id) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));
        taskGroupRepository.delete(group);
    }
}
