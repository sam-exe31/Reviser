package org.example.reviser.Dto;

public class StabilityDto {

    private double overallStability; // 0.0 - 100.0
    private int trackedProblems;
    private int overdueCount;

    public StabilityDto() {}

    public StabilityDto(double overallStability, int trackedProblems, int overdueCount) {
        this.overallStability = overallStability;
        this.trackedProblems = trackedProblems;
        this.overdueCount = overdueCount;
    }

    public double getOverallStability() { return overallStability; }
    public void setOverallStability(double overallStability) { this.overallStability = overallStability; }

    public int getTrackedProblems() { return trackedProblems; }
    public void setTrackedProblems(int trackedProblems) { this.trackedProblems = trackedProblems; }

    public int getOverdueCount() { return overdueCount; }
    public void setOverdueCount(int overdueCount) { this.overdueCount = overdueCount; }
}
