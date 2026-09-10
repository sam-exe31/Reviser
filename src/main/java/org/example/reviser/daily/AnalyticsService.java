package org.example.reviser.daily;

import org.example.reviser.Dto.StreakDto;
import org.example.reviser.Dto.StabilityDto;
import org.example.reviser.Dto.WeeklyActivityDto;
import org.example.reviser.review.reviewState.ReviewState;
import org.example.reviser.review.reviewState.ReviewStateRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AnalyticsService {

    private final DailyTodoRepository todoRepository;
    private final ReviewStateRepository reviewStateRepository;

    public AnalyticsService(DailyTodoRepository todoRepository,
                            ReviewStateRepository reviewStateRepository) {
        this.todoRepository = todoRepository;
        this.reviewStateRepository = reviewStateRepository;
    }

    /**
     * Compute study streak from DailyTodo completions.
     *
     * Logic:
     * 1. Start from YESTERDAY and walk backward counting consecutive days
     *    with at least 1 completed DailyTodo.
     * 2. If TODAY also has completions, add 1 to the streak.
     * 3. Today is "grace" — not having completed anything yet today doesn't
     *    break the streak (the day isn't over).
     * 4. Best streak is the longest consecutive run across all time.
     */
    public StreakDto computeStreak() {
        LocalDate today = LocalDate.now();

        // Check if today has any completions
        boolean todayActive = todoRepository.countCompletedByDate(today) > 0;

        // Get all distinct dates with completions, sorted ascending
        List<LocalDate> allCompletedDates = todoRepository.findAllDistinctCompletedDates();
        if (allCompletedDates.isEmpty()) {
            return new StreakDto(0, false, 0);
        }

        // Build a set for O(1) lookup
        Set<LocalDate> completedSet = new HashSet<>(allCompletedDates);

        // Calculate current streak: walk backward from yesterday
        int currentStreak = 0;
        LocalDate checkDate = today.minusDays(1);
        while (completedSet.contains(checkDate)) {
            currentStreak++;
            checkDate = checkDate.minusDays(1);
        }

        // If today is also active, add 1
        if (todayActive) {
            currentStreak++;
        }

        // Calculate best streak: find longest consecutive run in allCompletedDates
        int bestStreak = 0;
        int runLength = 1;
        for (int i = 1; i < allCompletedDates.size(); i++) {
            LocalDate prev = allCompletedDates.get(i - 1);
            LocalDate curr = allCompletedDates.get(i);

            if (ChronoUnit.DAYS.between(prev, curr) == 1) {
                runLength++;
            } else {
                bestStreak = Math.max(bestStreak, runLength);
                runLength = 1;
            }
        }
        bestStreak = Math.max(bestStreak, runLength);

        // Ensure current streak is included in best
        bestStreak = Math.max(bestStreak, currentStreak);

        return new StreakDto(currentStreak, todayActive, bestStreak);
    }

    /**
     * Compute overall memory stability using the Ebbinghaus forgetting curve.
     *
     * For each problem with a ReviewState:
     *   daysSinceLastReview = today - lastReviewDate
     *   interval = max(1, reviewState.interval)
     *   retention = e^(-daysSinceLastReview / interval)
     *
     * Overall stability = average(retention) × 100
     *
     * Also counts how many problems are currently overdue.
     */
    public StabilityDto computeStability() {
        LocalDate today = LocalDate.now();
        List<ReviewState> allStates = reviewStateRepository.findAll();

        if (allStates.isEmpty()) {
            return new StabilityDto(0.0, 0, 0);
        }

        double totalRetention = 0.0;
        int overdueCount = 0;

        for (ReviewState state : allStates) {
            LocalDate lastReview = state.getLastReviewDate();
            if (lastReview == null) {
                // Never reviewed — 0% retention
                overdueCount++;
                continue;
            }

            long daysSince = ChronoUnit.DAYS.between(lastReview, today);
            int interval = Math.max(1, state.getInterval());

            // Ebbinghaus forgetting curve: R = e^(-t/S)
            double retention = Math.exp(-(double) daysSince / interval);
            totalRetention += retention;

            // Consider overdue if next review date is past
            if (state.getNextReviewDate() != null && state.getNextReviewDate().isBefore(today)) {
                overdueCount++;
            }
        }

        double averageStability = (totalRetention / allStates.size()) * 100.0;
        // Round to 1 decimal
        averageStability = Math.round(averageStability * 10.0) / 10.0;

        return new StabilityDto(averageStability, allStates.size(), overdueCount);
    }

    /**
     * Compute 7-day activity data from DailyTodo completions.
     * Returns data for the last 7 days (Mon-Sun of the current week).
     */
    public WeeklyActivityDto computeWeeklyActivity() {
        LocalDate today = LocalDate.now();
        // Get the Monday of the current week
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=Mon, 7=Sun
        LocalDate monday = today.minusDays(dayOfWeek - 1);

        List<WeeklyActivityDto.DayActivity> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate day = monday.plusDays(i);
            int count = todoRepository.countCompletedByDate(day);
            days.add(new WeeklyActivityDto.DayActivity(day, count > 0, count));
        }

        return new WeeklyActivityDto(days);
    }
}
