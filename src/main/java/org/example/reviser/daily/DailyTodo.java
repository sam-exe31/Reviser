package org.example.reviser.daily;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "daily_todos")
public class DailyTodo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String title;

    private String category; // "DSA", "Habit", "DBMS", "OS", "Core CS"

    @Column(name = "is_habit")
    private boolean isHabit;

    @Column(name = "estimated_minutes")
    private int estimatedMinutes;

    private boolean completed;

    @Column(name = "color_class")
    private String colorClass; // "box-blue", "box-amber", "box-purple", "box-green"

    @Column(name = "sort_order")
    private int sortOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "dailyTodo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<DailyTodoSubtask> subtasks = new ArrayList<>();

    public DailyTodo() {
        this.createdAt = LocalDateTime.now();
    }

    // Helpers
    public void addSubtask(DailyTodoSubtask subtask) {
        subtasks.add(subtask);
        subtask.setDailyTodo(this);
    }

    public void clearSubtasks() {
        subtasks.clear();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isHabit() { return isHabit; }
    public void setHabit(boolean habit) { isHabit = habit; }

    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public String getColorClass() { return colorClass; }
    public void setColorClass(String colorClass) { this.colorClass = colorClass; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<DailyTodoSubtask> getSubtasks() { return subtasks; }
    public void setSubtasks(List<DailyTodoSubtask> subtasks) { this.subtasks = subtasks; }
}
