package org.example.reviser.Dto;

import java.time.LocalDateTime;
import java.util.List;

public class MonthlyGoalResponseDto {

    private Long id;
    private String month;
    private LocalDateTime createdAt;
    private List<String> priorityOrder;
    private List<GoalTargetDto> targets;
    private String userGoalPrompt;
    private Object aiAnalysis;
    private String status = "ACCEPTED";

    public MonthlyGoalResponseDto() {}

    public MonthlyGoalResponseDto(Long id, String month, LocalDateTime createdAt,
                                   List<String> priorityOrder, List<GoalTargetDto> targets) {
        this.id = id;
        this.month = month;
        this.createdAt = createdAt;
        this.priorityOrder = priorityOrder;
        this.targets = targets;
    }

    public MonthlyGoalResponseDto(Long id, String month, LocalDateTime createdAt,
                                   List<String> priorityOrder, List<GoalTargetDto> targets,
                                   String userGoalPrompt, Object aiAnalysis) {
        this.id = id;
        this.month = month;
        this.createdAt = createdAt;
        this.priorityOrder = priorityOrder;
        this.targets = targets;
        this.userGoalPrompt = userGoalPrompt;
        this.aiAnalysis = aiAnalysis;
    }

    public MonthlyGoalResponseDto(Long id, String month, LocalDateTime createdAt,
                                   List<String> priorityOrder, List<GoalTargetDto> targets,
                                   String userGoalPrompt, Object aiAnalysis, String status) {
        this.id = id;
        this.month = month;
        this.createdAt = createdAt;
        this.priorityOrder = priorityOrder;
        this.targets = targets;
        this.userGoalPrompt = userGoalPrompt;
        this.aiAnalysis = aiAnalysis;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<String> getPriorityOrder() { return priorityOrder; }
    public void setPriorityOrder(List<String> priorityOrder) { this.priorityOrder = priorityOrder; }

    public List<GoalTargetDto> getTargets() { return targets; }
    public void setTargets(List<GoalTargetDto> targets) { this.targets = targets; }

    public String getUserGoalPrompt() { return userGoalPrompt; }
    public void setUserGoalPrompt(String userGoalPrompt) { this.userGoalPrompt = userGoalPrompt; }

    public Object getAiAnalysis() { return aiAnalysis; }
    public void setAiAnalysis(Object aiAnalysis) { this.aiAnalysis = aiAnalysis; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
