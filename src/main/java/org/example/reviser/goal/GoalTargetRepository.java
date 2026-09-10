package org.example.reviser.goal;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalTargetRepository extends JpaRepository<GoalTarget, Long> {
    List<GoalTarget> findByMonthlyGoalId(Long monthlyGoalId);
    Optional<GoalTarget> findByMonthlyGoalIdAndCategory(Long monthlyGoalId, String category);
}
