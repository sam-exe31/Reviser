package org.example.reviser.ai;

import jakarta.validation.Valid;
import org.example.reviser.Dto.ChatParseRequestDto;
import org.example.reviser.Dto.ChatParseResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
public class ChatParseController {

    private final GeminiParsingService geminiParsingService;
    private final org.example.reviser.problem.LeetCodeService leetCodeService;

    public ChatParseController(GeminiParsingService geminiParsingService,
                               org.example.reviser.problem.LeetCodeService leetCodeService) {
        this.geminiParsingService = geminiParsingService;
        this.leetCodeService = leetCodeService;
    }

    @PostMapping("/leetcode-lookup")
    public ResponseEntity<java.util.Map<String, Object>> leetcodeLookup(@RequestBody java.util.Map<String, Object> body) {
        String number = body.getOrDefault("number", "").toString();
        java.util.Map<String, Object> response = leetCodeService.fetchProblemByNumber(number);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/leetcode-recent")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> leetcodeRecent(@RequestBody java.util.Map<String, Object> body) {
        String username = body.getOrDefault("username", "").toString();
        int limit = body.containsKey("limit") ? Integer.parseInt(body.get("limit").toString()) : 50;
        java.util.List<java.util.Map<String, Object>> response = leetCodeService.fetchRecentAcSubmissions(username, limit);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/evaluate-rescheduling")
    public ResponseEntity<java.util.Map<String, Object>> evaluateRescheduling(@RequestBody java.util.Map<String, Object> body) {
        String stepTitle = body.getOrDefault("stepTitle", "").toString();
        String category = body.getOrDefault("category", "DSA").toString();
        Integer targetCount = body.containsKey("targetCount") ? Integer.valueOf(body.get("targetCount").toString()) : 10;
        Integer completedCount = body.containsKey("completedCount") ? Integer.valueOf(body.get("completedCount").toString()) : 0;
        String context = body.containsKey("context") ? body.get("context").toString() : "";
        java.util.Map<String, Object> response = geminiParsingService.evaluateStepRescheduling(stepTitle, category, targetCount, completedCount, context);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/parse")
    public ResponseEntity<ChatParseResponseDto> parseMessage(@Valid @RequestBody ChatParseRequestDto dto) {
        ChatParseResponseDto result = geminiParsingService.parseUserMessage(dto.getMessage());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/converse")
    public ResponseEntity<java.util.Map<String, Object>> converse(@RequestBody java.util.Map<String, Object> body) {
        String message = body.getOrDefault("message", "").toString();
        String mode = body.getOrDefault("mode", "general").toString();
        Object history = body.get("history");
        java.util.Map<String, Object> response = geminiParsingService.converseWithAssistant(message, history, mode);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/goal-cross-questions")
    public ResponseEntity<java.util.Map<String, Object>> goalCrossQuestions(@RequestBody java.util.Map<String, Object> body) {
        String prompt = body.getOrDefault("prompt", "").toString();
        java.util.Map<String, Object> response = geminiParsingService.generateGoalCrossQuestions(prompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/analyze-goal-live")
    public ResponseEntity<java.util.Map<String, Object>> analyzeGoalLive(@RequestBody java.util.Map<String, Object> body) {
        String prompt = body.getOrDefault("prompt", "").toString();
        String month = body.containsKey("month") ? body.get("month").toString() : null;
        @SuppressWarnings("unchecked")
        java.util.Map<String, String> answers = body.containsKey("answers") && body.get("answers") instanceof java.util.Map
                ? (java.util.Map<String, String>) body.get("answers")
                : java.util.Collections.emptyMap();
        java.util.Map<String, Object> response = geminiParsingService.analyzeGoalLive(prompt, answers, month);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/plan-goals")
    public ResponseEntity<java.util.Map<String, Object>> planGoals(@RequestBody java.util.Map<String, Object> body) {
        String prompt = body.getOrDefault("prompt", "").toString();
        java.util.Map<String, Object> response = geminiParsingService.generateGoalPlan(prompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/plan-daily")
    public ResponseEntity<java.util.Map<String, Object>> planDaily(@RequestBody java.util.Map<String, Object> body) {
        String prompt = body.getOrDefault("prompt", "").toString();
        java.util.Map<String, Object> response = geminiParsingService.generateDailyTodoList(prompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/plan-master-daily")
    public ResponseEntity<java.util.Map<String, Object>> planMasterDaily(@RequestBody java.util.Map<String, Object> body) {
        String date = body.containsKey("date") ? body.get("date").toString() : null;
        Integer weekNum = body.containsKey("weekNumber") ? Integer.valueOf(body.get("weekNumber").toString()) : null;
        String prompt = body.getOrDefault("prompt", "").toString();
        java.util.Map<String, Object> response = geminiParsingService.generateMasterDailyPlan(date, weekNum, prompt);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate-subtasks")
    public ResponseEntity<java.util.Map<String, Object>> generateSubtasks(@RequestBody java.util.Map<String, Object> body) {
        String title = body.getOrDefault("title", "").toString();
        String category = body.getOrDefault("category", "General").toString();
        java.util.Map<String, Object> response = geminiParsingService.generateSubtasksForTask(title, category);
        return ResponseEntity.ok(response);
    }
}
