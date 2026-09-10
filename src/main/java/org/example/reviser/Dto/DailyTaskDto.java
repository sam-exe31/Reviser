package org.example.reviser.Dto;

import java.time.LocalDate;

public class DailyTaskDto {

    private String type; // "srs_review" or "daily_goal"
    private Long problemId;
    private String problemTitle;
    private String topic;
    private String difficulty;
    private String platform;
    private String category;
    private String status; // "flagged", "completed", "rolled_over"

    // SRS-specific fields
    private LocalDate lastReviewDate;
    private int reviewCount;
    private double easeFactor;

    public DailyTaskDto() {}

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getLastReviewDate() { return lastReviewDate; }
    public void setLastReviewDate(LocalDate lastReviewDate) { this.lastReviewDate = lastReviewDate; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(double easeFactor) { this.easeFactor = easeFactor; }
}
