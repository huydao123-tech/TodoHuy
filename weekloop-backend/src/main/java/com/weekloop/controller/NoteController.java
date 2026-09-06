package com.weekloop.controller;
import com.weekloop.entity.User;
import com.weekloop.service.NoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/notes")
public class NoteController {
    private final NoteService service; public NoteController(NoteService service){this.service=service;}
    @GetMapping public ResponseEntity<List<NoteService.NoteResponse>> all(@AuthenticationPrincipal(expression="user") User u){return ResponseEntity.ok(service.all(u));}
    @PostMapping public ResponseEntity<NoteService.NoteResponse> create(@AuthenticationPrincipal(expression="user") User u,@RequestBody NoteService.NoteRequest r){return ResponseEntity.ok(service.create(u,r));}
    @PatchMapping("/{id}") public ResponseEntity<NoteService.NoteResponse> update(@AuthenticationPrincipal(expression="user") User u,@PathVariable Long id,@RequestBody NoteService.NoteRequest r){return ResponseEntity.ok(service.update(u,id,r));}
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@AuthenticationPrincipal(expression="user") User u,@PathVariable Long id){service.delete(u,id);return ResponseEntity.noContent().build();}
}
