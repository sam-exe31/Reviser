package org.example.reviser.Dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class GoalTargetDto {

    @NotBlank(message = "Category is required")
    private String category;

    @Min(value = 1, message = "Target count must be at least 1")
    private int targetCount;

    private int completedCount;

    public GoalTargetDto() {}

    public GoalTargetDto(String category, int targetCount, int completedCount) {
        this.category = category;
        this.targetCount = targetCount;
        this.completedCount = completedCount;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getTargetCount() { return targetCount; }
    public void setTargetCount(int targetCount) { this.targetCount = targetCount; }

    public int getCompletedCount() { return completedCount; }
    public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }
}
