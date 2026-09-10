package org.example.reviser.goal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MonthlyGoalRepository extends JpaRepository<MonthlyGoal, Long> {
    Optional<MonthlyGoal> findByMonth(String month);
}
