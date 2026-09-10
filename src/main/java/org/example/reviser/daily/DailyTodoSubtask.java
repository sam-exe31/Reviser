package org.example.reviser.daily;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "daily_todo_subtasks")
public class DailyTodoSubtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_todo_id", nullable = false)
    @JsonIgnore
    private DailyTodo dailyTodo;

    @Column(nullable = false)
    private String title;

    private String category; // "Code", "Review", "Warmup", "Theory"

    private boolean completed;

    @Column(name = "sort_order")
    private int sortOrder;

    public DailyTodoSubtask() {}

    public DailyTodoSubtask(String title, String category, boolean completed, int sortOrder) {
        this.title = title;
        this.category = category;
        this.completed = completed;
        this.sortOrder = sortOrder;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DailyTodo getDailyTodo() { return dailyTodo; }
    public void setDailyTodo(DailyTodo dailyTodo) { this.dailyTodo = dailyTodo; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
