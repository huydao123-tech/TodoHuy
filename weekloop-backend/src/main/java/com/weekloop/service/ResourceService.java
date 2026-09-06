package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.Resource;
import com.weekloop.entity.TaskGroup;
import com.weekloop.entity.User;
import com.weekloop.repository.ResourceRepository;
import com.weekloop.repository.TaskGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final TaskGroupRepository taskGroupRepository;

    public ResourceService(ResourceRepository resourceRepository, TaskGroupRepository taskGroupRepository) {
        this.resourceRepository = resourceRepository;
        this.taskGroupRepository = taskGroupRepository;
    }

    public List<ResourceResponse> getResources(User user, Long taskGroupId) {
        List<Resource> list;
        if (taskGroupId != null) {
            list = resourceRepository.findByUserAndTaskGroupIdOrderByCreatedAtDesc(user, taskGroupId);
        } else {
            list = resourceRepository.findByUserOrderByCreatedAtDesc(user);
        }

        return list.stream()
            .map(r -> new ResourceResponse(
                r.getId(),
                r.getTaskGroup() != null ? r.getTaskGroup().getId() : null,
                r.getTitle(),
                r.getLink(),
                r.getDescription()
            ))
            .toList();
    }

    @Transactional
    public ResourceResponse createResource(User user, ResourceRequest req) {
        TaskGroup group = null;
        if (req.taskGroupId() != null) {
            group = taskGroupRepository.findByIdAndUser(req.taskGroupId(), user).orElse(null);
        }

        Resource res = new Resource(user, group, req.title(), req.link(), req.description());
        resourceRepository.save(res);

        return new ResourceResponse(
            res.getId(),
            res.getTaskGroup() != null ? res.getTaskGroup().getId() : null,
            res.getTitle(),
            res.getLink(),
            res.getDescription()
        );
    }

    @Transactional
    public ResourceResponse updateResource(User user, Long id, ResourceRequest req) {
        Resource res = resourceRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu!"));

        if (req.taskGroupId() != null) {
            TaskGroup group = taskGroupRepository.findByIdAndUser(req.taskGroupId(), user).orElse(null);
            res.setTaskGroup(group);
        }
        if (req.title() != null) res.setTitle(req.title());
        if (req.link() != null) res.setLink(req.link());
        if (req.description() != null) res.setDescription(req.description());

        resourceRepository.save(res);
        return new ResourceResponse(
            res.getId(),
            res.getTaskGroup() != null ? res.getTaskGroup().getId() : null,
            res.getTitle(),
            res.getLink(),
            res.getDescription()
        );
    }

    @Transactional
    public void deleteResource(User user, Long id) {
        Resource res = resourceRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài liệu!"));
        resourceRepository.delete(res);
    }
}
