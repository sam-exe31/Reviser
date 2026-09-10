package org.example.reviser.review;


import org.example.reviser.Dto.ReviewRequestDto;
import org.example.reviser.Dto.ReviewResponseDto;
import org.example.reviser.ExceptionHandler.ProblemNotFoundException;
import org.example.reviser.ai.AiReviewService;
import org.example.reviser.ai.AiSuggestion;
import org.example.reviser.problem.ProblemRepository;
import org.example.reviser.review.reviewState.ReviewState;
import org.example.reviser.review.reviewState.ReviewStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);

    private final ReviewRepository reviewRepository;
    private final ReviewStateRepository reviewStateRepository;
    private final ProblemRepository problemRepository;
    private final AiReviewService aiReviewService;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             ReviewStateRepository reviewStateRepository,
                             ProblemRepository problemRepository,
                             AiReviewService aiReviewService) {
        this.reviewRepository = reviewRepository;
        this.reviewStateRepository = reviewStateRepository;
        this.problemRepository = problemRepository;
        this.aiReviewService = aiReviewService;
    }

    @Override
    public ReviewResponseDto recordReview(Long problemId, ReviewRequestDto dto) {
        if (!problemRepository.existsById(problemId)) {
            throw new ProblemNotFoundException(problemId);
        }

        // Convert DTO to entity — server controls id, problemId, and reviewedAt
        Review review = new Review();
        review.setProblemId(problemId);
        review.setReviewedAt(LocalDateTime.now());
        review.setConfidence(dto.getConfidence());
        review.setSolvedWithoutHelp(dto.isSolvedWithoutHelp());
        review.setNeededHint(dto.isNeededHint());
        review.setRememberedPattern(dto.isRememberedPattern());
        review.setCouldExplainSolution(dto.isCouldExplainSolution());
        review.setNotes(dto.getNotes());

        Review savedReview = reviewRepository.save(review);

        ReviewState state = reviewStateRepository.findByProblemId(problemId)
                .orElseGet(() -> {
                    ReviewState newState = new ReviewState();
                    newState.setProblemId(problemId);
                    newState.setEaseFactor(2.5);
                    newState.setInterval(1);
                    newState.setConsecutiveSuccesses(0);
                    return newState;
                });

        int quality = review.getConfidence();

        state.setLastReviewDate(LocalDate.now());
        state.setReviewCount(state.getReviewCount() + 1);
        state.setRating(quality);

        if (quality < 3) {
            state.setConsecutiveSuccesses(0);
            state.setInterval(1);
        } else {
            state.setConsecutiveSuccesses(state.getConsecutiveSuccesses() + 1);

            if (state.getConsecutiveSuccesses() == 1) {
                state.setInterval(1);
            } else if (state.getConsecutiveSuccesses() == 2) {
                state.setInterval(6);
            } else {
                state.setInterval((int) Math.round(state.getInterval() * state.getEaseFactor()));
            }
        }

        double newEase = state.getEaseFactor() + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        if (review.isNeededHint()) {
            newEase -= 0.15;
        }
        if (!review.isCouldExplainSolution()) {
            newEase -= 0.15;
        }

        if (newEase < 1.3) {
            newEase = 1.3;
        }
        state.setEaseFactor(newEase);

        // --- AI-adjusted scheduling (safe fallback to pure SM-2) ---
        double multiplier = 1.0;
        try {
            AiSuggestion suggestion = aiReviewService.generateSuggestion(problemId);
            multiplier = suggestion.intervalMultiplier();
            // Clamp to [0.5, 1.5] — never trust AI output blindly
            multiplier = Math.max(0.5, Math.min(1.5, multiplier));
            log.info("AI suggestion for problem {}: multiplier={}, insight='{}'",
                    problemId, multiplier, suggestion.insight());
        } catch (Exception e) {
            log.warn("AI suggestion failed for problem {}, falling back to pure SM-2: {}",
                    problemId, e.getMessage());
            multiplier = 1.0;
        }

        // Keep the pure SM-2 interval in state (so the next review multiplies a clean
        // value, not an already-AI-adjusted one). Apply the multiplier ONLY to the
        // scheduled date — otherwise the AI nudge compounds every review and the
        // interval progression drifts away from SM-2.
        int scheduledInterval = (int) Math.max(1, Math.round(state.getInterval() * multiplier));
        state.setNextReviewDate(LocalDate.now().plusDays(scheduledInterval));

        reviewStateRepository.save(state);

        // Convert entity to response DTO
        return new ReviewResponseDto(
                savedReview.getId(),
                savedReview.getProblemId(),
                savedReview.getReviewedAt(),
                savedReview.getConfidence(),
                savedReview.isSolvedWithoutHelp(),
                savedReview.isNeededHint(),
                savedReview.isRememberedPattern(),
                savedReview.isCouldExplainSolution(),
                savedReview.getNotes()
        );
    }
}