package org.example.reviser.Dto;

import java.time.LocalDate;
import java.util.List;

public class WeeklyActivityDto {

    private List<DayActivity> days;

    public WeeklyActivityDto() {}

    public WeeklyActivityDto(List<DayActivity> days) {
        this.days = days;
    }

    public List<DayActivity> getDays() { return days; }
    public void setDays(List<DayActivity> days) { this.days = days; }

    public static class DayActivity {
        private LocalDate date;
        private boolean hasActivity;
        private int completedCount;

        public DayActivity() {}

        public DayActivity(LocalDate date, boolean hasActivity, int completedCount) {
            this.date = date;
            this.hasActivity = hasActivity;
            this.completedCount = completedCount;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }

        public boolean isHasActivity() { return hasActivity; }
        public void setHasActivity(boolean hasActivity) { this.hasActivity = hasActivity; }

        public int getCompletedCount() { return completedCount; }
        public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }
    }
}
