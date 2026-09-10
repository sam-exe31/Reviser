package org.example.reviser.review;

import org.example.reviser.Dto.ReviewRequestDto;
import org.example.reviser.Dto.ReviewResponseDto;

public interface ReviewService {
    ReviewResponseDto recordReview(Long problemId, ReviewRequestDto dto);
}
