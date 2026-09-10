package org.example.reviser.goal;

import jakarta.validation.Valid;
import org.example.reviser.Dto.DailyBreakdownDto;
import org.example.reviser.Dto.MonthlyGoalRequestDto;
import org.example.reviser.Dto.MonthlyGoalResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/goals")
public class GoalController {

    private final GoalSlicingService goalSlicingService;

    public GoalController(GoalSlicingService goalSlicingService) {
        this.goalSlicingService = goalSlicingService;
    }

    @PostMapping
    public ResponseEntity<MonthlyGoalResponseDto> setMonthlyGoal(@Valid @RequestBody MonthlyGoalRequestDto dto) {
        return ResponseEntity.ok(goalSlicingService.createOrUpdateGoal(dto));
    }

    @PostMapping("/draft")
    public ResponseEntity<MonthlyGoalResponseDto> saveGoalDraft(@Valid @RequestBody MonthlyGoalRequestDto dto) {
        return ResponseEntity.ok(goalSlicingService.saveDraft(dto));
    }

    @GetMapping("/current")
    public ResponseEntity<MonthlyGoalResponseDto> getCurrentMonthGoal() {
        return goalSlicingService.getCurrentMonthGoal()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{month}")
    public ResponseEntity<MonthlyGoalResponseDto> getGoalByMonth(@PathVariable String month) {
        return goalSlicingService.getGoalByMonth(month)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/daily")
    public ResponseEntity<DailyBreakdownDto> getDailyBreakdown(
            @RequestParam(required = false) String date) {
        LocalDate forDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(goalSlicingService.calculateDailyBreakdown(forDate));
    }
}
