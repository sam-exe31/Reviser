package org.example.reviser.Dto;

import java.util.List;

public class DailyTodoRequestDto {

    private String title;
    private String category;
    private boolean isHabit;
    private int estimatedMinutes;
    private String colorClass;
    private String date; // "yyyy-MM-dd", optional — defaults to today
    private List<SubtaskDto> subtasks;

    public DailyTodoRequestDto() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public boolean isHabit() { return isHabit; }
    public void setHabit(boolean habit) { isHabit = habit; }

    public int getEstimatedMinutes() { return estimatedMinutes; }
    public void setEstimatedMinutes(int estimatedMinutes) { this.estimatedMinutes = estimatedMinutes; }

    public String getColorClass() { return colorClass; }
    public void setColorClass(String colorClass) { this.colorClass = colorClass; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<SubtaskDto> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubtaskDto> subtasks) { this.subtasks = subtasks; }

    public static class SubtaskDto {
        private String title;
        private String category;

        public SubtaskDto() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }
}
