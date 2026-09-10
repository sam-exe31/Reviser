package org.example.reviser.Dto;

import java.time.LocalDate;
import java.util.List;

public class DailyOverviewDto {

    private LocalDate date;
    private int dueReviewCount;
    private int dailyTargetTotal;
    private int completedToday;
    private List<DailyTaskDto> tasks;
    private DailyBreakdownDto goalBreakdown;

    // Analytics
    private int currentStreak;
    private boolean todayActive;
    private int bestStreak;
    private double overallStability; // 0-100
    private int trackedProblems;
    private int overdueProblems;
    private WeeklyActivityDto weeklyActivity;

    public DailyOverviewDto() {}

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getDueReviewCount() { return dueReviewCount; }
    public void setDueReviewCount(int dueReviewCount) { this.dueReviewCount = dueReviewCount; }

    public int getDailyTargetTotal() { return dailyTargetTotal; }
    public void setDailyTargetTotal(int dailyTargetTotal) { this.dailyTargetTotal = dailyTargetTotal; }

    public int getCompletedToday() { return completedToday; }
    public void setCompletedToday(int completedToday) { this.completedToday = completedToday; }

    public List<DailyTaskDto> getTasks() { return tasks; }
    public void setTasks(List<DailyTaskDto> tasks) { this.tasks = tasks; }

    public DailyBreakdownDto getGoalBreakdown() { return goalBreakdown; }
    public void setGoalBreakdown(DailyBreakdownDto goalBreakdown) { this.goalBreakdown = goalBreakdown; }

    public int getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }

    public boolean isTodayActive() { return todayActive; }
    public void setTodayActive(boolean todayActive) { this.todayActive = todayActive; }

    public int getBestStreak() { return bestStreak; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }

    public double getOverallStability() { return overallStability; }
    public void setOverallStability(double overallStability) { this.overallStability = overallStability; }

    public int getTrackedProblems() { return trackedProblems; }
    public void setTrackedProblems(int trackedProblems) { this.trackedProblems = trackedProblems; }

    public int getOverdueProblems() { return overdueProblems; }
    public void setOverdueProblems(int overdueProblems) { this.overdueProblems = overdueProblems; }

    public WeeklyActivityDto getWeeklyActivity() { return weeklyActivity; }
    public void setWeeklyActivity(WeeklyActivityDto weeklyActivity) { this.weeklyActivity = weeklyActivity; }
}
