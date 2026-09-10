package org.example.reviser.daily;

import org.example.reviser.Dto.DailyTodoRequestDto;
import org.example.reviser.Dto.DailyTodoResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/todos")
public class DailyTodoController {

    private final DailyTodoService todoService;

    public DailyTodoController(DailyTodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<DailyTodoResponseDto> getTodos(
            @RequestParam(required = false) String date) {
        LocalDate forDate = date != null && !date.isBlank()
                ? LocalDate.parse(date)
                : LocalDate.now();
        return todoService.getTodosByDate(forDate);
    }

    @PostMapping
    public ResponseEntity<DailyTodoResponseDto> createTodo(@RequestBody DailyTodoRequestDto dto) {
        return ResponseEntity.ok(todoService.createTodo(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DailyTodoResponseDto> updateTodo(
            @PathVariable Long id,
            @RequestBody DailyTodoRequestDto dto) {
        return ResponseEntity.ok(todoService.updateTodo(id, dto));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<DailyTodoResponseDto> toggleTodo(@PathVariable Long id) {
        return ResponseEntity.ok(todoService.toggleTodoCompleted(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTodo(@PathVariable Long id) {
        todoService.deleteTodo(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @PutMapping("/{todoId}/subtasks/{subtaskId}/toggle")
    public ResponseEntity<DailyTodoResponseDto> toggleSubtask(
            @PathVariable Long todoId,
            @PathVariable Long subtaskId) {
        return ResponseEntity.ok(todoService.toggleSubtask(todoId, subtaskId));
    }

    @PostMapping("/{todoId}/subtasks")
    public ResponseEntity<DailyTodoResponseDto> addSubtask(
            @PathVariable Long todoId,
            @RequestBody DailyTodoRequestDto.SubtaskDto stDto) {
        return ResponseEntity.ok(todoService.addSubtask(todoId, stDto));
    }

    @DeleteMapping("/{todoId}/subtasks/{subtaskId}")
    public ResponseEntity<DailyTodoResponseDto> deleteSubtask(
            @PathVariable Long todoId,
            @PathVariable Long subtaskId) {
        return ResponseEntity.ok(todoService.deleteSubtask(todoId, subtaskId));
    }

    @PutMapping("/replace")
    public ResponseEntity<List<DailyTodoResponseDto>> replaceTodos(
            @RequestParam(required = false) String date,
            @RequestBody List<DailyTodoRequestDto> dtos) {
        LocalDate forDate = date != null && !date.isBlank()
                ? LocalDate.parse(date)
                : LocalDate.now();
        return ResponseEntity.ok(todoService.replaceAllTodosForDate(forDate, dtos));
    }
}
