package org.example.reviser.review.reviewState;

import org.example.reviser.Dto.RevisionPickDto;
import org.example.reviser.ai.GeminiParsingService;
import org.example.reviser.problem.Problem;
import org.example.reviser.problem.ProblemRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Picks the ~2 problems to revise today from the SOLVED-problems list.
 *
 * Ranking (rating-driven, the way the user asked):
 *  - most overdue first (SM-2 {@code nextReviewDate}); never-revised problems
 *    are treated as top priority "first revision",
 *  - lower confidence rating raises priority (revise weak spots sooner),
 *  - high-frequency interview topics are flagged and float up.
 *
 * When a Gemini key is present, the ranked shortlist is handed to the AI to
 * choose which ~2 to surface (and why); otherwise the deterministic top-N is
 * used. This is the backing logic for the "Today's problems to revise" panel.
 */
@Service
public class RevisionPlanService {

    private final ReviewStateRepository reviewStateRepository;
    private final ProblemRepository problemRepository;
    private final GeminiParsingService geminiParsingService;

    // High-frequency interview topics — used to flag "important" problems first.
    private static final Set<String> INTERVIEW_TOPICS = Set.of(
            "array", "string", "two pointer", "sliding window", "hash", "map",
            "binary search", "tree", "bst", "bfs", "dfs", "graph",
            "dynamic programming", "dp", "backttrack", "heap", "priority queue",
            "stack", "queue", "linked list", "greedy", "trie", "union find",
            "topological", "interval", "matrix", "recursion", "bit"
    );

    public RevisionPlanService(ReviewStateRepository reviewStateRepository,
                               ProblemRepository problemRepository,
                               GeminiParsingService geminiParsingService) {
        this.reviewStateRepository = reviewStateRepository;
        this.problemRepository = problemRepository;
        this.geminiParsingService = geminiParsingService;
    }

    public List<RevisionPickDto> pickTodayRevision(int limit) {
        int cap = Math.max(1, limit);
        LocalDate today = LocalDate.now();

        // problemId -> its SM-2 state (a problem may have none if never revised)
        Map<Long, ReviewState> stateByProblem = new LinkedHashMap<>();
        for (ReviewState st : reviewStateRepository.findAll()) {
            stateByProblem.put(st.getProblemId(), st);
        }

        // Build one candidate per solved problem, with a deterministic priority score.
        List<Candidate> candidates = new ArrayList<>();
        for (Problem p : problemRepository.findAll()) {
            ReviewState st = stateByProblem.get(p.getId());
            Candidate c = new Candidate();
            c.dto = toDto(p, st);
            c.overdueDays = overdueDays(st, today);
            c.score = c.overdueDays
                    + (c.dto.isImportant() ? 3 : 0)     // interview topics float up
                    + (5 - c.dto.getRating());          // lower confidence -> revise sooner
            candidates.add(c);
        }

        if (candidates.isEmpty()) {
            return List.of();
        }

        candidates.sort((a, b) -> Integer.compare(b.score, a.score));

        // Shortlist the strongest candidates for the AI to choose from.
        int shortlistSize = Math.min(candidates.size(), Math.max(cap * 5, cap));
        List<Candidate> shortlist = candidates.subList(0, shortlistSize);

        // Ask the AI which ~cap to actually surface today (weighting interview trends).
        List<Map<String, Object>> aiCandidates = new ArrayList<>();
        for (Candidate c : shortlist) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("problemId", c.dto.getProblemId());
            m.put("title", c.dto.getTitle());
            m.put("difficulty", c.dto.getDifficulty());
            m.put("pattern", c.dto.getPattern());
            m.put("overdueDays", c.overdueDays);
            m.put("rating", c.dto.getRating());
            m.put("reviewCount", c.dto.getReviewCount());
            m.put("important", c.dto.isImportant());
            aiCandidates.add(m);
        }

        List<Map<String, Object>> aiPicks = geminiParsingService.selectRevisionProblems(aiCandidates, cap);

        List<RevisionPickDto> result = new ArrayList<>();
        if (aiPicks != null && !aiPicks.isEmpty()) {
            for (Map<String, Object> pick : aiPicks) {
                Long id = asLong(pick.get("problemId"));
                if (id == null) continue;
                Candidate match = shortlist.stream()
                        .filter(c -> id.equals(c.dto.getProblemId()))
                        .findFirst().orElse(null);
                if (match == null) continue;
                Object reason = pick.get("reason");
                match.dto.setReason(reason != null ? reason.toString() : deterministicReason(match, today));
                result.add(match.dto);
                if (result.size() >= cap) break;
            }
        }

        // Fallback (no key / AI returned nothing usable): deterministic top-N.
        if (result.isEmpty()) {
            for (Candidate c : shortlist) {
                c.dto.setReason(deterministicReason(c, today));
                result.add(c.dto);
                if (result.size() >= cap) break;
            }
        }

        return result;
    }

    private RevisionPickDto toDto(Problem p, ReviewState st) {
        RevisionPickDto dto = new RevisionPickDto();
        dto.setProblemId(p.getId());
        dto.setTitle(p.getTitle());
        dto.setPlatform(p.getPlatform());
        dto.setPattern(p.getPattern());
        dto.setDifficulty(p.getDifficulty() != null ? p.getDifficulty().name() : null);
        dto.setImportant(isImportantTopic(p));
        if (st != null) {
            dto.setRating(st.getRating());
            dto.setReviewCount(st.getReviewCount());
            dto.setEaseFactor(st.getEaseFactor());
            dto.setNextReviewDate(st.getNextReviewDate() != null ? st.getNextReviewDate().toString() : null);
        } else {
            dto.setRating(0);
            dto.setReviewCount(0);
            dto.setEaseFactor(2.5);
            dto.setNextReviewDate(null);
        }
        return dto;
    }

    /** Never-revised => very high; otherwise days past the SM-2 due date (can be negative). */
    private int overdueDays(ReviewState st, LocalDate today) {
        if (st == null || st.getNextReviewDate() == null) return 9999;
        return (int) (today.toEpochDay() - st.getNextReviewDate().toEpochDay());
    }

    private boolean isImportantTopic(Problem p) {
        String hay = ((p.getPattern() != null ? p.getPattern() : "") + " "
                + (p.getTitle() != null ? p.getTitle() : "")).toLowerCase();
        for (String kw : INTERVIEW_TOPICS) {
            if (hay.contains(kw)) return true;
        }
        return false;
    }

    private String deterministicReason(Candidate c, LocalDate today) {
        StringBuilder sb = new StringBuilder();
        if (c.dto.isImportant()) sb.append("High-frequency interview topic. ");
        if (c.dto.getReviewCount() == 0) {
            sb.append("First revision — you haven't revised this yet.");
        } else if (c.overdueDays > 0) {
            sb.append("Overdue by ").append(c.overdueDays).append(" day(s)");
            if (c.dto.getRating() > 0 && c.dto.getRating() <= 2) sb.append("; last confidence was low");
            sb.append(".");
        } else {
            sb.append("Due for spaced review.");
        }
        return sb.toString().trim();
    }

    private Long asLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(o.toString().trim()); } catch (Exception e) { return null; }
    }

    private static class Candidate {
        RevisionPickDto dto;
        int overdueDays;
        int score;
    }
}
