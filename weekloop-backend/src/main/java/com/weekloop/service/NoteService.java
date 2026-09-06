package com.weekloop.service;
import com.weekloop.entity.Note;
import com.weekloop.entity.User;
import com.weekloop.repository.NoteRepository;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class NoteService {
    public record NoteRequest(String title, String content, String color) {}
    public record NoteResponse(Long id, String title, String content, String color, java.time.LocalDateTime updatedAt) {}
    private final NoteRepository repository; public NoteService(NoteRepository repository){this.repository=repository;}
    private NoteResponse dto(Note n){return new NoteResponse(n.getId(),n.getTitle(),n.getContent(),n.getColor(),n.getUpdatedAt());}
    public List<NoteResponse> all(User u){return repository.findByUserOrderByUpdatedAtDesc(u).stream().map(this::dto).toList();}
    public NoteResponse create(User u, NoteRequest r){return dto(repository.save(new Note(u,r.title(),r.content(),r.color())));}
    public NoteResponse update(User u, Long id, NoteRequest r){Note n=repository.findByIdAndUser(id,u).orElseThrow(()->new IllegalArgumentException("Không tìm thấy ghi chú!")); if(r.title()!=null)n.setTitle(r.title());if(r.content()!=null)n.setContent(r.content());if(r.color()!=null)n.setColor(r.color());return dto(repository.save(n));}
    public void delete(User u, Long id){repository.delete(repository.findByIdAndUser(id,u).orElseThrow(()->new IllegalArgumentException("Không tìm thấy ghi chú!")));}
}
