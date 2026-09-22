package org.example.reviser.goal;

import tools.jackson.databind.ObjectMapper;
import org.example.reviser.Dto.DailyBreakdownDto;
import org.example.reviser.Dto.GoalTargetDto;
import org.example.reviser.Dto.MonthlyGoalRequestDto;
import org.example.reviser.Dto.MonthlyGoalResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GoalSlicingService {

    private static final Logger log = LoggerFactory.getLogger(GoalSlicingService.class);

    private final MonthlyGoalRepository monthlyGoalRepository;
    private final GoalTargetRepository goalTargetRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GoalSlicingService(MonthlyGoalRepository monthlyGoalRepository,
                              GoalTargetRepository goalTargetRepository) {
        this.monthlyGoalRepository = monthlyGoalRepository;
        this.goalTargetRepository = goalTargetRepository;
    }

    @Transactional
    public MonthlyGoalResponseDto createOrUpdateGoal(MonthlyGoalRequestDto dto) {
        MonthlyGoal goal = monthlyGoalRepository.findByMonth(dto.getMonth())
                .orElseGet(() -> {
                    MonthlyGoal g = new MonthlyGoal();
                    g.setMonth(dto.getMonth());
                    return g;
                });

        if (dto.getPriorityOrder() != null && !dto.getPriorityOrder().isEmpty()) {
            goal.setPriorityOrder(String.join(",", dto.getPriorityOrder()));
        }

        if (dto.getUserGoalPrompt() != null) {
            goal.setUserGoalPrompt(dto.getUserGoalPrompt());
        }

        if (dto.getAiAnalysis() != null) {
            try {
                goal.setAiAnalysisJson(objectMapper.writeValueAsString(dto.getAiAnalysis()));
            } catch (Exception e) {
                log.warn("Failed to serialize aiAnalysis to JSON: {}", e.getMessage());
                goal.setAiAnalysisJson(dto.getAiAnalysis().toString());
            }
        }

        // Clear or update existing targets if provided
        if (dto.getTargets() != null && !dto.getTargets().isEmpty()) {
            goal.getTargets().clear();
            for (GoalTargetDto tDto : dto.getTargets()) {
                GoalTarget target = new GoalTarget(tDto.getCategory().toLowerCase().trim(), tDto.getTargetCount());
                target.setCompletedCount(tDto.getCompletedCount());
                goal.addTarget(target);
            }
        }

        goal.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACCEPTED");

        MonthlyGoal saved = monthlyGoalRepository.save(goal);
        return toResponseDto(saved);
    }

    @Transactional
    public MonthlyGoalResponseDto saveDraft(MonthlyGoalRequestDto dto) {
        MonthlyGoal goal = monthlyGoalRepository.findByMonth(dto.getMonth())
                .orElseGet(() -> {
                    MonthlyGoal g = new MonthlyGoal();
                    g.setMonth(dto.getMonth());
                    return g;
                });

        goal.setStatus("DRAFT");

        if (dto.getUserGoalPrompt() != null) {
            goal.setUserGoalPrompt(dto.getUserGoalPrompt());
        }

        if (dto.getAiAnalysis() != null) {
            try {
                goal.setAiAnalysisJson(objectMapper.writeValueAsString(dto.getAiAnalysis()));
            } catch (Exception e) {
                log.warn("Failed to serialize draft aiAnalysis to JSON: {}", e.getMessage());
                goal.setAiAnalysisJson(dto.getAiAnalysis().toString());
            }
        }

        if (dto.getPriorityOrder() != null && !dto.getPriorityOrder().isEmpty()) {
            goal.setPriorityOrder(String.join(",", dto.getPriorityOrder()));
        }

        MonthlyGoal saved = monthlyGoalRepository.save(goal);
        return toResponseDto(saved);
    }

    public Optional<MonthlyGoalResponseDto> getCurrentMonthGoal() {
        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return monthlyGoalRepository.findByMonth(currentMonth).map(this::toResponseDto);
    }

    public Optional<MonthlyGoalResponseDto> getGoalByMonth(String month) {
        return monthlyGoalRepository.findByMonth(month).map(this::toResponseDto);
    }

    @Transactional
    public void incrementTargetProgress(String category, int count) {
        String currentMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        monthlyGoalRepository.findByMonth(currentMonth).ifPresent(goal -> {
            for (GoalTarget target : goal.getTargets()) {
                if (target.getCategory().equalsIgnoreCase(category)) {
                    target.setCompletedCount(target.getCompletedCount() + count);
                    goalTargetRepository.save(target);
                    break;
                }
            }
        });
    }

    public DailyBreakdownDto calculateDailyBreakdown(LocalDate forDate) {
        YearMonth ym = YearMonth.from(forDate);
        String monthKey = ym.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        int totalDaysInMonth = ym.lengthOfMonth();
        int remainingDays = Math.max(1, totalDaysInMonth - forDate.getDayOfMonth() + 1);

        Optional<MonthlyGoal> goalOpt = monthlyGoalRepository.findByMonth(monthKey);
        if (goalOpt.isEmpty()) {
            return new DailyBreakdownDto(forDate, remainingDays, Collections.emptyList());
        }

        MonthlyGoal goal = goalOpt.get();
        List<DailyBreakdownDto.CategoryBreakdownDto> categoryBreakdowns = new ArrayList<>();

        for (GoalTarget target : goal.getTargets()) {
            int remainingTarget = Math.max(0, target.getTargetCount() - target.getCompletedCount());
            int dailyTarget = (int) Math.ceil((double) remainingTarget / remainingDays);

            categoryBreakdowns.add(new DailyBreakdownDto.CategoryBreakdownDto(
                    target.getCategory(),
                    dailyTarget,
                    remainingTarget,
                    target.getTargetCount(),
                    target.getCompletedCount()
            ));
        }

        // Sort by priorityOrder if present
        if (goal.getPriorityOrder() != null && !goal.getPriorityOrder().isBlank()) {
            List<String> priorities = Arrays.stream(goal.getPriorityOrder().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .toList();

            categoryBreakdowns.sort(Comparator.comparingInt(c -> {
                int idx = priorities.indexOf(c.getCategory().toLowerCase());
                return idx == -1 ? 999 : idx;
            }));
        }

        return new DailyBreakdownDto(forDate, remainingDays, categoryBreakdowns);
    }

    private MonthlyGoalResponseDto toResponseDto(MonthlyGoal goal) {
        List<String> priorityList = goal.getPriorityOrder() != null && !goal.getPriorityOrder().isBlank()
                ? Arrays.stream(goal.getPriorityOrder().split(",")).map(String::trim).toList()
                : Collections.emptyList();

        List<GoalTargetDto> targetDtos = goal.getTargets().stream()
                .map(t -> new GoalTargetDto(t.getCategory(), t.getTargetCount(), t.getCompletedCount()))
                .collect(Collectors.toList());

        Object aiAnalysis = null;
        if (goal.getAiAnalysisJson() != null && !goal.getAiAnalysisJson().isBlank()) {
            try {
                aiAnalysis = objectMapper.readValue(goal.getAiAnalysisJson(), Object.class);
            } catch (Exception e) {
                log.warn("Failed to deserialize aiAnalysisJson for month {}: {}", goal.getMonth(), e.getMessage());
            }
        }

        return new MonthlyGoalResponseDto(
                goal.getId(),
                goal.getMonth(),
                goal.getCreatedAt(),
                priorityList,
                targetDtos,
                goal.getUserGoalPrompt(),
                aiAnalysis,
                goal.getStatus() != null ? goal.getStatus() : "ACCEPTED"
        );
    }
}
