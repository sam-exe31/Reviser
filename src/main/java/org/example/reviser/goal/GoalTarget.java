package org.example.reviser.goal;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "goal_targets")
public class GoalTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monthly_goal_id", nullable = false)
    @JsonIgnore
    private MonthlyGoal monthlyGoal;

    @Column(nullable = false)
    private String category; // "dsa", "os", "dbms"

    @Column(name = "target_count", nullable = false)
    private int targetCount;

    @Column(name = "completed_count")
    private int completedCount;

    public GoalTarget() {}

    public GoalTarget(String category, int targetCount) {
        this.category = category;
        this.targetCount = targetCount;
        this.completedCount = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MonthlyGoal getMonthlyGoal() { return monthlyGoal; }
    public void setMonthlyGoal(MonthlyGoal monthlyGoal) { this.monthlyGoal = monthlyGoal; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public int getTargetCount() { return targetCount; }
    public void setTargetCount(int targetCount) { this.targetCount = targetCount; }

    public int getCompletedCount() { return completedCount; }
    public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }
}
