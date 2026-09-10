package org.example.reviser.Dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DailyTodoResponseDto {

    private Long id;
    private LocalDate date;
    private String title;
    private String category;
    private boolean isHabit;
    private int estimatedMinutes;
    private boolean completed;
    private String colorClass;
    private int sortOrder;
    private LocalDateTime createdAt;
    private List<SubtaskResponseDto> subtasks;

    public DailyTodoResponseDto() {}

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

    public List<SubtaskResponseDto> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubtaskResponseDto> subtasks) { this.subtasks = subtasks; }

    public static class SubtaskResponseDto {
        private Long id;
        private String title;
        private String category;
        private boolean completed;
        private int sortOrder;

        public SubtaskResponseDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public boolean isCompleted() { return completed; }
        public void setCompleted(boolean completed) { this.completed = completed; }

        public int getSortOrder() { return sortOrder; }
        public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    }
}
