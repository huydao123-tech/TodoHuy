package com.weekloop.service;

import com.weekloop.entity.*;
import com.weekloop.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaskGroupRepository taskGroupRepository;
    private final ResourceRepository resourceRepository;
    private final WeeklyGoalRepository weeklyGoalRepository;
    private final WorkItemRepository workItemRepository;
    private final SideTaskRepository sideTaskRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
        UserRepository userRepository,
        TaskGroupRepository taskGroupRepository,
        ResourceRepository resourceRepository,
        WeeklyGoalRepository weeklyGoalRepository,
        WorkItemRepository workItemRepository,
        SideTaskRepository sideTaskRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.taskGroupRepository = taskGroupRepository;
        this.resourceRepository = resourceRepository;
        this.weeklyGoalRepository = weeklyGoalRepository;
        this.workItemRepository = workItemRepository;
        this.sideTaskRepository = sideTaskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        // Tạo tài khoản mặc định
        User user = new User("Huy Nguyễn", "huy@example.com", passwordEncoder.encode("123456"));
        userRepository.save(user);

        // Tạo các đầu việc chính
        TaskGroup tg1 = taskGroupRepository.save(new TaskGroup(user, "Tiếng Nhật", TaskGroupType.MAIN, 1));
        TaskGroup tg2 = taskGroupRepository.save(new TaskGroup(user, "Cờ vua (Chess)", TaskGroupType.MAIN, 2));
        TaskGroup tg3 = taskGroupRepository.save(new TaskGroup(user, "Thể hình (Gym)", TaskGroupType.MAIN, 3));

        // Tạo tài liệu tham khảo
        resourceRepository.save(new Resource(user, tg1, "Giáo trình Minna no Nihongo Sơ cấp I", "https://example.com", "Giáo trình chính đang học"));
        resourceRepository.save(new Resource(user, tg1, "Bộ thẻ Anki tiếng Nhật N4", "https://ankiweb.net", "Flashcard từ vựng ôn tập mỗi ngày"));
        resourceRepository.save(new Resource(user, tg2, "Nghiên cứu Lichess - Khai cuộc Sicilian", "https://lichess.org", "Hệ thống biến thể Sicilian Defence"));
        resourceRepository.save(new Resource(user, null, "Kết quả bóng đá Việt Nam", "https://example.com", "Tin tức các giải đấu bóng đá trong nước"));
        resourceRepository.save(new Resource(user, null, "Kinh nghiệm ứng dụng AI Agent", "https://example.com", "Tài liệu phương pháp làm việc cùng Agent"));

        // Xác định các mốc tuần: Tuần trước, Tuần này, Tuần sau
        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate prevMonday = currentMonday.minusWeeks(1);
        LocalDate nextMonday = currentMonday.plusWeeks(1);

        // Mục tiêu tuần (Weekly Goals)
        weeklyGoalRepository.save(new WeeklyGoal(tg1, prevMonday, "Hoàn thành chương 5 Minna no Nihongo"));
        weeklyGoalRepository.save(new WeeklyGoal(tg1, currentMonday, "Học từ vựng bài 26-27, luyện nghe đề thi N4"));
        weeklyGoalRepository.save(new WeeklyGoal(tg1, nextMonday, "Ôn tập tổng hợp ngữ pháp chương 5-6"));

        weeklyGoalRepository.save(new WeeklyGoal(tg2, prevMonday, "Giải 50 bài chiến thuật tàn cuộc xe"));
        weeklyGoalRepository.save(new WeeklyGoal(tg2, currentMonday, "Phân tích 10 ván chớp, nghiên cứu biến thể Sicilian"));
        weeklyGoalRepository.save(new WeeklyGoal(tg2, nextMonday, "Tham gia giải đấu Arena Lichess cuối tuần"));

        weeklyGoalRepository.save(new WeeklyGoal(tg3, prevMonday, "3 buổi tập: ngực, vai, chân"));
        weeklyGoalRepository.save(new WeeklyGoal(tg3, currentMonday, "4 buổi tập, tăng tạ Bench Press lên 62.5kg"));
        weeklyGoalRepository.save(new WeeklyGoal(tg3, nextMonday, "Duy trì 4 buổi tập, bổ sung 20 phút cardio mỗi buổi"));

        // Công việc con (Work Items) - Tuần trước
        workItemRepository.save(new WorkItem(tg1, prevMonday, "Xong bài 25 ngữ pháp Minna", WorkItemStatus.DONE, ""));
        workItemRepository.save(new WorkItem(tg1, prevMonday, "Anki 50 thẻ từ vựng mỗi ngày x 7 ngày", WorkItemStatus.DONE, ""));
        workItemRepository.save(new WorkItem(tg1, prevMonday, "Luyện nghe NHK Easy 3 bài", WorkItemStatus.DONE, ""));

        workItemRepository.save(new WorkItem(tg2, prevMonday, "50 bài giải đố tàn cuộc xe", WorkItemStatus.DONE, ""));
        workItemRepository.save(new WorkItem(tg2, prevMonday, "Xem chuỗi video tàn cuộc của Silman", WorkItemStatus.DONE, ""));

        workItemRepository.save(new WorkItem(tg3, prevMonday, "Đẩy ngực ngang 3x8 60kg", WorkItemStatus.DONE, ""));
        workItemRepository.save(new WorkItem(tg3, prevMonday, "Đẩy vai qua đầu 3x10", WorkItemStatus.DONE, ""));
        workItemRepository.save(new WorkItem(tg3, prevMonday, "Gánh đùi và kéo tạ buổi thứ 3", WorkItemStatus.DONE, ""));

        // Công việc con (Work Items) - Tuần này
        workItemRepository.save(new WorkItem(tg1, currentMonday, "Xong bài 26 ngữ pháp Minna", WorkItemStatus.IN_PROGRESS, "Đang làm phần 3/5"));
        workItemRepository.save(new WorkItem(tg1, currentMonday, "Học từ vựng Anki đến bài 27", WorkItemStatus.TODO, ""));
        workItemRepository.save(new WorkItem(tg1, currentMonday, "Làm bài thi thử JLPT N4 lần 1", WorkItemStatus.TODO, ""));

        workItemRepository.save(new WorkItem(tg2, currentMonday, "Phân tích 5 ván chớp cùng Stockfish", WorkItemStatus.IN_PROGRESS, ""));
        workItemRepository.save(new WorkItem(tg2, currentMonday, "Học biến thể Be3 Sicilian Najdorf", WorkItemStatus.TODO, ""));
        workItemRepository.save(new WorkItem(tg2, currentMonday, "Đấu 10 ván cờ chớp trên Lichess", WorkItemStatus.TODO, ""));

        workItemRepository.save(new WorkItem(tg3, currentMonday, "Đẩy ngực 62.5kg x 3 hiệp", WorkItemStatus.DONE, "Đã xong hôm thứ Hai"));
        workItemRepository.save(new WorkItem(tg3, currentMonday, "Chạy bộ 20 phút sau buổi tập", WorkItemStatus.IN_PROGRESS, "Đã hoàn thành 3/4 buổi"));
        workItemRepository.save(new WorkItem(tg3, currentMonday, "Gánh tạ Squat 70kg x 5 lần", WorkItemStatus.TODO, ""));

        // Đầu việc phụ (Side Tasks)
        sideTaskRepository.save(new SideTask(user, "Đặt lịch cắt tóc cuối tuần", false));
        sideTaskRepository.save(new SideTask(user, "Nộp hồ sơ gia hạn visa", false));
        sideTaskRepository.save(new SideTask(user, "Mua bao đựng vợt cầu lông", true));
        sideTaskRepository.save(new SideTask(user, "Đọc bài: Kỹ năng làm việc với AI Agent", false));
        sideTaskRepository.save(new SideTask(user, "Kiểm tra kết quả bóng đá vòng 12", true));
    }
}
