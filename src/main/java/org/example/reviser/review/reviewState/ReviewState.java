package org.example.reviser.review.reviewState;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "review_states")
public class ReviewState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false, unique = true)
    private Long problemId;

    private int rating;

    @Column(name = "last_review_date")
    private LocalDate lastReviewDate;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "review_count")
    private int reviewCount;

    @Column(name = "consecutive_successes")
    private int consecutiveSuccesses;

    @Column(name = "ease_factor")
    private double easeFactor;

    private int interval;

    public ReviewState() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public LocalDate getLastReviewDate() { return lastReviewDate; }
    public void setLastReviewDate(LocalDate lastReviewDate) { this.lastReviewDate = lastReviewDate; }

    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate nextReviewDate) { this.nextReviewDate = nextReviewDate; }

    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }

    public int getConsecutiveSuccesses() { return consecutiveSuccesses; }
    public void setConsecutiveSuccesses(int consecutiveSuccesses) { this.consecutiveSuccesses = consecutiveSuccesses; }

    public double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(double easeFactor) { this.easeFactor = easeFactor; }

    public int getInterval() { return interval; }
    public void setInterval(int interval) { this.interval = interval; }
}