package org.example.reviser.review.reviewState;


import org.example.reviser.Dto.DueReviewDto;
import org.example.reviser.problem.ProblemRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

    @RestController
    @RequestMapping("/reviews")
    public class ReviewStateController {

        private final ReviewStateRepository reviewStateRepository;
        private final ProblemRepository problemRepository;

        public ReviewStateController(ReviewStateRepository reviewStateRepository,
                                     ProblemRepository problemRepository) {
            this.reviewStateRepository = reviewStateRepository;
            this.problemRepository = problemRepository;
        }

        @GetMapping("/state/{problemId}")
        public ResponseEntity<ReviewState> getState(@PathVariable Long problemId) {
            return reviewStateRepository.findByProblemId(problemId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/due")
        public List<DueReviewDto> getDueReviews() {
            List<ReviewState> dueStates = reviewStateRepository.findByNextReviewDateLessThanEqual(LocalDate.now());

            // A ReviewState can outlive its Problem (e.g. the problem was deleted but
            // its review state row remained). Skip such orphaned states instead of
            // throwing — otherwise a single dangling row 500s the whole due list.
            return dueStates.stream()
                    .map(state -> problemRepository.findById(state.getProblemId())
                            .map(problem -> new DueReviewDto(
                                    problem.getId(),
                                    problem.getTitle(),
                                    problem.getPlatform(),
                                    problem.getPattern(),
                                    state.getReviewCount(),
                                    state.getEaseFactor()
                            ))
                            .orElse(null))
                    .filter(Objects::nonNull)
                    .toList();
        }

}
