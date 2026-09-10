package org.example.reviser.ai;

public interface AiReviewService {

    String generateInsight(Long problemId);
    AiSuggestion generateSuggestion(Long problemId);
}
