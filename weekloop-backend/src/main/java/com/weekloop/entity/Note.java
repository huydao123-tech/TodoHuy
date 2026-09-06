package com.weekloop.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 180) private String title;
    @Column(columnDefinition = "TEXT") private String content = "";
    @Column(length = 20) private String color = "stone";
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();
    public Note() {}
    public Note(User user, String title, String content, String color) { this.user=user; this.title=title; this.content=content == null ? "" : content; this.color=color == null ? "stone" : color; }
    public Long getId(){return id;} public User getUser(){return user;} public String getTitle(){return title;} public String getContent(){return content;} public String getColor(){return color;} public LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setTitle(String value){title=value;} public void setContent(String value){content=value;} public void setColor(String value){color=value;} @PreUpdate public void touch(){updatedAt=LocalDateTime.now();}
}
