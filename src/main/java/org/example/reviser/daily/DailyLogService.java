package org.example.reviser.daily;

import org.example.reviser.Dto.*;
import org.example.reviser.Dto.DailyBreakdownDto;
import org.example.reviser.Dto.DailyOverviewDto;
import org.example.reviser.Dto.DailyTaskDto;
import org.example.reviser.goal.GoalSlicingService;
import org.example.reviser.goal.MonthlyGoal;
import org.example.reviser.goal.MonthlyGoalRepository;
import org.example.reviser.problem.Problem;
import org.example.reviser.problem.ProblemRepository;
import org.example.reviser.review.reviewState.ReviewState;
import org.example.reviser.review.reviewState.ReviewStateRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DailyLogService {

    private static final Logger log = LoggerFactory.getLogger(DailyLogService.class);

    private final DailyLogRepository dailyLogRepository;
    private final DailyLogEntryRepository dailyLogEntryRepository;
    private final ProblemRepository problemRepository;
    private final ReviewStateRepository reviewStateRepository;
    private final MonthlyGoalRepository monthlyGoalRepository;
    private final GoalSlicingService goalSlicingService;
    private final AnalyticsService analyticsService;

    public DailyLogService(DailyLogRepository dailyLogRepository,
                           DailyLogEntryRepository dailyLogEntryRepository,
                           ProblemRepository problemRepository,
                           ReviewStateRepository reviewStateRepository,
                           MonthlyGoalRepository monthlyGoalRepository,
                           GoalSlicingService goalSlicingService,
                           AnalyticsService analyticsService) {
        this.dailyLogRepository = dailyLogRepository;
        this.dailyLogEntryRepository = dailyLogEntryRepository;
        this.problemRepository = problemRepository;
        this.reviewStateRepository = reviewStateRepository;
        this.monthlyGoalRepository = monthlyGoalRepository;
        this.goalSlicingService = goalSlicingService;
        this.analyticsService = analyticsService;
    }

    @Transactional
    public DailyOverviewDto getTodayOverview() {
        LocalDate today = LocalDate.now();
        // Automatic catch-up: ensure midnight rollover is completed for today
        rolloverMissedTasks();
        DailyLog dailyLog = getOrCreateDailyLog(today);

        // 1. Get due SRS reviews
        List<ReviewState> dueStates = reviewStateRepository.findByNextReviewDateLessThanEqual(today);
        List<DailyTaskDto> tasks = new ArrayList<>();

        for (ReviewState state : dueStates) {
            Problem p = problemRepository.findById(state.getProblemId()).orElse(null);
            if (p != null) {
                DailyTaskDto task = new DailyTaskDto();
                task.setType("srs_review");
                task.setProblemId(p.getId());
                task.setProblemTitle(p.getTitle());
                task.setTopic(p.getPattern());
                task.setDifficulty(p.getDifficulty() != null ? p.getDifficulty().name() : "Medium");
                task.setPlatform(p.getPlatform());
                task.setCategory("dsa");

                // Check if already completed today in daily log
                Optional<DailyLogEntry> entryOpt = dailyLogEntryRepository
                        .findByDailyLogIdAndProblemId(dailyLog.getId(), p.getId());
                if (entryOpt.isPresent() && entryOpt.get().getStatus() == TaskStatus.COMPLETED) {
                    task.setStatus("completed");
                } else {
                    task.setStatus("flagged");
                }

                task.setLastReviewDate(state.getLastReviewDate());
                task.setReviewCount(state.getReviewCount());
                task.setEaseFactor(state.getEaseFactor());

                tasks.add(task);
            }
        }

        // 2. Include any explicit daily log entries (e.g. non-SRS logged problems or custom tasks)
        List<DailyLogEntry> entries = dailyLogEntryRepository.findByDailyLogId(dailyLog.getId());
        Set<Long> srsProblemIds = new HashSet<>();
        for (ReviewState s : dueStates) {
            srsProblemIds.add(s.getProblemId());
        }

        for (DailyLogEntry entry : entries) {
            if (entry.getProblemId() != null && !srsProblemIds.contains(entry.getProblemId())) {
                Problem p = problemRepository.findById(entry.getProblemId()).orElse(null);
                DailyTaskDto task = new DailyTaskDto();
                task.setType("daily_goal");
                task.setProblemId(entry.getProblemId());
                if (p != null) {
                    task.setProblemTitle(p.getTitle());
                    task.setTopic(p.getPattern());
                    task.setDifficulty(p.getDifficulty() != null ? p.getDifficulty().name() : "Medium");
                    task.setPlatform(p.getPlatform());
                } else {
                    task.setProblemTitle(entry.getDescription() != null ? entry.getDescription() : "Task #" + entry.getId());
                }
                task.setCategory(entry.getCategory() != null ? entry.getCategory() : "dsa");
                task.setStatus(entry.getStatus().name().toLowerCase());
                tasks.add(task);
            }
        }

        // 3. Daily breakdown from goals
        DailyBreakdownDto breakdown = goalSlicingService.calculateDailyBreakdown(today);

        int totalDailyTarget = breakdown.getCategories().stream()
                .mapToInt(DailyBreakdownDto.CategoryBreakdownDto::getDailyTarget)
                .sum();

        int completedToday = (int) tasks.stream()
                .filter(t -> "completed".equalsIgnoreCase(t.getStatus()))
                .count();

        DailyOverviewDto overview = new DailyOverviewDto();
        overview.setDate(today);
        overview.setDueReviewCount(dueStates.size());
        overview.setDailyTargetTotal(totalDailyTarget);
        overview.setCompletedToday(completedToday);
        overview.setTasks(tasks);
        overview.setGoalBreakdown(breakdown);

        // Real analytics from database
        StreakDto streak = analyticsService.computeStreak();
        overview.setCurrentStreak(streak.getCurrentStreak());
        overview.setTodayActive(streak.isTodayActive());
        overview.setBestStreak(streak.getBestStreak());

        StabilityDto stability = analyticsService.computeStability();
        overview.setOverallStability(stability.getOverallStability());
        overview.setTrackedProblems(stability.getTrackedProblems());
        overview.setOverdueProblems(stability.getOverdueCount());

        overview.setWeeklyActivity(analyticsService.computeWeeklyActivity());

        return overview;
    }

    @Transactional
    public void markTaskCompleted(Long problemId, String category) {
        LocalDate today = LocalDate.now();
        DailyLog dailyLog = getOrCreateDailyLog(today);

        // Track whether this call actually transitions the task INTO completed.
        // Goal progress must only count that transition — otherwise re-reviewing a
        // problem (or double-clicking complete) inflates the monthly count past what
        // was really solved.
        boolean newlyCompleted;
        Optional<DailyLogEntry> entryOpt = dailyLogEntryRepository.findByDailyLogIdAndProblemId(dailyLog.getId(), problemId);
        if (entryOpt.isPresent()) {
            DailyLogEntry entry = entryOpt.get();
            newlyCompleted = entry.getStatus() != TaskStatus.COMPLETED;
            entry.setStatus(TaskStatus.COMPLETED);
            dailyLogEntryRepository.save(entry);
        } else {
            DailyLogEntry newEntry = new DailyLogEntry();
            newEntry.setDailyLog(dailyLog);
            newEntry.setProblemId(problemId);
            newEntry.setCategory(category != null ? category : "dsa");
            newEntry.setStatus(TaskStatus.COMPLETED);
            dailyLog.addEntry(newEntry);
            dailyLogRepository.save(dailyLog);
            newlyCompleted = true;
        }

        // Increment goal target progress only on the first completion of this task today
        if (newlyCompleted) {
            goalSlicingService.incrementTargetProgress(category != null ? category : "dsa", 1);
        }
    }

    @Transactional
    public int rolloverMissedTasks() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        Optional<DailyLog> yesterdayLogOpt = dailyLogRepository.findByDate(yesterday);
        if (yesterdayLogOpt.isEmpty()) {
            return 0;
        }

        DailyLog yesterdayLog = yesterdayLogOpt.get();
        List<DailyLogEntry> uncompleted = dailyLogEntryRepository.findByDailyLogIdAndStatus(
                yesterdayLog.getId(), TaskStatus.FLAGGED);

        if (uncompleted.isEmpty()) {
            return 0;
        }

        DailyLog todayLog = getOrCreateDailyLog(today);
        int rolledOverCount = 0;

        for (DailyLogEntry entry : uncompleted) {
            entry.setStatus(TaskStatus.ROLLED_OVER);
            dailyLogEntryRepository.save(entry);

            // Re-add to today's log as FLAGGED
            DailyLogEntry todayEntry = new DailyLogEntry();
            todayEntry.setDailyLog(todayLog);
            todayEntry.setProblemId(entry.getProblemId());
            todayEntry.setCategory(entry.getCategory());
            todayEntry.setDescription(entry.getDescription());
            todayEntry.setStatus(TaskStatus.FLAGGED);
            todayLog.addEntry(todayEntry);
            rolledOverCount++;
        }

        dailyLogRepository.save(todayLog);
        return rolledOverCount;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void scheduledMidnightRollover() {
        log.info("Midnight reached (12:00 AM) — automatically rolling over uncompleted tasks.");
        int count = rolloverMissedTasks();
        log.info("Midnight automatic rollover finished: {} tasks rolled over.", count);
    }

    private DailyLog getOrCreateDailyLog(LocalDate date) {
        return dailyLogRepository.findByDate(date).orElseGet(() -> {
            DailyLog log = new DailyLog();
            log.setDate(date);

            String monthKey = YearMonth.from(date).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            Optional<MonthlyGoal> goalOpt = monthlyGoalRepository.findByMonth(monthKey);
            goalOpt.ifPresent(log::setMonthlyGoal);

            return dailyLogRepository.save(log);
        });
    }
}
