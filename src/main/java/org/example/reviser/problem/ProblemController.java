package org.example.reviser.problem;

import org.example.reviser.Dto.ProblemRequestDto;
import org.example.reviser.Dto.ProblemResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/problems")
public class ProblemController {

    private final ProblemRepository problemRepository;

    public ProblemController(ProblemRepository problemRepository) {
        this.problemRepository = problemRepository;
    }

    @PostMapping
    public ResponseEntity<ProblemResponseDto> createProblem(@Valid @RequestBody ProblemRequestDto dto) {
        Problem problem = new Problem();
        problem.setTitle(dto.getTitle());
        problem.setPlatform(dto.getPlatform());
        problem.setDifficulty(dto.getDifficulty());
        problem.setPattern(dto.getPattern());
        return ResponseEntity.ok(toResponseDto(problemRepository.save(problem)));
    }

    @GetMapping
    public List<ProblemResponseDto> getAllProblems() {
        return problemRepository.findAll().stream()
                .map(this::toResponseDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDto> getProblem(@PathVariable Long id) {
        return problemRepository.findById(id)
                .map(p -> ResponseEntity.ok(toResponseDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProblemResponseDto> updateProblem(@PathVariable Long id,
                                                            @Valid @RequestBody ProblemRequestDto dto) {
        return problemRepository.findById(id)
                .map(existing -> {
                    existing.setTitle(dto.getTitle());
                    existing.setPlatform(dto.getPlatform());
                    existing.setDifficulty(dto.getDifficulty());
                    existing.setPattern(dto.getPattern());
                    return ResponseEntity.ok(toResponseDto(problemRepository.save(existing)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        if (!problemRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        problemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<List<ProblemResponseDto>> seedDefaultProblems() {
        List<Problem> defaults = List.of(
                createEntity("1. Two Sum", "LeetCode", Difficulty.Easy, "Hash Map / Array"),
                createEntity("3. Longest Substring Without Repeating Characters", "LeetCode", Difficulty.Medium, "Sliding Window"),
                createEntity("15. 3Sum", "LeetCode", Difficulty.Medium, "Two Pointers / Sorting"),
                createEntity("20. Valid Parentheses", "LeetCode", Difficulty.Easy, "Stack"),
                createEntity("21. Merge Two Sorted Lists", "LeetCode", Difficulty.Easy, "Linked List"),
                createEntity("33. Search in Rotated Sorted Array", "LeetCode", Difficulty.Medium, "Binary Search"),
                createEntity("42. Trapping Rain Water", "LeetCode", Difficulty.Hard, "Two Pointers / Monotonic Stack"),
                createEntity("53. Maximum Subarray", "LeetCode", Difficulty.Medium, "Kadane's / DP"),
                createEntity("56. Merge Intervals", "LeetCode", Difficulty.Medium, "Intervals / Sorting"),
                createEntity("70. Climbing Stairs", "LeetCode", Difficulty.Easy, "Dynamic Programming"),
                createEntity("98. Validate Binary Search Tree", "LeetCode", Difficulty.Medium, "Tree DFS / Range Check"),
                createEntity("102. Binary Tree Level Order Traversal", "LeetCode", Difficulty.Medium, "Tree BFS / Queue"),
                createEntity("121. Best Time to Buy and Sell Stock", "LeetCode", Difficulty.Easy, "Greedy / Single Pass"),
                createEntity("146. LRU Cache", "LeetCode", Difficulty.Medium, "Doubly Linked List + Hash Map"),
                createEntity("200. Number of Islands", "LeetCode", Difficulty.Medium, "Graph DFS / BFS / Grid"),
                createEntity("206. Reverse Linked List", "LeetCode", Difficulty.Easy, "Linked List Reversal"),
                createEntity("207. Course Schedule", "LeetCode", Difficulty.Medium, "Graph Topological Sort"),
                createEntity("322. Coin Change", "LeetCode", Difficulty.Medium, "0/1 Knapsack DP"),
                createEntity("739. Daily Temperatures", "LeetCode", Difficulty.Medium, "Monotonic Stack"),
                createEntity("OS: Virtual Memory & Paging Replacement", "Core CS", Difficulty.Medium, "Operating Systems"),
                createEntity("DBMS: B+ Tree Indexing & ACID Isolation", "Core CS", Difficulty.Medium, "Database Systems")
        );

        for (Problem p : defaults) {
            boolean exists = problemRepository.findAll().stream()
                    .anyMatch(existing -> existing.getTitle().equalsIgnoreCase(p.getTitle()));
            if (!exists) {
                problemRepository.save(p);
            }
        }

        return ResponseEntity.ok(getAllProblems());
    }

    private Problem createEntity(String title, String platform, Difficulty difficulty, String pattern) {
        Problem p = new Problem();
        p.setTitle(title);
        p.setPlatform(platform);
        p.setDifficulty(difficulty);
        p.setPattern(pattern);
        return p;
    }

    private ProblemResponseDto toResponseDto(Problem p) {
        return new ProblemResponseDto(p.getId(), p.getTitle(), p.getPlatform(),
                p.getDifficulty(), p.getPattern());
    }
}