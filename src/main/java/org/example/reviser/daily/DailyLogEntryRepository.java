package org.example.reviser.daily;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DailyLogEntryRepository extends JpaRepository<DailyLogEntry, Long> {
    List<DailyLogEntry> findByDailyLogId(Long dailyLogId);
    List<DailyLogEntry> findByDailyLogIdAndStatus(Long dailyLogId, TaskStatus status);
    Optional<DailyLogEntry> findByDailyLogIdAndProblemId(Long dailyLogId, Long problemId);
}
