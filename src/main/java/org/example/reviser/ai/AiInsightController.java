package org.example.reviser.ai;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/problems")
public class AiInsightController {

    private final AiReviewService aiReviewService;

    public AiInsightController(AiReviewService aiReviewService) {
        this.aiReviewService = aiReviewService;
    }

    @GetMapping("/{id}/insight")
    public ResponseEntity<Map<String, String>> getAiInsight(@PathVariable Long id) {
        String insight = aiReviewService.generateInsight(id);
        return ResponseEntity.ok(Map.of("problemId", id.toString(), "insight", insight));
    }
}
