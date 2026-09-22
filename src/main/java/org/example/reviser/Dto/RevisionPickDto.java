package org.example.reviser.Dto;

/**
 * One problem surfaced in the daily "Today's problems to revise" panel.
 * Sourced from the solved-problems list (Problem + its SM-2 ReviewState),
 * ranked by due-ness / rating and flagged when it is a high-frequency
 * interview topic. {@code reason} is the AI's one-line justification when a
 * Gemini key is present, otherwise a short deterministic note.
 */
public class RevisionPickDto {

    private Long problemId;
    private String title;
    private String platform;
    private String pattern;
    private String difficulty;
    private String nextReviewDate; // ISO yyyy-MM-dd, or null if never revised
    private int reviewCount;
    private double easeFactor;
    private int rating;
    private boolean important;
    private String reason;

    public RevisionPickDto() {}

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(String nextReviewDate) { this.nextReviewDate = nextReviewDate; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(double easeFactor) { this.easeFactor = easeFactor; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public boolean isImportant() { return important; }
    public void setImportant(boolean important) { this.important = important; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
