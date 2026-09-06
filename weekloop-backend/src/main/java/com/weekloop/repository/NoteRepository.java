package com.weekloop.repository;
import com.weekloop.entity.Note;
import com.weekloop.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface NoteRepository extends JpaRepository<Note, Long> { List<Note> findByUserOrderByUpdatedAtDesc(User user); Optional<Note> findByIdAndUser(Long id, User user); }
