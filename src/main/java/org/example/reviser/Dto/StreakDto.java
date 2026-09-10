package org.example.reviser.Dto;

public class StreakDto {

    private int currentStreak;
    private boolean todayActive;
    private int bestStreak;

    public StreakDto() {}

    public StreakDto(int currentStreak, boolean todayActive, int bestStreak) {
        this.currentStreak = currentStreak;
        this.todayActive = todayActive;
        this.bestStreak = bestStreak;
    }

    public int getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }

    public boolean isTodayActive() { return todayActive; }
    public void setTodayActive(boolean todayActive) { this.todayActive = todayActive; }

    public int getBestStreak() { return bestStreak; }
    public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }
}
