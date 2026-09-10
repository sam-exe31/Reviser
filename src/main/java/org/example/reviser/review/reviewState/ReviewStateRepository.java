package org.example.reviser.review.reviewState;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ReviewStateRepository extends JpaRepository<ReviewState, Long> {
    Optional<ReviewState> findByProblemId(Long problemId);
    List<ReviewState> findByNextReviewDateLessThanEqual(LocalDate date);
}
