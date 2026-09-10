package org.example.reviser.daily;

import jakarta.persistence.*;
import org.example.reviser.goal.MonthlyGoal;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "daily_logs")
public class DailyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monthly_goal_id")
    private MonthlyGoal monthlyGoal;

    @OneToMany(mappedBy = "dailyLog", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyLogEntry> entries = new ArrayList<>();

    public DailyLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public MonthlyGoal getMonthlyGoal() { return monthlyGoal; }
    public void setMonthlyGoal(MonthlyGoal monthlyGoal) { this.monthlyGoal = monthlyGoal; }

    public List<DailyLogEntry> getEntries() { return entries; }
    public void setEntries(List<DailyLogEntry> entries) { this.entries = entries; }

    public void addEntry(DailyLogEntry entry) {
        entries.add(entry);
        entry.setDailyLog(this);
    }
}
