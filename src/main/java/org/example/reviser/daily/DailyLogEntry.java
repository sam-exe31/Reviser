package org.example.reviser.daily;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "daily_log_entries")
public class DailyLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_log_id", nullable = false)
    @JsonIgnore
    private DailyLog dailyLog;

    @Column(name = "problem_id")
    private Long problemId;

    private String category; // "dsa", "os", "dbms"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    private String description; // optional label for non-problem tasks

    public DailyLogEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DailyLog getDailyLog() { return dailyLog; }
    public void setDailyLog(DailyLog dailyLog) { this.dailyLog = dailyLog; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
