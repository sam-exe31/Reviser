package org.example.reviser.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class MonthlyGoalRequestDto {

    @NotBlank(message = "Month is required (e.g. '2026-09')")
    private String month;

    private List<GoalTargetDto> targets;

    private List<String> priorityOrder; // ["dsa", "os", "dbms"]

    private String userGoalPrompt;

    private Object aiAnalysis;

    private String status; // "DRAFT" or "ACCEPTED"

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public List<GoalTargetDto> getTargets() { return targets; }
    public void setTargets(List<GoalTargetDto> targets) { this.targets = targets; }

    public List<String> getPriorityOrder() { return priorityOrder; }
    public void setPriorityOrder(List<String> priorityOrder) { this.priorityOrder = priorityOrder; }

    public String getUserGoalPrompt() { return userGoalPrompt; }
    public void setUserGoalPrompt(String userGoalPrompt) { this.userGoalPrompt = userGoalPrompt; }

    public Object getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(Object aiAnalysis) { this.aiAnalysis = aiAnalysis; }
}
