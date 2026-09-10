package org.example.reviser.daily;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface DailyTodoRepository extends JpaRepository<DailyTodo, Long> {

    List<DailyTodo> findByDateOrderBySortOrderAsc(LocalDate date);

    List<DailyTodo> findByDateAndCompletedTrue(LocalDate date);

    @Query("SELECT DISTINCT d.date FROM DailyTodo d WHERE d.completed = true AND d.date >= :startDate ORDER BY d.date DESC")
    List<LocalDate> findDistinctCompletedDatesSince(@Param("startDate") LocalDate startDate);

    @Query("SELECT DISTINCT d.date FROM DailyTodo d WHERE d.completed = true ORDER BY d.date ASC")
    List<LocalDate> findAllDistinctCompletedDates();

    @Query("SELECT COUNT(d) FROM DailyTodo d WHERE d.date = :date AND d.completed = true")
    int countCompletedByDate(@Param("date") LocalDate date);

    void deleteByDate(LocalDate date);
}
