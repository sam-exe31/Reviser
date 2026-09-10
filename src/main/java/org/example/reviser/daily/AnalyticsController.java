package org.example.reviser.daily;

import org.example.reviser.Dto.StreakDto;
import org.example.reviser.Dto.StabilityDto;
import org.example.reviser.Dto.WeeklyActivityDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/streak")
    public StreakDto getStreak() {
        return analyticsService.computeStreak();
    }

    @GetMapping("/stability")
    public StabilityDto getStability() {
        return analyticsService.computeStability();
    }

    @GetMapping("/weekly-activity")
    public WeeklyActivityDto getWeeklyActivity() {
        return analyticsService.computeWeeklyActivity();
    }
}
