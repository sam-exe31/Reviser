package org.example.reviser.Dto;

import java.time.LocalDate;
import java.util.List;

public class DailyBreakdownDto {

    private LocalDate date;
    private int remainingDays;
    private List<CategoryBreakdownDto> categories;

    public DailyBreakdownDto() {}

    public DailyBreakdownDto(LocalDate date, int remainingDays, List<CategoryBreakdownDto> categories) {
        this.date = date;
        this.remainingDays = remainingDays;
        this.categories = categories;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getRemainingDays() { return remainingDays; }
    public void setRemainingDays(int remainingDays) { this.remainingDays = remainingDays; }

    public List<CategoryBreakdownDto> getCategories() { return categories; }
    public void setCategories(List<CategoryBreakdownDto> categories) { this.categories = categories; }

    public static class CategoryBreakdownDto {

        private String category;
        private int dailyTarget;
        private int remaining;
        private int totalTarget;
        private int completed;

        public CategoryBreakdownDto() {}

        public CategoryBreakdownDto(String category, int dailyTarget, int remaining,
                                     int totalTarget, int completed) {
            this.category = category;
            this.dailyTarget = dailyTarget;
            this.remaining = remaining;
            this.totalTarget = totalTarget;
            this.completed = completed;
        }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public int getDailyTarget() { return dailyTarget; }
        public void setDailyTarget(int dailyTarget) { this.dailyTarget = dailyTarget; }

        public int getRemaining() { return remaining; }
        public void setRemaining(int remaining) { this.remaining = remaining; }

        public int getTotalTarget() { return totalTarget; }
        public void setTotalTarget(int totalTarget) { this.totalTarget = totalTarget; }

        public int getCompleted() { return completed; }
        public void setCompleted(int completed) { this.completed = completed; }
    }
}
