package org.example.reviser.Dto;

import java.time.LocalDateTime;

public class ReviewResponseDto {

    private Long id;
    private Long problemId;
    private LocalDateTime reviewedAt;
    private int confidence;
    private boolean solvedWithoutHelp;
    private boolean neededHint;
    private boolean rememberedPattern;
    private boolean couldExplainSolution;
    private String notes;

    public ReviewResponseDto() {}

    public ReviewResponseDto(Long id, Long problemId, LocalDateTime reviewedAt, int confidence,
                             boolean solvedWithoutHelp, boolean neededHint,
                             boolean rememberedPattern, boolean couldExplainSolution,
                             String notes) {
        this.id = id;
        this.problemId = problemId;
        this.reviewedAt = reviewedAt;
        this.confidence = confidence;
        this.solvedWithoutHelp = solvedWithoutHelp;
        this.neededHint = neededHint;
        this.rememberedPattern = rememberedPattern;
        this.couldExplainSolution = couldExplainSolution;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public boolean isSolvedWithoutHelp() { return solvedWithoutHelp; }
    public void setSolvedWithoutHelp(boolean solvedWithoutHelp) { this.solvedWithoutHelp = solvedWithoutHelp; }

    public boolean isNeededHint() { return neededHint; }
    public void setNeededHint(boolean neededHint) { this.neededHint = neededHint; }

    public boolean isRememberedPattern() { return rememberedPattern; }
    public void setRememberedPattern(boolean rememberedPattern) { this.rememberedPattern = rememberedPattern; }

    public boolean isCouldExplainSolution() { return couldExplainSolution; }
    public void setCouldExplainSolution(boolean couldExplainSolution) { this.couldExplainSolution = couldExplainSolution; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
