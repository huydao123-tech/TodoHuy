package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.User;
import com.weekloop.entity.WorkItem;
import com.weekloop.entity.WorkItemStatus;
import com.weekloop.repository.TaskGroupRepository;
import com.weekloop.repository.WorkItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class WorkItemService {

    private final WorkItemRepository workItemRepository;
    private final TaskGroupRepository taskGroupRepository;

    public WorkItemService(WorkItemRepository workItemRepository, TaskGroupRepository taskGroupRepository) {
        this.workItemRepository = workItemRepository;
        this.taskGroupRepository = taskGroupRepository;
    }

    public List<WorkItemResponse> getWorkItems(User user, Long taskGroupId, LocalDate weekStart) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(taskGroupId, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));

        List<WorkItem> items = workItemRepository.findByTaskGroupAndWeekStartDate(group, weekStart);
        return items.stream()
            .map(w -> new WorkItemResponse(w.getId(), w.getTaskGroup().getId(), w.getWeekStartDate(), w.getContent(), w.getStatus(), w.getNote()))
            .toList();
    }

    @Transactional
    public WorkItemResponse createWorkItem(User user, WorkItemRequest req) {
        TaskGroup group = taskGroupRepository.findByIdAndUser(req.taskGroupId(), user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc!"));

        WorkItem item = new WorkItem(
            group,
            req.weekStartDate(),
            req.content(),
            req.status() != null ? req.status() : WorkItemStatus.TODO,
            req.note()
        );
        workItemRepository.save(item);

        return new WorkItemResponse(item.getId(), item.getTaskGroup().getId(), item.getWeekStartDate(), item.getContent(), item.getStatus(), item.getNote());
    }

    @Transactional
    public WorkItemResponse updateWorkItem(User user, Long id, WorkItemUpdateRequest req) {
        WorkItem item = workItemRepository.findByIdAndTaskGroup_User(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy công việc!"));

        if (req.content() != null) item.setContent(req.content());
        if (req.status() != null) item.setStatus(req.status());
        if (req.note() != null) item.setNote(req.note());

        workItemRepository.save(item);
        return new WorkItemResponse(item.getId(), item.getTaskGroup().getId(), item.getWeekStartDate(), item.getContent(), item.getStatus(), item.getNote());
    }

    @Transactional
    public void deleteWorkItem(User user, Long id) {
        WorkItem item = workItemRepository.findByIdAndTaskGroup_User(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy công việc!"));
        workItemRepository.delete(item);
    }
}
