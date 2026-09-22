package org.example.reviser.review;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;

    @Column(name = "solved_without_help")
    private boolean solvedWithoutHelp;

    @Column(name = "needed_hint")
    private boolean neededHint;

    @Column(name = "remembered_pattern")
    private boolean rememberedPattern;

    @Column(name = "could_explain_solution")
    private boolean couldExplainSolution;

    private int confidence;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public Review() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public boolean isSolvedWithoutHelp() { return solvedWithoutHelp; }
    public void setSolvedWithoutHelp(boolean solvedWithoutHelp) { this.solvedWithoutHelp = solvedWithoutHelp; }

    public boolean isNeededHint() { return neededHint; }
    public void setNeededHint(boolean neededHint) { this.neededHint = neededHint; }

    public boolean isRememberedPattern() { return rememberedPattern; }
    public void setRememberedPattern(boolean rememberedPattern) { this.rememberedPattern = rememberedPattern; }

    public boolean isCouldExplainSolution() { return couldExplainSolution; }
    public void setCouldExplainSolution(boolean couldExplainSolution) { this.couldExplainSolution = couldExplainSolution; }

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}