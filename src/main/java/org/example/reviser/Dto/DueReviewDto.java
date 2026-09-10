package org.example.reviser.Dto;

public class DueReviewDto {

    private Long problemId;
    private String title;
    private String platform;
    private String pattern;
    private int reviewCount;
    private double easeFactor;

    public DueReviewDto(Long problemId, String title, String platform, String pattern,
                        int reviewCount, double easeFactor) {
        this.problemId = problemId;
        this.title = title;
        this.platform = platform;
        this.pattern = pattern;
        this.reviewCount = reviewCount;
        this.easeFactor = easeFactor;
    }

    public Long getProblemId() { return problemId; }
    public String getTitle() { return title; }
    public String getPlatform() { return platform; }
    public String getPattern() { return pattern; }
    public int getReviewCount() { return reviewCount; }
    public double getEaseFactor() { return easeFactor; }

}
