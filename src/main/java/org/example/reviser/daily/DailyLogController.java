package org.example.reviser.daily;

import org.example.reviser.Dto.DailyOverviewDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/daily")
public class DailyLogController {

    private final DailyLogService dailyLogService;

    public DailyLogController(DailyLogService dailyLogService) {
        this.dailyLogService = dailyLogService;
    }

    @GetMapping("/today")
    public ResponseEntity<DailyOverviewDto> getTodayOverview() {
        return ResponseEntity.ok(dailyLogService.getTodayOverview());
    }

    @PostMapping("/complete/{problemId}")
    public ResponseEntity<Map<String, String>> completeTask(
            @PathVariable Long problemId,
            @RequestParam(required = false, defaultValue = "dsa") String category) {
        dailyLogService.markTaskCompleted(problemId, category);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Task marked as completed"));
    }

    @PostMapping("/rollover")
    public ResponseEntity<Map<String, Object>> rolloverMissedTasks() {
        int count = dailyLogService.rolloverMissedTasks();
        return ResponseEntity.ok(Map.of("status", "success", "rolledOverCount", count));
    }
}
