package org.example.reviser.review;

import org.example.reviser.Dto.ReviewRequestDto;
import org.example.reviser.Dto.ReviewResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/problems/{problemId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;

    public ReviewController(ReviewService reviewService, ReviewRepository reviewRepository) {
        this.reviewService = reviewService;
        this.reviewRepository = reviewRepository;
    }

    @PostMapping
    public ResponseEntity<ReviewResponseDto> recordReview(
            @PathVariable Long problemId,
            @Valid @RequestBody ReviewRequestDto dto) {

        ReviewResponseDto saved = reviewService.recordReview(problemId, dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<ReviewResponseDto> getHistory(@PathVariable Long problemId) {
        return reviewRepository.findByProblemIdOrderByReviewedAtAsc(problemId)
                .stream()
                .map(this::toResponseDto)
                .toList();
    }

    private ReviewResponseDto toResponseDto(Review review) {
        return new ReviewResponseDto(
                review.getId(),
                review.getProblemId(),
                review.getReviewedAt(),
                review.getConfidence(),
                review.isSolvedWithoutHelp(),
                review.isNeededHint(),
                review.isRememberedPattern(),
                review.isCouldExplainSolution(),
                review.getNotes()
        );
    }
}