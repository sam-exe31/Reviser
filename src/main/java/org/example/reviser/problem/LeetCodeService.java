package org.example.reviser.problem;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class LeetCodeService {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeService.class);
    private static final String LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
    // Public REST index of every problem: reliable number -> titleSlug mapping.
    private static final String LEETCODE_ALL_URL = "https://leetcode.com/api/problems/all/";
    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Reviser/1.0";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // In-memory cache of the problem index, keyed both ways.
    private volatile Map<String, JsonNode> problemIndex = null;   // frontendId -> stat_status pair
    private volatile Map<String, JsonNode> problemBySlug = null;  // titleSlug  -> stat_status pair
    private volatile long problemIndexLoadedAt = 0L;
    private static final long INDEX_TTL_MS = 6 * 60 * 60 * 1000L; // 6 hours

    public LeetCodeService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Look up LeetCode problem details by problem number (frontend question ID).
     * Resolves the titleSlug via the reliable public REST index first, then falls
     * back to a GraphQL keyword search if the index is unreachable.
     */
    public Map<String, Object> fetchProblemByNumber(String problemNumber) {
        Map<String, Object> result = new HashMap<>();
        if (problemNumber == null || problemNumber.trim().isEmpty()) {
            result.put("found", false);
            result.put("message", "Problem number cannot be empty");
            return result;
        }

        String cleanNum = problemNumber.trim().replaceAll("[^0-9]", "");
        if (cleanNum.isEmpty()) cleanNum = problemNumber.trim();

        try {
            String titleSlug = null;
            String title = null;
            String difficulty = null;
            boolean paidOnly = false;

            // Step 1a: reliable resolution via the REST index (number -> slug).
            Map<String, JsonNode> index = getProblemIndex();
            if (index != null && index.containsKey(cleanNum)) {
                JsonNode pair = index.get(cleanNum);
                JsonNode stat = pair.path("stat");
                titleSlug = stat.path("question__title_slug").asText(null);
                title = stat.path("question__title").asText(null);
                int level = pair.path("difficulty").path("level").asInt(2);
                difficulty = level == 1 ? "Easy" : level == 3 ? "Hard" : "Medium";
                paidOnly = pair.path("paid_only").asBoolean(false);
            }

            // Step 1b: fallback — keyword search to resolve the slug.
            List<String> tags = new ArrayList<>();
            if (titleSlug == null || titleSlug.isEmpty()) {
                JsonNode matchedQuestion = keywordSearch(cleanNum);
                if (matchedQuestion == null) {
                    result.put("found", false);
                    result.put("message", "Problem #" + cleanNum + " was not found in LeetCode.");
                    return result;
                }
                titleSlug = matchedQuestion.path("titleSlug").asText();
                title = matchedQuestion.path("title").asText();
                difficulty = matchedQuestion.path("difficulty").asText();
                for (JsonNode tagNode : matchedQuestion.path("topicTags")) {
                    tags.add(tagNode.path("name").asText());
                }
            }

            // Step 2: fetch full content / topic tags via GraphQL question(titleSlug).
            String contentQuery = """
                query questionContent($titleSlug: String!) {
                  question(titleSlug: $titleSlug) {
                    questionFrontendId
                    title
                    difficulty
                    content
                    topicTags {
                      name
                    }
                  }
                }
            """;

            JsonNode detailResponse = executeGraphQL(contentQuery, Map.of("titleSlug", titleSlug));
            String rawContent = "";
            if (detailResponse != null && detailResponse.has("data")) {
                JsonNode q = detailResponse.path("data").path("question");
                rawContent = q.path("content").asText("");
                // Prefer authoritative fields from the content query when present.
                String qTitle = q.path("title").asText(null);
                if (qTitle != null && !qTitle.isEmpty()) title = qTitle;
                String qDiff = q.path("difficulty").asText(null);
                if (qDiff != null && !qDiff.isEmpty()) difficulty = qDiff;
                if (tags.isEmpty()) {
                    for (JsonNode tagNode : q.path("topicTags")) {
                        tags.add(tagNode.path("name").asText());
                    }
                }
            }

            String textContent = stripHtml(rawContent);

            result.put("found", true);
            result.put("problemNumber", cleanNum);
            result.put("title", title != null ? title : ("Problem #" + cleanNum));
            result.put("titleSlug", titleSlug);
            result.put("difficulty", difficulty != null ? difficulty : "Medium");
            result.put("topics", tags);
            result.put("pattern", !tags.isEmpty() ? tags.get(0) : "DSA Pattern");
            result.put("description", textContent);
            result.put("rawHtml", rawContent);
            result.put("paidOnly", paidOnly);
            result.put("url", "https://leetcode.com/problems/" + titleSlug + "/");
            if ((textContent == null || textContent.isEmpty()) && paidOnly) {
                result.put("message", "This is a LeetCode Premium problem — its description isn't publicly available. Paste it in chat and I'll take it from there.");
            }
            return result;

        } catch (Exception e) {
            log.warn("Error fetching LeetCode problem {}: {}", cleanNum, e.getMessage());
            result.put("found", false);
            result.put("message", "Could not reach LeetCode API: " + e.getMessage());
            return result;
        }
    }

    /**
     * Query recent accepted submissions for a public LeetCode username. LeetCode may
     * cap how many it returns regardless of the requested limit.
     */
    public List<Map<String, Object>> fetchRecentAcSubmissions(String username, int limit) {
        List<Map<String, Object>> submissions = new ArrayList<>();
        if (username == null || username.trim().isEmpty()) {
            return submissions;
        }

        try {
            String query = """
                query recentAcSubmissions($username: String!, $limit: Int!) {
                  recentAcSubmissionList(username: $username, limit: $limit) {
                    id
                    title
                    titleSlug
                    timestamp
                  }
                }
            """;

            JsonNode response = executeGraphQL(query, Map.of("username", username.trim(), "limit", Math.max(1, limit)));
            if (response != null && response.has("data")) {
                JsonNode listNode = response.path("data").path("recentAcSubmissionList");
                if (listNode.isArray()) {
                    // Ensure the problem index is warm so we can enrich each solve with
                    // its real difficulty + number (recentAcSubmissionList omits those).
                    getProblemIndex();
                    Map<String, JsonNode> bySlug = problemBySlug;
                    Set<String> seenSlugs = new HashSet<>();
                    for (JsonNode item : listNode) {
                        String slug = item.path("titleSlug").asText();
                        // recentAcSubmissionList can list the same problem multiple times
                        // (one row per accepted submission); dedupe by slug.
                        if (!slug.isEmpty() && !seenSlugs.add(slug)) {
                            continue;
                        }
                        Map<String, Object> sub = new HashMap<>();
                        sub.put("id", item.path("id").asText());
                        sub.put("title", item.path("title").asText());
                        sub.put("titleSlug", slug);
                        sub.put("timestamp", item.path("timestamp").asText());
                        sub.put("url", "https://leetcode.com/problems/" + slug + "/");
                        if (bySlug != null && bySlug.containsKey(slug)) {
                            JsonNode pair = bySlug.get(slug);
                            sub.put("difficulty", difficultyFromPair(pair));
                            sub.put("problemNumber", pair.path("stat").path("frontend_question_id").asText());
                        } else {
                            sub.put("difficulty", "Medium");
                        }
                        submissions.add(sub);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error fetching LeetCode recent submissions for {}: {}", username, e.getMessage());
        }

        return submissions;
    }

    /** GraphQL keyword search fallback: resolve a question node by frontend id. */
    private JsonNode keywordSearch(String cleanNum) {
        String listQuery = """
            query problemsetQuestionList($categorySlug: String, $filters: QuestionListFilterInput) {
              problemsetQuestionList: questionList(categorySlug: $categorySlug, filters: $filters, limit: 10) {
                questions: data {
                  questionFrontendId
                  title
                  titleSlug
                  difficulty
                  topicTags {
                    name
                  }
                }
              }
            }
        """;

        Map<String, Object> listVariables = Map.of(
            "categorySlug", "",
            "filters", Map.of("searchKeywords", cleanNum)
        );

        JsonNode listResponse = executeGraphQL(listQuery, listVariables);
        if (listResponse == null || !listResponse.has("data")) {
            return null;
        }
        JsonNode questionsNode = listResponse.path("data").path("problemsetQuestionList").path("questions");
        if (questionsNode.isArray()) {
            for (JsonNode q : questionsNode) {
                if (cleanNum.equalsIgnoreCase(q.path("questionFrontendId").asText())) {
                    return q;
                }
            }
        }
        return null;
    }

    /** Load (and cache) the public problem index: frontend id -> stat_status pair. */
    private Map<String, JsonNode> getProblemIndex() {
        long now = System.currentTimeMillis();
        Map<String, JsonNode> cached = problemIndex;
        if (cached != null && (now - problemIndexLoadedAt) < INDEX_TTL_MS) {
            return cached;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            HttpEntity<Void> req = new HttpEntity<>(headers);
            JsonNode resp = restTemplate.exchange(LEETCODE_ALL_URL, HttpMethod.GET, req, JsonNode.class).getBody();
            if (resp != null && resp.has("stat_status_pairs")) {
                Map<String, JsonNode> byNum = new HashMap<>();
                Map<String, JsonNode> bySlug = new HashMap<>();
                for (JsonNode pair : resp.get("stat_status_pairs")) {
                    JsonNode stat = pair.path("stat");
                    String fid = stat.path("frontend_question_id").asText();
                    String slug = stat.path("question__title_slug").asText();
                    if (!fid.isEmpty()) byNum.put(fid, pair);
                    if (!slug.isEmpty()) bySlug.put(slug, pair);
                }
                if (!byNum.isEmpty()) {
                    problemIndex = byNum;
                    problemBySlug = bySlug;
                    problemIndexLoadedAt = now;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to load LeetCode problem index (falling back to keyword search): {}", e.getMessage());
        }
        return problemIndex; // may be null / stale — callers fall back to keyword search
    }

    /** Map a stat_status pair's numeric difficulty level to the app's enum name. */
    private static String difficultyFromPair(JsonNode pair) {
        int level = pair.path("difficulty").path("level").asInt(2);
        return level == 1 ? "Easy" : level == 3 ? "Hard" : "Medium";
    }

    private String stripHtml(String rawContent) {
        if (rawContent == null) return "";
        return rawContent.replaceAll("<[^>]*>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private JsonNode executeGraphQL(String query, Map<String, Object> variables) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", USER_AGENT);

            Map<String, Object> body = new HashMap<>();
            body.put("query", query);
            if (variables != null) {
                body.put("variables", variables);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            return restTemplate.postForObject(LEETCODE_GRAPHQL_URL, request, JsonNode.class);
        } catch (Exception e) {
            log.warn("LeetCode GraphQL request failed: {}", e.getMessage());
            return null;
        }
    }
}
