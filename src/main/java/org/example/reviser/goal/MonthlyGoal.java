package org.example.reviser.goal;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "monthly_goals")
public class MonthlyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String month; // "2026-09"

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "priority_order")
    private String priorityOrder; // "dsa,os,dbms"

    @Column(name = "user_goal_prompt", columnDefinition = "TEXT")
    private String userGoalPrompt;

    @Column(name = "ai_analysis_json", columnDefinition = "TEXT")
    private String aiAnalysisJson;

    @OneToMany(mappedBy = "monthlyGoal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoalTarget> targets = new ArrayList<>();

    public MonthlyGoal() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getPriorityOrder() { return priorityOrder; }
    public void setPriorityOrder(String priorityOrder) { this.priorityOrder = priorityOrder; }

    public String getUserGoalPrompt() { return userGoalPrompt; }
    public void setUserGoalPrompt(String userGoalPrompt) { this.userGoalPrompt = userGoalPrompt; }

    public String getAiAnalysisJson() { return aiAnalysisJson; }
    public void setAiAnalysisJson(String aiAnalysisJson) { this.aiAnalysisJson = aiAnalysisJson; }

    public List<GoalTarget> getTargets() { return targets; }
    public void setTargets(List<GoalTarget> targets) { this.targets = targets; }

    public void addTarget(GoalTarget target) {
        targets.add(target);
        target.setMonthlyGoal(this);
    }
}
