package org.example.reviser.ai;

import org.springframework.beans.factory.annotation.Value;
import org.example.reviser.review.Review;
import org.example.reviser.review.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
public class AiReviewServiceImpl implements AiReviewService {

    private static final Logger log = LoggerFactory.getLogger(AiReviewServiceImpl.class);

    private final ReviewRepository reviewRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String geminiModel;

    private String getGeminiUrl() {
        String model = (geminiModel != null && !geminiModel.trim().isEmpty()) ? geminiModel.trim() : "gemini-3.6-flash";
        String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return baseUrl + "?key=" + apiKey.trim();
        }
        return baseUrl;
    }

    public AiReviewServiceImpl(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(12000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public String generateInsight(Long problemId) {
        List<Review> history = reviewRepository.findByProblemIdOrderByReviewedAtAsc(problemId);

        if (history.isEmpty()) {
            return "No review history yet for this problem.";
        }

        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < history.size(); i++) {
            Review r = history.get(i);
            summary.append("Review ").append(i + 1).append(": ")
                    .append("confidence=").append(r.getConfidence())
                    .append(", neededHint=").append(r.isNeededHint())
                    .append(", couldExplain=").append(r.isCouldExplainSolution())
                    .append(", solvedWithoutHelp=").append(r.isSolvedWithoutHelp())
                    .append("\n");
        }

        String prompt = "Here is a student's review history for one coding problem, oldest to newest:\n\n"
                + summary
                + "\nIn 2-3 sentences, tell them honestly how their retention on this problem is trending, "
                + "and one concrete thing to focus on next time. Be direct, not generic encouragement.";

        try {
            return callGemini(prompt);
        } catch (Exception e) {
            log.warn("Gemini insight call failed for problem {}: {}", problemId, e.getMessage());
            return "AI insight unavailable.";
        }
    }

    @Override
    public AiSuggestion generateSuggestion(Long problemId) {
        List<Review> history = reviewRepository.findByProblemIdOrderByReviewedAtAsc(problemId);

        if (history.isEmpty()) {
            return new AiSuggestion("No history yet.", 1.0);
        }

        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < history.size(); i++) {
            Review r = history.get(i);
            summary.append("Review ").append(i + 1).append(": ")
                    .append("confidence=").append(r.getConfidence())
                    .append(", neededHint=").append(r.isNeededHint())
                    .append(", couldExplain=").append(r.isCouldExplainSolution())
                    .append(", solvedWithoutHelp=").append(r.isSolvedWithoutHelp())
                    .append("\n");
        }

        String prompt = "Review history for one coding problem, oldest to newest:\n\n" + summary
                + "\nRespond with ONLY raw JSON, no markdown, no backticks, in this exact shape: "
                + "{\"insight\": \"one sentence on retention trend\", \"intervalMultiplier\": 1.0}. "
                + "intervalMultiplier: 1.0 means trust the normal schedule, below 1.0 (down to 0.5) means "
                + "review sooner than normal because retention looks fragile, above 1.0 (up to 1.5) means "
                + "the student is overlearning this one and the gap could stretch further.";

        try {
            String rawText = callGemini(prompt).trim();
            if (rawText.startsWith("```json")) rawText = rawText.substring(7);
            else if (rawText.startsWith("```")) rawText = rawText.substring(3);
            if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length() - 3);
            rawText = rawText.trim();

            JsonNode parsed = objectMapper.readTree(rawText);
            return new AiSuggestion(
                    parsed.get("insight").asText(),
                    parsed.get("intervalMultiplier").asDouble()
            );
        } catch (Exception e) {
            log.warn("Gemini suggestion call failed for problem {}: {}", problemId, e.getMessage());
            return new AiSuggestion("AI unavailable, using standard schedule.", 1.0);
        }
    }

    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-goog-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        String body = """
                {
                  "contents": [{
                    "parts": [{"text": %s}]
                  }]
                }
                """.formatted(objectMapper.valueToTree(prompt).toString());

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

        if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
            JsonNode candidate = response.get("candidates").get(0);
            if (candidate.has("content") && candidate.get("content").has("parts")) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode part : candidate.get("content").get("parts")) {
                    if (part.hasNonNull("text")) {
                        sb.append(part.get("text").asText());
                    }
                }
                if (sb.length() > 0) {
                    return sb.toString();
                }
            }
        }
        return "{}";
    }
}