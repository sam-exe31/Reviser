package org.example.reviser.daily;

import org.example.reviser.Dto.DailyTodoRequestDto;
import org.example.reviser.Dto.DailyTodoResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DailyTodoService {

    private final DailyTodoRepository todoRepository;
    private final DailyTodoSubtaskRepository subtaskRepository;

    public DailyTodoService(DailyTodoRepository todoRepository,
                            DailyTodoSubtaskRepository subtaskRepository) {
        this.todoRepository = todoRepository;
        this.subtaskRepository = subtaskRepository;
    }

    public List<DailyTodoResponseDto> getTodosByDate(LocalDate date) {
        return todoRepository.findByDateOrderBySortOrderAsc(date)
                .stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DailyTodoResponseDto createTodo(DailyTodoRequestDto dto) {
        LocalDate date = dto.getDate() != null && !dto.getDate().isBlank()
                ? LocalDate.parse(dto.getDate())
                : LocalDate.now();

        // Determine sort order: put new items at the top (sortOrder = 0, shift others)
        List<DailyTodo> existing = todoRepository.findByDateOrderBySortOrderAsc(date);
        for (DailyTodo t : existing) {
            t.setSortOrder(t.getSortOrder() + 1);
        }
        todoRepository.saveAll(existing);

        DailyTodo todo = new DailyTodo();
        todo.setDate(date);
        todo.setTitle(dto.getTitle());
        todo.setCategory(dto.getCategory() != null ? dto.getCategory() : "DSA");
        todo.setHabit(dto.isHabit());
        todo.setEstimatedMinutes(dto.getEstimatedMinutes() > 0 ? dto.getEstimatedMinutes() : 30);
        todo.setCompleted(false);
        todo.setColorClass(dto.getColorClass() != null ? dto.getColorClass() : "box-blue");
        todo.setSortOrder(0);
        todo.setCreatedAt(LocalDateTime.now());

        if (dto.getSubtasks() != null) {
            for (int i = 0; i < dto.getSubtasks().size(); i++) {
                DailyTodoRequestDto.SubtaskDto stDto = dto.getSubtasks().get(i);
                DailyTodoSubtask subtask = new DailyTodoSubtask(
                        stDto.getTitle(),
                        stDto.getCategory() != null ? stDto.getCategory() : "Code",
                        false,
                        i
                );
                todo.addSubtask(subtask);
            }
        }

        DailyTodo saved = todoRepository.save(todo);
        return toResponseDto(saved);
    }

    @Transactional
    public DailyTodoResponseDto updateTodo(Long id, DailyTodoRequestDto dto) {
        DailyTodo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + id));

        if (dto.getTitle() != null) todo.setTitle(dto.getTitle());
        if (dto.getCategory() != null) todo.setCategory(dto.getCategory());
        if (dto.getColorClass() != null) todo.setColorClass(dto.getColorClass());
        if (dto.getEstimatedMinutes() > 0) todo.setEstimatedMinutes(dto.getEstimatedMinutes());

        DailyTodo saved = todoRepository.save(todo);
        return toResponseDto(saved);
    }

    @Transactional
    public DailyTodoResponseDto toggleTodoCompleted(Long id) {
        DailyTodo todo = todoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + id));

        boolean newState = !todo.isCompleted();
        todo.setCompleted(newState);

        // Also toggle all subtasks to match
        for (DailyTodoSubtask st : todo.getSubtasks()) {
            st.setCompleted(newState);
        }

        DailyTodo saved = todoRepository.save(todo);
        return toResponseDto(saved);
    }

    @Transactional
    public void deleteTodo(Long id) {
        todoRepository.deleteById(id);
    }

    @Transactional
    public DailyTodoResponseDto toggleSubtask(Long todoId, Long subtaskId) {
        DailyTodoSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found: " + subtaskId));

        subtask.setCompleted(!subtask.isCompleted());
        subtaskRepository.save(subtask);

        // Check if all subtasks are completed → auto-complete parent
        DailyTodo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        boolean allDone = !todo.getSubtasks().isEmpty()
                && todo.getSubtasks().stream().allMatch(DailyTodoSubtask::isCompleted);
        todo.setCompleted(allDone);
        todoRepository.save(todo);

        return toResponseDto(todo);
    }

    @Transactional
    public DailyTodoResponseDto addSubtask(Long todoId, DailyTodoRequestDto.SubtaskDto stDto) {
        DailyTodo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        int nextOrder = todo.getSubtasks().size();
        DailyTodoSubtask subtask = new DailyTodoSubtask(
                stDto.getTitle(),
                stDto.getCategory() != null ? stDto.getCategory() : "Code",
                false,
                nextOrder
        );
        todo.addSubtask(subtask);

        // Adding a subtask means parent is no longer complete
        todo.setCompleted(false);

        DailyTodo saved = todoRepository.save(todo);
        return toResponseDto(saved);
    }

    @Transactional
    public DailyTodoResponseDto updateSubtask(Long todoId, Long subtaskId, DailyTodoRequestDto.SubtaskDto stDto) {
        DailyTodoSubtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new RuntimeException("Subtask not found: " + subtaskId));

        if (stDto.getTitle() != null) subtask.setTitle(stDto.getTitle());
        if (stDto.getCategory() != null) subtask.setCategory(stDto.getCategory());
        subtaskRepository.save(subtask);

        DailyTodo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));
        return toResponseDto(todo);
    }

    @Transactional
    public DailyTodoResponseDto deleteSubtask(Long todoId, Long subtaskId) {
        DailyTodo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        todo.getSubtasks().removeIf(st -> st.getId().equals(subtaskId));

        // Recheck completion
        boolean allDone = !todo.getSubtasks().isEmpty()
                && todo.getSubtasks().stream().allMatch(DailyTodoSubtask::isCompleted);
        todo.setCompleted(allDone);

        DailyTodo saved = todoRepository.save(todo);
        return toResponseDto(saved);
    }

    @Transactional
    public List<DailyTodoResponseDto> replaceAllTodosForDate(LocalDate date, List<DailyTodoRequestDto> dtos) {
        // Delete all existing todos for this date
        todoRepository.deleteByDate(date);
        todoRepository.flush();

        List<DailyTodoResponseDto> result = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            DailyTodoRequestDto dto = dtos.get(i);
            dto.setDate(date.toString());

            DailyTodo todo = new DailyTodo();
            todo.setDate(date);
            todo.setTitle(dto.getTitle());
            todo.setCategory(dto.getCategory() != null ? dto.getCategory() : "DSA");
            todo.setHabit(dto.isHabit());
            todo.setEstimatedMinutes(dto.getEstimatedMinutes() > 0 ? dto.getEstimatedMinutes() : 30);
            todo.setCompleted(false);
            todo.setColorClass(dto.getColorClass() != null ? dto.getColorClass() : "box-blue");
            todo.setSortOrder(i);
            todo.setCreatedAt(LocalDateTime.now());

            if (dto.getSubtasks() != null) {
                for (int j = 0; j < dto.getSubtasks().size(); j++) {
                    DailyTodoRequestDto.SubtaskDto stDto = dto.getSubtasks().get(j);
                    DailyTodoSubtask subtask = new DailyTodoSubtask(
                            stDto.getTitle(),
                            stDto.getCategory() != null ? stDto.getCategory() : "Code",
                            false,
                            j
                    );
                    todo.addSubtask(subtask);
                }
            }

            result.add(toResponseDto(todoRepository.save(todo)));
        }

        return result;
    }

    // Persist a new drag-and-drop order. Only sortOrder is touched, so a reorder
    // never disturbs completion state or subtasks (unlike replaceAllTodosForDate,
    // which is delete-then-insert). Any todo the client omitted keeps trailing
    // in its existing order.
    @Transactional
    public List<DailyTodoResponseDto> reorderTodos(LocalDate date, List<Long> orderedIds) {
        List<DailyTodo> existing = todoRepository.findByDateOrderBySortOrderAsc(date);

        int order = 0;
        java.util.Set<Long> assigned = new java.util.HashSet<>();

        if (orderedIds != null) {
            for (Long id : orderedIds) {
                if (id == null || assigned.contains(id)) continue;
                for (DailyTodo t : existing) {
                    if (t.getId().equals(id)) {
                        t.setSortOrder(order++);
                        assigned.add(id);
                        break;
                    }
                }
            }
        }
        for (DailyTodo t : existing) {
            if (!assigned.contains(t.getId())) {
                t.setSortOrder(order++);
            }
        }

        todoRepository.saveAll(existing);

        return existing.stream()
                .sorted(java.util.Comparator.comparingInt(DailyTodo::getSortOrder))
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    private DailyTodoResponseDto toResponseDto(DailyTodo todo) {
        DailyTodoResponseDto dto = new DailyTodoResponseDto();
        dto.setId(todo.getId());
        dto.setDate(todo.getDate());
        dto.setTitle(todo.getTitle());
        dto.setCategory(todo.getCategory());
        dto.setHabit(todo.isHabit());
        dto.setEstimatedMinutes(todo.getEstimatedMinutes());
        dto.setCompleted(todo.isCompleted());
        dto.setColorClass(todo.getColorClass());
        dto.setSortOrder(todo.getSortOrder());
        dto.setCreatedAt(todo.getCreatedAt());

        if (todo.getSubtasks() != null) {
            dto.setSubtasks(todo.getSubtasks().stream().map(st -> {
                DailyTodoResponseDto.SubtaskResponseDto stDto = new DailyTodoResponseDto.SubtaskResponseDto();
                stDto.setId(st.getId());
                stDto.setTitle(st.getTitle());
                stDto.setCategory(st.getCategory());
                stDto.setCompleted(st.isCompleted());
                stDto.setSortOrder(st.getSortOrder());
                return stDto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
