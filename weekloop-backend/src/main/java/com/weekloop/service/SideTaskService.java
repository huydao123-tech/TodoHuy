package com.weekloop.service;

import com.weekloop.dto.Dtos.*;
import com.weekloop.entity.SideTask;
import com.weekloop.entity.User;
import com.weekloop.repository.SideTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SideTaskService {

    private final SideTaskRepository sideTaskRepository;

    public SideTaskService(SideTaskRepository sideTaskRepository) {
        this.sideTaskRepository = sideTaskRepository;
    }

    public List<SideTaskResponse> getSideTasks(User user, Boolean isDone) {
        List<SideTask> list = isDone == null
            ? sideTaskRepository.findByUserOrderByCreatedAtDesc(user)
            : sideTaskRepository.findByUserAndIsDoneOrderByCreatedAtDesc(user, isDone);

        return list.stream()
            .map(t -> new SideTaskResponse(t.getId(), t.getName(), t.getIsDone()))
            .toList();
    }

    @Transactional
    public SideTaskResponse createSideTask(User user, SideTaskRequest req) {
        SideTask task = new SideTask(user, req.name(), req.isDone() != null ? req.isDone() : false);
        sideTaskRepository.save(task);
        return new SideTaskResponse(task.getId(), task.getName(), task.getIsDone());
    }

    @Transactional
    public SideTaskResponse toggleSideTask(User user, Long id) {
        SideTask task = sideTaskRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc phụ!"));

        task.setIsDone(!task.getIsDone());
        sideTaskRepository.save(task);

        return new SideTaskResponse(task.getId(), task.getName(), task.getIsDone());
    }

    @Transactional
    public void deleteSideTask(User user, Long id) {
        SideTask task = sideTaskRepository.findByIdAndUser(id, user)
            .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đầu việc phụ!"));
        sideTaskRepository.delete(task);
    }
}
