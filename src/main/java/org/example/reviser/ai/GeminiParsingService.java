package org.example.reviser.ai;

import org.example.reviser.Dto.ChatParseResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GeminiParsingService {

    private static final Logger log = LoggerFactory.getLogger(GeminiParsingService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final org.example.reviser.problem.LeetCodeService leetCodeService;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String geminiModel;

    private static final String GEMINI_BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    public String getGeminiUrl() {
        String model = (geminiModel != null && !geminiModel.trim().isEmpty()) ? geminiModel.trim() : "gemini-3.6-flash";
        String baseUrl = GEMINI_BASE_URL + model + ":generateContent";
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return baseUrl + "?key=" + apiKey.trim();
        }
        return baseUrl;
    }

    public GeminiParsingService(org.example.reviser.problem.LeetCodeService leetCodeService) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(45000);
        this.restTemplate = new RestTemplate(factory);
        this.leetCodeService = leetCodeService;
    }

    // Curated catalog of standard popular LeetCode problems for fast local lookup
    private static final Map<Integer, ProblemMeta> KNOWN_LEETCODE_BY_NUM = new HashMap<>();
    private static final Map<String, ProblemMeta> KNOWN_LEETCODE_BY_NAME = new HashMap<>();

    record ProblemMeta(int number, String title, String difficulty, String pattern, String intuition, String timeComp, String spaceComp) {}

    static {
        registerProblem(1, "Two Sum", "Easy", "Hash Map / Array", "Store complements in a Hash Map to find matching pairs in a single linear pass.", "O(N)", "O(N)");
        registerProblem(2, "Add Two Numbers", "Medium", "Linked List / Math", "Simulate elementary addition carry-over while traversing both linked lists node-by-node.", "O(max(N,M))", "O(max(N,M))");
        registerProblem(3, "Longest Substring Without Repeating Characters", "Medium", "Sliding Window", "Expand right pointer and record last seen index in map, shrinking left pointer when duplicates occur.", "O(N)", "O(min(N, M))");
        registerProblem(4, "Median of Two Sorted Arrays", "Hard", "Binary Search / Partition", "Binary search on smaller array partition to find balanced left and right halves.", "O(log(min(N,M)))", "O(1)");
        registerProblem(5, "Longest Palindromic Substring", "Medium", "Dynamic Programming / Two Pointers", "Expand around potential odd and even palindrome centers from each index.", "O(N^2)", "O(1)");
        registerProblem(11, "Container With Most Water", "Medium", "Two Pointers", "Start with pointers at both ends, compute area, and greedily move the shorter boundary inward.", "O(N)", "O(1)");
        registerProblem(15, "3Sum", "Medium", "Two Pointers / Sorting", "Sort array, fix first number, then use two pointers on remaining subarray while skipping duplicate values.", "O(N^2)", "O(1)");
        registerProblem(19, "Remove Nth Node From End of List", "Medium", "Fast & Slow Pointers", "Advance fast pointer N steps ahead, then move both together until fast reaches the end.", "O(N)", "O(1)");
        registerProblem(20, "Valid Parentheses", "Easy", "Stack", "Push expected closing brackets onto stack; ensure stack matches and is empty upon completion.", "O(N)", "O(N)");
        registerProblem(21, "Merge Two Sorted Lists", "Easy", "Linked List / Two Pointers", "Splice together nodes of two sorted lists by comparing values using a dummy head.", "O(N + M)", "O(1)");
        registerProblem(22, "Generate Parentheses", "Medium", "Backtracking", "Track open and closed bracket counts; only add closing bracket if count is strictly less than open.", "O(4^N / sqrt(N))", "O(N)");
        registerProblem(23, "Merge k Sorted Lists", "Hard", "Heap / Priority Queue", "Maintain a min-heap of size K containing the current node of each linked list.", "O(N log K)", "O(K)");
        registerProblem(33, "Search in Rotated Sorted Array", "Medium", "Modified Binary Search", "Identify which half of array is sorted in each step, and determine if target lies in that range.", "O(log N)", "O(1)");
        registerProblem(42, "Trapping Rain Water", "Hard", "Two Pointers / Monotonic Stack", "Maintain leftMax and rightMax boundaries; trapped water at current position is bounded by min(leftMax, rightMax) - height.", "O(N)", "O(1)");
        registerProblem(46, "Permutations", "Medium", "Backtracking", "Recursively swap or pick unused elements from candidate set to build full permutations.", "O(N * N!)", "O(N)");
        registerProblem(48, "Rotate Image", "Medium", "Matrix / Math", "Transpose the 2D matrix (swap across diagonal), then reverse each row horizontally.", "O(N^2)", "O(1)");
        registerProblem(49, "Group Anagrams", "Medium", "Hash Map / Sorting", "Use sorted string representation or character frequency tuple as hash map bucket key.", "O(N * K log K)", "O(N * K)");
        registerProblem(53, "Maximum Subarray", "Medium", "Kadane's Algorithm / DP", "Accumulate running sum; reset to current element whenever previous subarray sum becomes negative.", "O(N)", "O(1)");
        registerProblem(55, "Jump Game", "Medium", "Greedy", "Track furthest reachable index; if current position exceeds maxReach, return false.", "O(N)", "O(1)");
        registerProblem(56, "Merge Intervals", "Medium", "Sorting / Intervals", "Sort intervals by start time; merge current interval with previous if start <= prev.end.", "O(N log N)", "O(N)");
        registerProblem(67, "Add Binary", "Easy", "Bit Manipulation / Math", "Traverse binary strings from right to left, tracking sum and carry bits.", "O(max(N,M))", "O(max(N,M))");
        registerProblem(70, "Climbing Stairs", "Easy", "Dynamic Programming / Fibonacci", "Current ways is sum of ways(n-1) + ways(n-2) using two iterative state variables.", "O(N)", "O(1)");
        registerProblem(72, "Edit Distance", "Medium", "2D Dynamic Programming", "Grid DP dp[i][j] tracking min insertions, deletions, or substitutions between substrings.", "O(N * M)", "O(N * M)");
        registerProblem(76, "Minimum Window Substring", "Hard", "Sliding Window / Hash Map", "Expand window until all characters are covered, then shrink left boundary to find minimal valid length.", "O(N + M)", "O(K)");
        registerProblem(79, "Word Search", "Medium", "Backtracking / Grid DFS", "Explore 4-directional grid paths with in-place temporary masking to avoid reusing cells.", "O(N * M * 4^L)", "O(L)");
        registerProblem(98, "Validate Binary Search Tree", "Medium", "Tree DFS / Range Check", "Recursively validate that every node falls strictly within (minLimit, maxLimit).", "O(N)", "O(H)");
        registerProblem(102, "Binary Tree Level Order Traversal", "Medium", "Tree BFS / Queue", "Process tree level-by-level using queue size to batch each depth level.", "O(N)", "O(N)");
        registerProblem(104, "Maximum Depth of Binary Tree", "Easy", "Tree DFS", "Compute max depth as 1 + max(depth(left), depth(right)).", "O(N)", "O(H)");
        registerProblem(121, "Best Time to Buy and Sell Stock", "Easy", "Greedy / Single Pass", "Track min purchase price seen so far and maximize current price - minPrice.", "O(N)", "O(1)");
        registerProblem(125, "Valid Palindrome", "Easy", "Two Pointers", "Clean alphanumeric characters and compare from outer ends inward.", "O(N)", "O(1)");
        registerProblem(128, "Longest Consecutive Sequence", "Medium", "Hash Set", "Insert all numbers into Hash Set; only start counting streak if (num - 1) is not in set.", "O(N)", "O(N)");
        registerProblem(133, "Clone Graph", "Medium", "Graph DFS / Hash Map", "Traverse graph while caching cloned nodes in a visited map to handle cycles.", "O(V + E)", "O(V)");
        registerProblem(139, "Word Break", "Medium", "Dynamic Programming", "dp[i] is true if any prefix dp[j] is true and wordDict contains substring(j, i).", "O(N^2)", "O(N)");
        registerProblem(141, "Linked List Cycle", "Easy", "Fast & Slow Pointers (Floyd's)", "Move slow by 1 step and fast by 2 steps; if they meet, a cycle exists.", "O(N)", "O(1)");
        registerProblem(146, "LRU Cache", "Medium", "Doubly Linked List + Hash Map", "Hash Map maps key to node in Doubly Linked List for O(1) get, put, and eviction.", "O(1)", "O(Capacity)");
        registerProblem(152, "Maximum Product Subarray", "Medium", "Dynamic Programming", "Maintain both minProduct and maxProduct at each step due to negative multiplying signs.", "O(N)", "O(1)");
        registerProblem(198, "House Robber", "Medium", "Dynamic Programming", "dp[i] = max(dp[i-1], dp[i-2] + nums[i]) using two rolling state variables.", "O(N)", "O(1)");
        registerProblem(200, "Number of Islands", "Medium", "Graph DFS / BFS / Grid", "Iterate grid and trigger DFS on unvisited '1's to sink adjacent land cells.", "O(M * N)", "O(M * N)");
        registerProblem(206, "Reverse Linked List", "Easy", "Linked List / In-Place Reversal", "Iterate through list with 3 pointers (prev, curr, next) to reverse directional pointers.", "O(N)", "O(1)");
        registerProblem(207, "Course Schedule", "Medium", "Graph Topological Sort / Kahn's", "Track in-degrees of courses; push 0-in-degree courses to queue and check if all courses processed.", "O(V + E)", "O(V + E)");
        registerProblem(208, "Implement Trie (Prefix Tree)", "Medium", "Trie / Tree", "Tree structure where each node holds an array/map of child character branches and isEndOfWord flag.", "O(L)", "O(Total Chars)");
        registerProblem(215, "Kth Largest Element in an Array", "Medium", "Min-Heap / QuickSelect", "Maintain a min-heap of size K or perform QuickSelect partition on target rank.", "O(N log K)", "O(K)");
        registerProblem(226, "Invert Binary Tree", "Easy", "Tree DFS / Recursion", "Recursively swap left and right child pointers for each node in the tree.", "O(N)", "O(H)");
        registerProblem(230, "Kth Smallest Element in a BST", "Medium", "In-Order Tree Traversal", "In-order traversal on a BST visits nodes in strictly sorted ascending order.", "O(H + K)", "O(H)");
        registerProblem(238, "Product of Array Except Self", "Medium", "Prefix & Suffix Products", "Compute prefix products in first pass, then accumulate suffix product into output array.", "O(N)", "O(1)");
        registerProblem(300, "Longest Increasing Subsequence", "Medium", "Dynamic Programming / Binary Search", "dp[i] = length of LIS ending at i in O(N^2), or maintain tails array with binary search in O(N log N).", "O(N log N)", "O(N)");
        registerProblem(322, "Coin Change", "Medium", "Dynamic Programming / Knapsack", "dp[i] = min(dp[i], dp[i - coin] + 1) for each coin denomination.", "O(Amount * N)", "O(Amount)");
        registerProblem(347, "Top K Frequent Elements", "Medium", "Bucket Sort / Min-Heap", "Count frequencies with map, then bucket sort by frequency or maintain min-heap of size K.", "O(N)", "O(N)");
        registerProblem(416, "Partition Equal Subset Sum", "Medium", "0/1 Knapsack DP", "Subset sum problem targeting totalSum / 2 using 1D boolean DP array.", "O(N * Target)", "O(Target)");
        registerProblem(739, "Daily Temperatures", "Medium", "Monotonic Stack", "Use monotonic decreasing stack of indices to find distance to next warmer temperature.", "O(N)", "O(N)");
    }

    private static void registerProblem(int num, String title, String diff, String pattern, String intuition, String timeComp, String spaceComp) {
        ProblemMeta meta = new ProblemMeta(num, title, diff, pattern, intuition, timeComp, spaceComp);
        KNOWN_LEETCODE_BY_NUM.put(num, meta);
        KNOWN_LEETCODE_BY_NAME.put(title.toLowerCase(), meta);
    }

    public ChatParseResponseDto parseUserMessage(String chatMessage) {
        if (chatMessage == null || chatMessage.trim().isEmpty()) {
            return ChatParseResponseDto.failed(chatMessage);
        }

        String trimmed = chatMessage.trim();

        // 1. Check local registry first
        ChatParseResponseDto localMatch = matchFromLocalRegistry(trimmed);
        if (localMatch != null) {
            return localMatch;
        }

        // 2. Query Gemini for precise problem metadata resolution
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        You are a LeetCode & Coding problem analyzer.
                        Identify the exact official problem name, problem number, difficulty, and algorithmic pattern from the user message.
                        User query: "%s"
                        
                        Respond ONLY with valid JSON in this exact structure (no markdown, no backticks):
                        {
                          "isProblem": true,
                          "problemTitle": "56. Merge Intervals",
                          "problemNumber": 56,
                          "difficulty": "Medium",
                          "pattern": "Intervals / Sorting",
                          "platform": "LeetCode",
                          "keyIntuition": "Sort intervals by start time and iteratively merge overlapping intervals.",
                          "timeComplexity": "O(N log N)",
                          "spaceComplexity": "O(N)",
                          "status": "solved",
                          "confidence": 4
                        }
                        If not a problem query or greeting, output {"isProblem": false}.
                        """.formatted(trimmed.replace("\"", "\\\""));

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}]
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        JsonNode parsed = objectMapper.readTree(cleanedJson);
                        if (parsed.has("isProblem") && !parsed.get("isProblem").asBoolean()) {
                            return ruleBasedFallback(trimmed);
                        }

                        if (parsed.hasNonNull("problemTitle") && !parsed.get("problemTitle").asText().isEmpty()) {
                            ChatParseResponseDto dto = new ChatParseResponseDto();
                            dto.setParsed(true);
                            dto.setRawMessage(chatMessage);
                            dto.setProblemTitle(parsed.get("problemTitle").asText());
                            if (parsed.hasNonNull("problemNumber")) dto.setProblemNumber(parsed.get("problemNumber").asInt());
                            if (parsed.hasNonNull("pattern")) dto.setPattern(parsed.get("pattern").asText());
                            if (parsed.hasNonNull("difficulty")) dto.setDifficulty(parsed.get("difficulty").asText());
                            if (parsed.hasNonNull("platform")) dto.setPlatform(parsed.get("platform").asText());
                            if (parsed.hasNonNull("keyIntuition")) dto.setKeyIntuition(parsed.get("keyIntuition").asText());
                            if (parsed.hasNonNull("timeComplexity")) dto.setTimeComplexity(parsed.get("timeComplexity").asText());
                            if (parsed.hasNonNull("spaceComplexity")) dto.setSpaceComplexity(parsed.get("spaceComplexity").asText());
                            dto.setStatus("solved");
                            dto.setConfidence(4);
                            return dto;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini parse problem failed: {}", e.getMessage());
            }
        }

        return ruleBasedFallback(trimmed);
    }

    public static boolean isExplicitSolveCommand(String msg) {
        if (msg == null) return false;
        String lower = msg.trim().toLowerCase();
        return lower.startsWith("/solve") || lower.startsWith("/solved")
                || lower.startsWith("/log") || lower.startsWith("/save")
                || lower.startsWith("#solve") || lower.startsWith("#solved")
                || lower.startsWith("solved:") || lower.startsWith("log:") || lower.startsWith("save:");
    }

    public static String stripSolveCommandPrefix(String msg) {
        if (msg == null) return "";
        String trimmed = msg.trim();
        String lower = trimmed.toLowerCase();
        for (String prefix : List.of("/solve", "/solved", "/log", "/save", "#solve", "#solved", "solved:", "log:", "save:")) {
            if (lower.startsWith(prefix)) {
                return trimmed.substring(prefix.length()).trim();
            }
        }
        return trimmed;
    }

    public Map<String, Object> converseWithAssistant(String userMessage, Object rawHistory, String mode) {
        Map<String, Object> result = new HashMap<>();
        if (userMessage == null || userMessage.trim().isEmpty()) {
            result.put("reply", "### 💬 Reviser Study Assistant & AI Mentor\n\nAsk any DSA question, request problem breakdowns in **Java**, review your code, or ask about **OS, DBMS, Computer Networks, System Design**, and personal study schedules!");
            return result;
        }

        String trimmed = userMessage.trim();
        boolean isSolveCmd = isExplicitSolveCommand(trimmed);
        String queryForDetection = isSolveCmd ? stripSolveCommandPrefix(trimmed) : trimmed;
        if (queryForDetection.isEmpty()) queryForDetection = trimmed;

        ChatParseResponseDto detectedProblem = null;
        Map<String, Object> lcInfo = null;

        // ONLY trigger problem detection & logging card when user explicitly types /solved or /solve
        if (isSolveCmd) {
            Pattern numPat = Pattern.compile("(\\b\\d{1,5}\\b)");
            Matcher numMatcher = numPat.matcher(queryForDetection);
            String probNum = numMatcher.find() ? numMatcher.group(1) : null;

            if (probNum != null) {
                lcInfo = leetCodeService.fetchProblemByNumber(probNum);
                if (lcInfo != null && Boolean.TRUE.equals(lcInfo.get("found"))) {
                    detectedProblem = new ChatParseResponseDto();
                    detectedProblem.setParsed(true);
                    detectedProblem.setPlatform("LeetCode");
                    try {
                        detectedProblem.setProblemNumber(Integer.parseInt(probNum));
                    } catch (Exception e) {
                        detectedProblem.setProblemNumber(null);
                    }
                    detectedProblem.setProblemTitle((String) lcInfo.get("title"));
                    detectedProblem.setDifficulty((String) lcInfo.get("difficulty"));
                    detectedProblem.setPattern((String) lcInfo.get("pattern"));
                    detectedProblem.setKeyIntuition((String) lcInfo.get("description"));
                    detectedProblem.setDescription((String) lcInfo.get("description"));
                    // LeetCodeService returns "topics" as a List; join it into the
                    // DTO's tags String (there is no "tags" key, so the old cast was
                    // always null).
                    Object topicsObj = lcInfo.get("topics");
                    if (topicsObj instanceof List<?> topicList && !topicList.isEmpty()) {
                        StringBuilder tagSb = new StringBuilder();
                        for (Object t : topicList) {
                            if (tagSb.length() > 0) tagSb.append(", ");
                            tagSb.append(String.valueOf(t));
                        }
                        detectedProblem.setTags(tagSb.toString());
                    }
                    detectedProblem.setConfidence(4);
                }
            }

            if (detectedProblem == null) {
                detectedProblem = parseUserMessage(queryForDetection);
            }

            if (detectedProblem != null && detectedProblem.isParsed() && detectedProblem.getProblemTitle() != null) {
                result.put("detectedProblem", detectedProblem);
                if (detectedProblem.getProblemNumber() != null) {
                    result.put("suggestedSolveCommand", "/solved " + detectedProblem.getProblemNumber());
                }
            }
        }

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String systemInstruction = """
                        You are Reviser — a warm, friendly, genuinely helpful AI assistant.
                        You can chat about ANYTHING the user brings up (casual conversation,
                        personal questions, opinions, jokes, life advice, whatever's on their
                        mind) and you answer naturally and in good humour, the way a smart,
                        easy-going friend would. Never refuse to engage, never lecture the user
                        about "staying on topic", and never redirect a casual question back to
                        studying. Just be a great conversationalist who also happens to be an
                        expert engineer.

                        You are especially strong at software engineering and interview prep —
                        Data Structures & Algorithms (in Java), OS, DBMS, Computer Networks,
                        System Design, and Spring Boot — so when those come up, go deep with
                        clean GitHub Markdown, runnable Java, and honest Big-O analysis.

                        SPECIAL BEHAVIOUR — only when the user runs `/solved <number>` or `/solve <number>`:
                        - Begin with: `### 🧩 LeetCode <Number>: <Full Problem Title> (<Difficulty>)`
                        - Present the **4-Line DSA Journal** (Sam's 3-Month Roadmap standard):
                          - **1. Trigger**: the keyword/condition in the problem that signals the pattern.
                          - **2. Template**: the reusable algorithmic skeleton in clean Java.
                          - **3. Variant**: how this problem adapts or differs from the base pattern.
                          - **4. Failure**: the common pitfall or bug to watch for.
                        - Give the complete, optimal **Java solution** in a ```java ... ``` block.
                        - State explicit Time and Space Complexity.
                        - If the problem details were not accessible online, politely say:
                          *"I searched LeetCode for this problem but couldn't retrieve its
                          description right now. Could you paste or upload the problem statement
                          here? Once you do, I'll generate the full 4-line journal and optimal
                          Java solution."*

                        For everything else, just reply helpfully and conversationally to
                        whatever was actually asked.
                        """;

                String extraPrompt = trimmed;
                if (isSolveCmd && lcInfo != null && Boolean.TRUE.equals(lcInfo.get("found"))) {
                    String desc = lcInfo.get("description") != null ? String.valueOf(lcInfo.get("description")) : "";
                    String descSnippet = desc.length() > 300 ? desc.substring(0, 300) : desc;
                    extraPrompt = String.format("User ran /solved %s. LeetCode Problem Info: Title: %s, Difficulty: %s, Topic Tags: %s. Description snippet: %s. Please generate the 4-line DSA journal (Trigger, Template, Variant, Failure) and optimal Java solution.",
                            lcInfo.get("problemNumber"), lcInfo.get("title"), lcInfo.get("difficulty"), lcInfo.get("topics"), descSnippet);
                } else if (isSolveCmd && (lcInfo == null || !Boolean.TRUE.equals(lcInfo.get("found")))) {
                    extraPrompt = "User typed " + trimmed + ". Note: LeetCode real-time lookup could not find or access this problem. If you recognize this LeetCode problem, explain it with the 4-line journal and Java code; if not, ask the user to paste or upload the problem description in chat.";
                }

                List<Map<String, Object>> contents = new ArrayList<>();

                if (rawHistory instanceof List<?> histList) {
                    int startIdx = Math.max(0, histList.size() - 6);
                    for (int i = startIdx; i < histList.size(); i++) {
                        Object item = histList.get(i);
                        if (item instanceof Map<?, ?> map) {
                            String role = "user".equalsIgnoreCase(String.valueOf(map.get("role"))) ? "user" : "model";
                            String content = String.valueOf(map.get("content"));
                            if (content != null && !content.isBlank()) {
                                contents.add(Map.of(
                                        "role", role,
                                        "parts", List.of(Map.of("text", content))
                                ));
                            }
                        }
                    }
                }

                contents.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", systemInstruction + "\n\nUser Message: " + extraPrompt))
                ));

                Map<String, Object> requestBody = Map.of("contents", contents);

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    JsonNode candidate = response.get("candidates").get(0);
                    String rawText = extractCandidateText(candidate);
                    if (rawText != null && !rawText.isBlank()) {
                        result.put("reply", rawText);
                        return result;
                    }
                    // The candidate had no usable text — a safety/recitation block, or a
                    // thought-only response. Surface an honest message instead of letting
                    // the frontend fall back to generic "I've processed your message" filler.
                    String finishReason = candidate.has("finishReason") ? candidate.get("finishReason").asText() : null;
                    log.warn("Gemini returned an empty reply (finishReason={}).", finishReason);
                    if (finishReason != null && ("SAFETY".equals(finishReason) || "RECITATION".equals(finishReason)
                            || "PROHIBITED_CONTENT".equals(finishReason) || "BLOCKLIST".equals(finishReason))) {
                        result.put("reply", "I couldn't answer that one — the model's safety filter blocked the response (`"
                                + finishReason + "`). Try rewording it and I'll give it another go.");
                    } else {
                        result.put("reply", "Hmm, I drew a blank on that — the model came back empty"
                                + (finishReason != null ? " (`" + finishReason + "`)" : "")
                                + ". Mind rephrasing it and I'll take another shot?");
                    }
                    return result;
                }
            } catch (Exception e) {
                log.warn("Gemini natural converse failed: {}, falling back to local engine", e.getMessage());
            }
        }

        // Offline / Fallback
        ChatParseResponseDto localMatch = matchFromLocalRegistry(queryForDetection);
        result.put("reply", conversationalFallback(trimmed, localMatch, mode));
        if (isSolveCmd && localMatch != null && localMatch.getProblemNumber() != null) {
            result.put("suggestedSolveCommand", "/solved " + localMatch.getProblemNumber());
            if (!result.containsKey("detectedProblem")) {
                result.put("detectedProblem", localMatch);
            }
        }
        return result;
    }

    /**
     * Evaluates whether a monthly target step should be rescheduled.
     * Returns a clear decision: YES or NO with a concise rationale.
     */
    public Map<String, Object> evaluateStepRescheduling(String stepTitle, String category, Integer targetCount, Integer completedCount, String context) {
        Map<String, Object> result = new HashMap<>();
        String cat = category != null ? category : "DSA";
        int target = targetCount != null ? targetCount : 10;
        int completed = completedCount != null ? completedCount : 0;

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = String.format("""
                    You are Sam's executive SDE mentor evaluating a milestone in his 3-Month Roadmap (11 Sept - 11 Dec 2026).
                    Step Title: "%s"
                    Category: "%s"
                    Target Count: %d
                    Completed: %d
                    Context: "%s"

                    Roadmap Rule: DSA & Spaced Repetition must be protected at all costs. Never sacrifice DSA for premature system design or low-priority items.
                    Does this step need rescheduling or adjustment?
                    
                    Respond strictly in raw JSON (no markdown, no backticks):
                    {
                      "rescheduleRecommended": true,
                      "decision": "YES",
                      "rationale": "Clear 1-2 sentence assessment.",
                      "suggestedAdjustment": "Suggested adjustment or 'Stay on track.'"
                    }
                    Note: decision must be either "YES" or "NO".
                    """, stepTitle, cat, target, completed, context != null ? context : "3-Month SDE Roadmap Pacing");

                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of(
                                "role", "user",
                                "parts", List.of(Map.of("text", prompt))
                        ))
                );

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String jsonClean = rawText.replaceAll("(?s)^```(?:json)?|```$", "").trim();
                    try {
                        JsonNode parsed = objectMapper.readTree(jsonClean);
                        result.put("rescheduleRecommended", parsed.path("rescheduleRecommended").asBoolean(false));
                        result.put("decision", parsed.path("decision").asText("NO"));
                        result.put("rationale", parsed.path("rationale").asText("Step is well-aligned with current roadmap velocity."));
                        result.put("suggestedAdjustment", parsed.path("suggestedAdjustment").asText("Stay on track."));
                        return result;
                    } catch (Exception parseEx) {
                        log.warn("Failed to parse rescheduling JSON: {}", parseEx.getMessage());
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini evaluateStepRescheduling failed: {}", e.getMessage());
            }
        }

        // Smart deterministic heuristic fallback
        boolean behind = completed < (target * 0.3);
        result.put("rescheduleRecommended", behind);
        result.put("decision", behind ? "YES" : "NO");
        result.put("rationale", behind 
            ? "Pace is currently under 30% of target; adjust batch size to 2 problems/day to protect recall without backlog fatigue." 
            : "Velocity is healthy and within sustainable roadmap thresholds.");
        result.put("suggestedAdjustment", behind ? "Shift 2 new problems/day + day-7 re-solves to protect consolidation." : "Stay on track.");
        return result;
    }

    public Map<String, Object> generateGoalCrossQuestions(String userGoalPrompt) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        The user wants to plan a monthly revision and study goal.
                        User prompt: "%s"
                        
                        Analyze what might be missing or underspecified in their goal (e.g., daily time commitment, specific weak algorithmic patterns, core CS subjects like OS/DBMS balance, project build deliverables, or target mock cadence).
                        Generate 3 to 4 smart, interactive clarifying cross-questions to help uncover anything they missed before finalizing their monthly plan.
                        
                        Respond ONLY with raw JSON (no markdown, no backticks):
                        {
                          "questions": [
                            {
                              "id": "daily_hours",
                              "question": "What is your realistic daily time commitment?",
                              "options": ["1-2 hrs / day (Light)", "2-3 hrs / day (Balanced optimal)", "4+ hrs / day (Intensive bootcamp)"],
                              "defaultAnswer": "2-3 hrs / day (Balanced optimal)"
                            },
                            {
                              "id": "weak_spots",
                              "question": "Which DSA topics or patterns are currently your biggest weak spots?",
                              "options": ["Sliding Window & Two Pointers", "Dynamic Programming & Knapsack", "Binary Trees & Graphs", "Monotonic Stack & Intervals"],
                              "defaultAnswer": "Sliding Window & Two Pointers"
                            },
                            {
                              "id": "core_subjects",
                              "question": "How would you like to handle Core CS (DBMS, OS, System Design)?",
                              "options": ["DBMS (1 new lecture/day) + OS alternate days", "System Design & Distributed Caching", "Pure DSA focus only"],
                              "defaultAnswer": "DBMS (1 new lecture/day) + OS alternate days"
                            },
                            {
                              "id": "project_build",
                              "question": "Do you have an active project or hackathon deliverable this month?",
                              "options": ["1h daily build slot for a side project", "Hackathon prep & AI integration", "No project, focus 100% on interview prep"],
                              "defaultAnswer": "1h daily build slot for a side project"
                            }
                          ]
                        }
                        """.formatted(userGoalPrompt != null ? userGoalPrompt.replace("\"", "\\\"") : "");

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini cross-questions generator failed: {}, using fallback questions", e.getMessage());
            }
        }

        return fallbackGoalCrossQuestions(userGoalPrompt);
    }

    private Map<String, Object> fallbackGoalCrossQuestions(String userGoalPrompt) {
        List<Map<String, Object>> questions = new ArrayList<>();

        questions.add(Map.of(
                "id", "daily_hours",
                "question", "What is your realistic daily time commitment?",
                "options", List.of("1-2 hrs / day (Light / College heavy)", "2-3 hrs / day (Balanced optimal)", "4+ hrs / day (Intensive bootcamp)"),
                "defaultAnswer", "2-3 hrs / day (Balanced optimal)"
        ));

        questions.add(Map.of(
                "id", "weak_spots",
                "question", "Which DSA topics or patterns are currently your biggest weak spots?",
                "options", List.of("Sliding Window & Two Pointers", "Dynamic Programming & Knapsack", "Binary Trees & Graphs", "Monotonic Stack & Intervals"),
                "defaultAnswer", "Sliding Window & Two Pointers"
        ));

        questions.add(Map.of(
                "id", "core_subjects",
                "question", "How should we balance Core CS subjects (DBMS, OS, System Design)?",
                "options", List.of("DBMS (1 new lecture/day) + OS alternate days", "System Design & Distributed Caching", "Pure DSA practice only"),
                "defaultAnswer", "DBMS (1 new lecture/day) + OS alternate days"
        ));

        questions.add(Map.of(
                "id", "project_build",
                "question", "Do you have an active project or hackathon deliverable to schedule?",
                "options", List.of("1h daily build slot for a side project", "Hackathon prep & AI integration", "No project, focus 100% on interview prep"),
                "defaultAnswer", "1h daily build slot for a side project"
        ));

        return Map.of("questions", questions);
    }

    public Map<String, Object> analyzeGoalLive(String userGoalPrompt, Map<String, String> answers, String month) {
        String targetMonth = (month != null && !month.trim().isEmpty()) ? month.trim() : LocalDate.now().toString().substring(0, 7);
        String cleanPrompt = userGoalPrompt != null ? userGoalPrompt.trim() : "";

        if (apiKey != null && !apiKey.trim().isEmpty() && !cleanPrompt.isEmpty()) {
            try {
                StringBuilder contextBuilder = new StringBuilder();
                if (answers != null && !answers.isEmpty()) {
                    for (Map.Entry<String, String> entry : answers.entrySet()) {
                        contextBuilder.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
                    }
                }
                String answersContext = contextBuilder.toString();

                String prompt = """
                        You are an expert engineering mentor and study architect for a computer science candidate.
                        The user is typing their monthly study goal in real-time.
                        Current Month: %s
                        User's typed text: "%s"
                        User's answered diagnostic preferences (if any):
                        %s

                        Perform a comprehensive, real-time dynamic analysis of what they are typing.
                        Provide NOT JUST QUESTIONS, but deep strategic insight:
                        1. Intent summary.
                        2. Feasibility score (0-100), verdict (e.g. "Realistic & High ROI", "Burnout Risk", "Paced for Mastery", "Light / Ramp-Up"), daily and weekly hours estimate, and pacing assessment note.
                        3. Explicit strengths (2-3 items) of their strategy.
                        4. Critical blind spots / risks / missing elements (2-3 items) (e.g., missing mock drills, no spaced repetition buffer, lack of OS/DBMS theory, overambitious daily problem volume).
                        5. 2-3 proactive tactical recommendations (icon, title, detail).
                        6. 2-3 dynamic clarifying cross-questions tailored specifically to what's still missing, with 3-4 clickable option strings and a recommended default.
                        7. Sliced monthly targets (overallTarget, dailyTarget, categories breakdown with category and targetCount).
                        8. 4-week structured milestones (week 1 to 4 with week, theme, target, and focus).

                        Respond ONLY with raw JSON (no backticks, no markdown, no explanation):
                        {
                          "intent": "1-sentence summary of user's core aim",
                          "feasibility": {
                            "score": 88,
                            "verdict": "Realistic & High ROI",
                            "hoursPerDayEstimate": 2.5,
                            "weeklyHoursEstimate": 17.5,
                            "pacingAssessment": "2-3 problems daily plus 1h theory/build is sustainable and highly effective."
                          },
                          "strengths": [
                            "Strong focus on high-yield core DSA patterns",
                            "Balanced inclusion of system concepts"
                          ],
                          "blindSpots": [
                            "Zero mock interview pressure or timed contest blocks",
                            "No explicit review buffer for problem retention"
                          ],
                          "tacticalSuggestions": [
                            {
                              "icon": "⚡",
                              "title": "Introduce Spaced Interval Days",
                              "detail": "Reserve Saturday strictly for re-solving difficult flagged problems rather than new ones."
                            },
                            {
                              "icon": "🎯",
                              "title": "Front-load Sliding Window & Two Pointers",
                              "detail": "Allocate first 4 days to lock down dynamic boundary invariants."
                            }
                          ],
                          "questions": [
                            {
                              "id": "mock_frequency",
                              "question": "How often would you like to conduct timed mock interviews or contests?",
                              "options": ["1 mock every Sunday", "Bi-weekly timed assessments", "Self-timed LeetCode contests only", "No mocks, pure problem practice"],
                              "defaultAnswer": "1 mock every Sunday"
                            },
                            {
                              "id": "daily_time_split",
                              "question": "What is your committed daily study bandwidth?",
                              "options": ["1-2 hrs / day (Light)", "2-3 hrs / day (Balanced optimal)", "4+ hrs / day (Intensive bootcamp)"],
                              "defaultAnswer": "2-3 hrs / day (Balanced optimal)"
                            }
                          ],
                          "targets": {
                            "overallTarget": 60,
                            "dailyTarget": 2,
                            "categories": [
                              { "category": "dsa", "targetCount": 45 },
                              { "category": "os_dbms", "targetCount": 20 },
                              { "category": "build", "targetCount": 15 }
                            ]
                          },
                          "weeklyMilestones": [
                            { "week": 1, "theme": "Arrays, Sliding Window & DBMS Indexing", "target": 15, "focus": "Two pointers invariants & B+ Tree query costs" },
                            { "week": 2, "theme": "Trees, Graphs & OS Concurrency", "target": 15, "focus": "BFS/DFS patterns & Mutex/Semaphores" },
                            { "week": 3, "theme": "Dynamic Programming & Spring Boot Architecture", "target": 15, "focus": "1D/2D Knapsack memoization & REST design" },
                            { "week": 4, "theme": "Mock Drills, Complex Graphs & Capstone", "target": 15, "focus": "Timed mock problem solving & polish" }
                          ]
                        }
                        """.formatted(targetMonth, cleanPrompt.replace("\"", "\\\""), answersContext.replace("\"", "\\\""));

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini live goal analyzer failed: {}, falling back to local heuristic analyzer", e.getMessage());
            }
        }

        return fallbackAnalyzeGoalLive(cleanPrompt, answers, targetMonth);
    }

    private Map<String, Object> fallbackAnalyzeGoalLive(String prompt, Map<String, String> answers, String month) {
        String lower = prompt != null ? prompt.toLowerCase() : "";
        Map<String, Object> result = new HashMap<>();

        // Detect targets from text
        int totalTarget = 60;
        Matcher countMatcher = Pattern.compile("(\\d{1,3})\\s*(?:problems?|questions?|tasks?|items?)").matcher(lower);
        if (countMatcher.find()) {
            try {
                totalTarget = Math.max(10, Math.min(200, Integer.parseInt(countMatcher.group(1))));
            } catch (Exception ignored) {}
        } else {
            Matcher anyNum = Pattern.compile("\\b(\\d{2,3})\\b").matcher(lower);
            if (anyNum.find()) {
                try {
                    int val = Integer.parseInt(anyNum.group(1));
                    if (val >= 20 && val <= 180) totalTarget = val;
                } catch (Exception ignored) {}
            }
        }

        int dailyTarget = Math.max(1, (int) Math.ceil(totalTarget / 28.0));

        boolean hasMock = lower.contains("mock") || lower.contains("contest");
        boolean hasOsDbms = lower.contains("os") || lower.contains("dbms") || lower.contains("sql") || lower.contains("database");
        boolean hasBuild = lower.contains("build") || lower.contains("project") || lower.contains("react") || lower.contains("spring");
        boolean hasDp = lower.contains("dp") || lower.contains("dynamic programming");
        boolean hasGraph = lower.contains("graph") || lower.contains("tree");

        // Feasibility scoring
        int score = 86;
        if (dailyTarget > 5) score -= 25;
        else if (dailyTarget > 3) score -= 10;
        if (hasMock && hasOsDbms) score += 6;
        if (lower.length() < 20) score = Math.min(score, 74);
        score = Math.max(40, Math.min(96, score));

        String verdict = score >= 85 ? "Realistic & High ROI" : score >= 75 ? "Balanced Pace" : "Intensive / High Load";
        double hoursDaily = Math.round((dailyTarget * 0.8 + (hasBuild ? 1.0 : 0.5) + (hasOsDbms ? 0.75 : 0.0)) * 10.0) / 10.0;

        result.put("intent", lower.isEmpty() ? "Establish a consistent 30-day engineering study routine." : "Accelerate placement readiness through disciplined problem-solving and concept revision.");
        
        Map<String, Object> feasibility = new HashMap<>();
        feasibility.put("score", score);
        feasibility.put("verdict", verdict);
        feasibility.put("hoursPerDayEstimate", hoursDaily);
        feasibility.put("weeklyHoursEstimate", Math.round(hoursDaily * 6.5 * 10.0) / 10.0);
        feasibility.put("pacingAssessment", dailyTarget + " problems/day (~" + hoursDaily + "h daily) offers strong consistency while mitigating cognitive burnout.");
        result.put("feasibility", feasibility);

        // Strengths
        List<String> strengths = new ArrayList<>();
        strengths.add("Clear commitment to quantitative problem milestones (" + totalTarget + " total).");
        if (hasDp || hasGraph) strengths.add("Targeting high-frequency, high-interview-yield patterns (Graphs/DP).");
        else strengths.add("Structured progression suited for progressive difficulty scaling.");
        if (hasBuild) strengths.add("Maintains practical development velocity alongside interview theory.");
        result.put("strengths", strengths);

        // Blind spots
        List<String> blindSpots = new ArrayList<>();
        if (!hasMock) blindSpots.add("No scheduled mock interview drills or timed LeetCode contests under pressure.");
        if (!hasOsDbms) blindSpots.add("Core CS fundamentals (DBMS indexing, OS deadlocks/paging) appear unallocated.");
        if (!lower.contains("revision") && !lower.contains("spaced")) blindSpots.add("Risk of rapid forgetting without dedicated SM-2 active recall slots.");
        result.put("blindSpots", blindSpots);

        // Tactical suggestions
        List<Map<String, String>> suggestions = new ArrayList<>();
        suggestions.add(Map.of(
                "icon", "⚡",
                "title", "Active Recall Catch-up Day",
                "detail", "Dedicate Fridays or Saturdays exclusively to re-solving failed/starred problems without looking at solutions."
        ));
        suggestions.add(Map.of(
                "icon", "🎯",
                "title", "Front-load Sliding Window & Two Pointers",
                "detail", "Master boundary invariants in Week 1 before branching into multi-branch recursion."
        ));
        suggestions.add(Map.of(
                "icon", "⏱️",
                "title", "35-Minute Strict Problem Timer",
                "detail", "Cap initial independent thinking at 35 minutes before consulting conceptual hints to keep pace."
        ));
        result.put("tacticalSuggestions", suggestions);

        // Dynamic Questions
        List<Map<String, Object>> questions = new ArrayList<>();
        if (!answers.containsKey("daily_hours")) {
            questions.add(Map.of(
                    "id", "daily_hours",
                    "question", "What is your realistic daily time commitment?",
                    "options", List.of("1-2 hrs / day (Light / College heavy)", "2-3 hrs / day (Balanced optimal)", "4+ hrs / day (Intensive bootcamp)"),
                    "defaultAnswer", "2-3 hrs / day (Balanced optimal)"
            ));
        }
        if (!hasMock && !answers.containsKey("mock_cadence")) {
            questions.add(Map.of(
                    "id", "mock_cadence",
                    "question", "How would you like to incorporate mock interviews?",
                    "options", List.of("1 mock every Sunday", "Bi-weekly timed assessments", "Weekly LeetCode Sunday contest only", "No mocks, pure practice"),
                    "defaultAnswer", "1 mock every Sunday"
            ));
        }
        if (!hasOsDbms && !answers.containsKey("core_cs_split")) {
            questions.add(Map.of(
                    "id", "core_cs_split",
                    "question", "How should we schedule Core CS (DBMS & OS)?",
                    "options", List.of("1 DBMS lecture daily + OS alternate days", "Deep-dive System Design & Caching", "Pure DSA focus this month"),
                    "defaultAnswer", "1 DBMS lecture daily + OS alternate days"
            ));
        }
        if (questions.isEmpty()) {
            questions.add(Map.of(
                    "id", "dsa_focus",
                    "question", "Which DSA pattern should receive the highest priority?",
                    "options", List.of("Dynamic Programming & Knapsack", "Binary Trees & BSTs", "Sliding Window & Monotonic Stack", "Graph BFS/DFS & Topological Sort"),
                    "defaultAnswer", "Dynamic Programming & Knapsack"
            ));
        }
        result.put("questions", questions);

        // Targets
        int dsaCount = (int) Math.round(totalTarget * 0.65);
        int osDbmsCount = Math.max(12, (int) Math.round(totalTarget * 0.20));
        int buildCount = Math.max(10, totalTarget - dsaCount - osDbmsCount);

        Map<String, Object> targets = new HashMap<>();
        targets.put("overallTarget", totalTarget);
        targets.put("dailyTarget", dailyTarget);
        targets.put("categories", List.of(
                Map.of("category", "dsa", "targetCount", dsaCount),
                Map.of("category", "os_dbms", "targetCount", osDbmsCount),
                Map.of("category", "build", "targetCount", buildCount)
        ));
        result.put("targets", targets);

        // Weekly milestones
        result.put("weeklyMilestones", List.of(
                Map.of("week", 1, "theme", "Arrays, Sliding Window & DBMS Basics", "target", (int) Math.ceil(totalTarget * 0.25), "focus", "Pointer boundary invariants & B+ Tree storage mechanics"),
                Map.of("week", 2, "theme", "Trees, Recursion & OS Concurrency", "target", (int) Math.ceil(totalTarget * 0.25), "focus", "Tree DFS/BFS paths & Process synchronization/Semaphores"),
                Map.of("week", 3, "theme", "Dynamic Programming & Spring Boot Architecture", "target", (int) Math.ceil(totalTarget * 0.25), "focus", "Knapsack memoization & REST design with clean contracts"),
                Map.of("week", 4, "theme", "Graphs, Full Mock Drills & Capstone Polish", "target", (int) Math.ceil(totalTarget * 0.25), "focus", "Topological sort, Dijkstra & Timed interview simulation")
        ));

        return result;
    }

    private String extractCandidateText(JsonNode candidate) {
        if (candidate == null || !candidate.has("content")) return null;
        JsonNode content = candidate.get("content");
        if (!content.has("parts") || !content.get("parts").isArray()) return null;

        StringBuilder sb = new StringBuilder();
        for (JsonNode part : content.get("parts")) {
            if (part.has("thought") && part.get("thought").asBoolean(false)) {
                continue;
            }
            if (part.has("text")) {
                sb.append(part.get("text").asText());
            }
        }
        return sb.toString().trim();
    }

    private String extractJsonFromText(String text) {
        if (text == null) return null;
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.substring(7);
        } else if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }
        text = text.trim();

        int firstBrace = text.indexOf('{');
        int lastBrace = text.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return text.substring(firstBrace, lastBrace + 1).trim();
        }
        return text;
    }

    public Map<String, Object> generateGoalPlan(String userGoalPrompt) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        The user wants to set up a monthly revision and study goal.
                        User prompt: "%s"
                        
                        Analyze the request and produce a comprehensive, structured study plan with curated DSA Patterns & Topics.
                        Respond ONLY with raw JSON (no backticks, no markdown, no explanatory text).
                        
                        Schema:
                        {
                          "month": "2026-09",
                          "summary": "Short 1-2 sentence overview of the study trajectory",
                          "overallTarget": number,
                          "dailyTarget": number,
                          "categories": [
                            { "category": "dsa", "targetCount": number },
                            { "category": "system_design", "targetCount": number }
                          ],
                          "priorityOrder": ["dsa", "system_design"],
                          "dsaPatterns": [
                            {
                              "id": "string",
                              "name": "string (e.g. Two Pointers & Sliding Window)",
                              "priority": "Essential" or "High" or "Medium",
                              "difficulty": "Easy" or "Medium" or "Hard",
                              "description": "string",
                              "keyIntuition": "string",
                              "sampleProblems": ["Problem 1", "Problem 2"],
                              "targetCount": number
                            }
                          ],
                          "weeklySchedule": [
                            { "week": 1, "theme": "string", "target": number, "focus": "string" }
                          ]
                        }
                        """.formatted(userGoalPrompt.replace("\"", "\\\""));

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini goal planner failed: {}, using fallback plan", e.getMessage());
            }
        }

        return fallbackGoalPlan(userGoalPrompt);
    }

    private ChatParseResponseDto matchFromLocalRegistry(String message) {
        String lower = message.toLowerCase();

        Pattern numPattern = Pattern.compile("(?:leetcode|lc|problem|#)?\\s*(\\b\\d{1,4}\\b)");
        Matcher matcher = numPattern.matcher(lower);
        while (matcher.find()) {
            try {
                int num = Integer.parseInt(matcher.group(1));
                if (KNOWN_LEETCODE_BY_NUM.containsKey(num)) {
                    ProblemMeta meta = KNOWN_LEETCODE_BY_NUM.get(num);
                    ChatParseResponseDto dto = new ChatParseResponseDto();
                    dto.setParsed(true);
                    dto.setRawMessage(message);
                    dto.setProblemNumber(meta.number());
                    dto.setProblemTitle(meta.number() + ". " + meta.title());
                    dto.setDifficulty(meta.difficulty());
                    dto.setPattern(meta.pattern());
                    dto.setPlatform("LeetCode");
                    dto.setKeyIntuition(meta.intuition());
                    dto.setTimeComplexity(meta.timeComp());
                    dto.setSpaceComplexity(meta.spaceComp());
                    dto.setStatus("solved");
                    dto.setConfidence(4);
                    return dto;
                }
            } catch (Exception ignored) {}
        }

        for (Map.Entry<String, ProblemMeta> entry : KNOWN_LEETCODE_BY_NAME.entrySet()) {
            if (lower.contains(entry.getKey())) {
                ProblemMeta meta = entry.getValue();
                ChatParseResponseDto dto = new ChatParseResponseDto();
                dto.setParsed(true);
                dto.setRawMessage(message);
                dto.setProblemNumber(meta.number());
                dto.setProblemTitle(meta.number() + ". " + meta.title());
                dto.setDifficulty(meta.difficulty());
                dto.setPattern(meta.pattern());
                dto.setPlatform("LeetCode");
                dto.setKeyIntuition(meta.intuition());
                dto.setTimeComplexity(meta.timeComp());
                dto.setSpaceComplexity(meta.spaceComp());
                dto.setStatus("solved");
                dto.setConfidence(4);
                return dto;
            }
        }

        return null;
    }

    private ChatParseResponseDto ruleBasedFallback(String message) {
        Pattern numPattern = Pattern.compile("(\\b\\d{1,4}\\b)");
        Matcher matcher = numPattern.matcher(message);
        if (matcher.find()) {
            int num = Integer.parseInt(matcher.group(1));
            ChatParseResponseDto dto = new ChatParseResponseDto();
            dto.setParsed(true);
            dto.setRawMessage(message);
            dto.setProblemNumber(num);
            dto.setProblemTitle(num + ". Coding Problem #" + num);
            dto.setDifficulty("Medium");
            dto.setPattern("General Algorithmic Pattern");
            dto.setPlatform("LeetCode");
            dto.setKeyIntuition("Identify optimal data structures to reduce time complexity.");
            dto.setTimeComplexity("O(N)");
            dto.setSpaceComplexity("O(1)");
            dto.setStatus("solved");
            dto.setConfidence(4);
            return dto;
        }

        return ChatParseResponseDto.failed(message);
    }

    private String conversationalFallback(String userMessage, ChatParseResponseDto localMatch, String mode) {
        if (localMatch != null) {
            return "### 💡 LeetCode " + localMatch.getProblemTitle() + " (" + localMatch.getDifficulty() + ")\n\n" +
                    "• **Pattern**: `" + localMatch.getPattern() + "`\n" +
                    "• **Core Intuition**: " + localMatch.getKeyIntuition() + "\n" +
                    "• **Complexity**: Time `" + localMatch.getTimeComplexity() + "` | Space `" + localMatch.getSpaceComplexity() + "`\n\n" +
                    "Type `/solve " + localMatch.getProblemNumber() + "` to rate your retention and schedule your spaced repetition review.";
        }

        return "### 🤖 Reviser Study Assistant\n\n" +
                "I'm ready to assist with your coding revision, OS, DBMS, and system design questions!\n\n" +
                "* Ask about any LeetCode problem (e.g. *'What is problem 56'*, *'Explain problem 67 in Java'*)\n" +
                "* Ask OS / DBMS questions (e.g. *'Explain B+ tree indexing'*, *'Deadlock prevention mechanisms'*)\n" +
                "* Share your solution or code snippet for feedback and complexity analysis\n" +
                "* Type `/solve <problem>` to rate recall confidence and schedule spaced repetitions\n" +
                "* Type `/` in the chat input to view the command menu.";
    }

    public Map<String, Object> generateMasterDailyPlan(String dateStr, Integer weekNum, String customPrompt) {
        LocalDate date = LocalDate.now();
        if (dateStr != null && !dateStr.trim().isEmpty()) {
            try {
                date = LocalDate.parse(dateStr.trim());
            } catch (Exception ignored) {}
        }

        int week = weekNum != null ? Math.max(1, Math.min(4, weekNum)) : ((date.getDayOfMonth() - 1) / 7 + 1);
        if (week > 4) week = 4;

        java.time.DayOfWeek dow = date.getDayOfWeek();
        String dayName = dow.name(); // MONDAY, TUESDAY, etc.

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        You are the Reviser Personal Study Planning Agent.
                        Generate the user's exact prioritized Daily Agenda from their MASTER GOAL BLUEPRINT:
                        
                        Current Date: %s (%s)
                        Active Week of Month: Week %d
                        User Custom Notes/Additions: "%s"
                        
                        Master Routine Rules:
                        - Mon–Sat Daily Skeleton:
                          * Early Morning (Streak-based, no makeup): Light exercise (~20m) -> Read (20-30m) -> Skill practice (15-20m).
                          * 8:30–10:30 (Queue-based, carries over if missed): DSA 2 Revision problems (SM-2) + 3 new problems (prioritize any flagged weak-spot pattern). Log extra solved.
                          * 10:30–11:15 (Queue-based): DBMS 1 new lecture, recall-first notes.
                          * 11:15–12:00 (Queue-based): OS / Backend Alternate Slot (Mon/Wed/Fri: OS Deadlock/Paging; Tue/Thu: Backend core).
                          * 12:00–1:20 (Queue-based): Build / Learn Slot for the current weekly build theme (rotating deliverable across the month).
                          * Afternoon: College / other commitments (untouched).
                          * Evening (Streak-based): Exercise session.
                          * Night (Queue-based): 10-15 min active recall recap of covered material (not new).
                        - Saturday: Weekly Review (DSA sliding window / weak spot review + Full DBMS weekly pass + build review).
                        - Sunday: Open buffer day / catch-up.
                        
                        Respond ONLY with raw JSON (no backticks, no markdown):
                        {
                          "date": "%s",
                          "dayOfWeek": "%s",
                          "weekNumber": %d,
                          "weekTheme": "Week %d Theme Description",
                          "summary": "Short 1-sentence energizing trajectory for today",
                          "estimatedTotalMinutes": number,
                          "tasks": [
                            {
                              "id": "master-1",
                              "title": "Task title",
                              "description": "Clear actionable instruction",
                              "category": "dsa" | "os_dbms" | "build" | "habit" | "revision" | "recap",
                              "taskType": "queue" | "streak",
                              "priority": "High" | "Medium" | "Low",
                              "timeBlock": "e.g. 8:30 - 10:30 AM",
                              "estimatedMinutes": number,
                              "focusTip": "Active recall / technical focus tip"
                            }
                          ]
                        }
                        """.formatted(date.toString(), dayName, week, customPrompt != null ? customPrompt : "", date.toString(), dayName, week, week);

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini master blueprint generator failed: {}, using deterministic fallback", e.getMessage());
            }
        }

        return fallbackMasterDailyPlan(date, week, customPrompt);
    }

    private Map<String, Object> fallbackMasterDailyPlan(LocalDate date, int week, String customPrompt) {
        Map<String, Object> result = new HashMap<>();
        result.put("date", date.toString());
        result.put("dayOfWeek", date.getDayOfWeek().name());
        result.put("weekNumber", week);

        String weekTheme = "Week " + week + ": Focused DSA, Core CS Theory & Weekly Build Slot";
        result.put("weekTheme", weekTheme);

        List<Map<String, Object>> tasks = new ArrayList<>();
        java.time.DayOfWeek dow = date.getDayOfWeek();

        String dayName = dow.name();

        if (dow == java.time.DayOfWeek.SUNDAY) {
            result.put("summary", "Sunday Open Buffer & Strategy Day — Review past week logs, rest, and plan upcoming milestones.");
            result.put("estimatedTotalMinutes", 120);

            tasks.add(Map.of(
                    "id", "sun-1",
                    "title", "Morning Habit: Read & Skill Practice",
                    "description", "Read for 30 minutes and complete a short skill-practice session.",
                    "category", "habit",
                    "taskType", "streak",
                    "priority", "Medium",
                    "timeBlock", "Morning",
                    "estimatedMinutes", 45,
                    "focusTip", "Consistency across weekends keeps momentum high."
            ));
            tasks.add(Map.of(
                    "id", "sun-2",
                    "title", "Open Buffer / Catch-up DSA & Backlog",
                    "description", "Optional catch-up slot for any queue tasks carried over from the week.",
                    "category", "dsa",
                    "taskType", "queue",
                    "priority", "Low",
                    "timeBlock", "Flexible",
                    "estimatedMinutes", 60,
                    "focusTip", "Zero pressure buffer slot."
            ));
            tasks.add(Map.of(
                    "id", "sun-3",
                    "title", "Weekly Strategy & Milestone Planning",
                    "description", "Set weekly deliverables for " + weekTheme + ".",
                    "category", "build",
                    "taskType", "queue",
                    "priority", "Medium",
                    "timeBlock", "Evening",
                    "estimatedMinutes", 20,
                    "focusTip", "Clarify next week's focus areas."
            ));
        } else if (dow == java.time.DayOfWeek.SATURDAY) {
            result.put("summary", "Saturday Weekly Review: Intensive DSA Pattern Review (Sliding Window Focus) & Full DBMS Pass.");
            result.put("estimatedTotalMinutes", 260);

            tasks.add(Map.of(
                    "id", "sat-1",
                    "title", "Early Morning: Light Exercise & Reading",
                    "description", "Light exercise/bodyweight (20 min) -> focused reading (25 min) -> short skill drill (15 min).",
                    "category", "habit",
                    "taskType", "streak",
                    "priority", "Medium",
                    "timeBlock", "6:30 - 7:30 AM",
                    "estimatedMinutes", 60,
                    "focusTip", "Maintain streak integrity."
            ));
            tasks.add(Map.of(
                    "id", "sat-2",
                    "title", "DSA Weekly Review: Sliding Window & Weak Spots",
                    "description", "Deep pattern review. Check if Sliding Window issues resurfaced; practice 2 tricky window problems.",
                    "category", "dsa",
                    "taskType", "queue",
                    "priority", "High",
                    "timeBlock", "8:30 - 10:30 AM",
                    "estimatedMinutes", 120,
                    "focusTip", "Sliding window is your flagged weak spot — verify dynamic left-pointer boundary invariants."
            ));
            tasks.add(Map.of(
                    "id", "sat-3",
                    "title", "Full DBMS Weekly Review Pass",
                    "description", "Comprehensive pass over all DBMS lectures covered this week with recall-first summary.",
                    "category", "os_dbms",
                    "taskType", "queue",
                    "priority", "High",
                    "timeBlock", "10:30 - 11:30 AM",
                    "estimatedMinutes", 60,
                    "focusTip", "Test recall on B+ tree vs hash indexes and ACID isolation levels without opening notes."
            ));
            tasks.add(Map.of(
                    "id", "sat-4",
                    "title", "Evening Exercise Session",
                    "description", "Dedicated evening workout / physical reset.",
                    "category", "habit",
                    "taskType", "streak",
                    "priority", "High",
                    "timeBlock", "5:30 - 6:45 PM",
                    "estimatedMinutes", 75,
                    "focusTip", "Train consistently with progressive overload."
            ));
        } else {
            // MONDAY - FRIDAY (Standard Daily Skeleton)
            boolean isOddDay = dow == java.time.DayOfWeek.MONDAY || dow == java.time.DayOfWeek.WEDNESDAY || dow == java.time.DayOfWeek.FRIDAY;
            String osBackendTitle = isOddDay ? "OS Recall Revision: Deadlocks, Virtual Memory & Paging" : "Backend Core Concepts Deep Dive";
            String osBackendDesc = isOddDay ? "Active recall of covered OS topics (Paging, TLB, Page replacement, Semaphores)." : "Deepen Spring Boot architecture and clean API structure.";

            String buildSlotTitle = "Build Slot: Weekly Theme Focus";
            String buildSlotDesc = "Focused work on the current weekly build deliverable.";

            result.put("summary", "Daily Blueprint (" + dayName + ", " + weekTheme + ") — DSA 2 Revision + 3 New, Daily DBMS, " + (isOddDay ? "OS Revision" : "Backend") + ", and Build Slot.");
            result.put("estimatedTotalMinutes", 360);

            tasks.add(Map.of(
                    "id", "todo-1",
                    "title", "Early Morning: Light Exercise, Read & Skill Practice",
                    "description", "Morning physical reset, active reading, and a short skill drill.",
                    "category", "habit",
                    "taskType", "streak",
                    "priority", "High",
                    "timeBlock", "6:30 - 7:30 AM",
                    "estimatedMinutes", 60,
                    "focusTip", "Streak-based: no makeup, maintain every morning.",
                    "subtasks", List.of(
                            Map.of("id", "st-1-1", "title", "Light exercise & stretches", "category", "Warmup", "completed", false),
                            Map.of("id", "st-1-2", "title", "Reading: 25 min tech book / core concept reading", "category", "Theory", "completed", false),
                            Map.of("id", "st-1-3", "title", "Skill practice: 15 min drill", "category", "Review", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-2",
                    "title", "8:30–10:30 — DSA: 2 Revisions (SM-2) + 3 New Problems",
                    "description", "Solve 2 due revision cards + 3 new problems.",
                    "category", "dsa",
                    "taskType", "queue",
                    "priority", "High",
                    "timeBlock", "8:30 - 10:30 AM",
                    "estimatedMinutes", 120,
                    "focusTip", "Write the invariants first before coding.",
                    "subtasks", List.of(
                            Map.of("id", "st-2-1", "title", "SM-2 Recall: Solve 2 due spaced repetition problems", "category", "Review", "completed", false),
                            Map.of("id", "st-2-2", "title", "Solve 3 new practice problems", "category", "Code", "completed", false),
                            Map.of("id", "st-2-3", "title", "Log time complexity and invariants into Reviser", "category", "Review", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-3",
                    "title", "10:30–11:15 — DBMS: 1 New Lecture (Recall-First)",
                    "description", "Complete 1 new DBMS lecture and draft recall-first summary notes.",
                    "category", "os_dbms",
                    "taskType", "queue",
                    "priority", "High",
                    "timeBlock", "10:30 - 11:15 AM",
                    "estimatedMinutes", 45,
                    "focusTip", "Daily new lecture cadence: test recall immediately after lecture.",
                    "subtasks", List.of(
                            Map.of("id", "st-3-1", "title", "Complete 1 new DBMS lecture video", "category", "Theory", "completed", false),
                            Map.of("id", "st-3-2", "title", "Draft 2-sentence active recall summary notes", "category", "Theory", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-4",
                    "title", "11:15–12:00 — " + osBackendTitle,
                    "description", osBackendDesc,
                    "category", "os_dbms",
                    "taskType", "queue",
                    "priority", "Medium",
                    "timeBlock", "11:15 AM - 12:00 PM",
                    "estimatedMinutes", 45,
                    "focusTip", "Recall-based revision of already covered topics.",
                    "subtasks", List.of(
                            Map.of("id", "st-4-1", "title", "Study " + osBackendTitle + " notes and code examples", "category", "Theory", "completed", false),
                            Map.of("id", "st-4-2", "title", "Verify architectural understanding", "category", "Review", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-5",
                    "title", "12:00–1:20 — " + buildSlotTitle,
                    "description", buildSlotDesc,
                    "category", "build",
                    "taskType", "queue",
                    "priority", "High",
                    "timeBlock", "12:00 - 1:20 PM",
                    "estimatedMinutes", 80,
                    "focusTip", "This is where the active weekly theme lives.",
                    "subtasks", List.of(
                            Map.of("id", "st-5-1", "title", "Implement weekly theme components", "category", "Code", "completed", false),
                            Map.of("id", "st-5-2", "title", "Ship deliverable & test edge cases", "category", "Review", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-6",
                    "title", "Evening: Exercise Session",
                    "description", "Dedicated evening workout / physical reset.",
                    "category", "habit",
                    "taskType", "streak",
                    "priority", "High",
                    "timeBlock", "5:30 - 6:45 PM",
                    "estimatedMinutes", 75,
                    "focusTip", "Streak-based: daily physical reset.",
                    "subtasks", List.of(
                            Map.of("id", "st-6-1", "title", "Warmup & mobility stretches", "category", "Warmup", "completed", false),
                            Map.of("id", "st-6-2", "title", "Main workout routine", "category", "Warmup", "completed", false),
                            Map.of("id", "st-6-3", "title", "Cooldown & recovery", "category", "Warmup", "completed", false)
                    )
            ));

            tasks.add(Map.of(
                    "id", "todo-7",
                    "title", "Night: 10–15 Min Active Recall Recap",
                    "description", "Quick mental / bullet-point recap of what you covered today (no new material).",
                    "category", "recap",
                    "taskType", "queue",
                    "priority", "Medium",
                    "timeBlock", "10:00 - 10:15 PM",
                    "estimatedMinutes", 15,
                    "focusTip", "Active recall before bed consolidates long-term memory.",
                    "subtasks", List.of(
                            Map.of("id", "st-7-1", "title", "Mental review of DSA patterns covered", "category", "Review", "completed", false),
                            Map.of("id", "st-7-2", "title", "Review DBMS ACID & OS flashcards", "category", "Review", "completed", false)
                    )
            ));
        }

        result.put("tasks", tasks);
        return result;
    }

    public Map<String, Object> generateDailyTodoList(String userPlanPrompt) {
        if (userPlanPrompt == null || userPlanPrompt.trim().isEmpty() || userPlanPrompt.toLowerCase().contains("master") || userPlanPrompt.toLowerCase().contains("today") || userPlanPrompt.toLowerCase().contains("routine")) {
            return generateMasterDailyPlan(LocalDate.now().toString(), null, userPlanPrompt);
        }

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        The user wants to organize their day into a prioritized, actionable Daily Things-To-Do list.
                        User plans in plain English: "%s"
                        
                        Align with their Master Routine:
                        - 8:30-10:30 DSA (2 SM-2 Revisions + 3 New)
                        - 10:30-11:15 DBMS Daily Lecture
                        - 11:15-12:00 OS / Backend Alternate
                        - 12:00-1:20 Weekly Build Slot (current rotating build theme)
                        - Early morning & Evening exercise / Read / Skill practice
                        
                        Respond ONLY with raw JSON (no backticks, no markdown):
                        {
                          "date": "%s",
                          "summary": "Short 1-sentence energizing overview of today's focus",
                          "estimatedTotalMinutes": number,
                          "tasks": [
                            {
                              "id": "todo-1",
                              "title": "Short actionable task title",
                              "description": "Brief instruction or sub-goal",
                              "category": "dsa" | "os_dbms" | "build" | "habit" | "revision" | "recap" | "general",
                              "taskType": "queue" | "streak",
                              "priority": "High" | "Medium" | "Low",
                              "estimatedMinutes": number,
                              "timeBlock": "e.g. 45 min" or "8:30 - 10:30 AM",
                              "focusTip": "Key tip or concept to remember while doing this"
                            }
                          ]
                        }
                        """.formatted(userPlanPrompt.replace("\"", "\\\""), LocalDate.now().toString());

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini daily todo planner failed: {}, using fallback plan", e.getMessage());
            }
        }

        return fallbackMasterDailyPlan(LocalDate.now(), 1, userPlanPrompt);
    }

    public Map<String, Object> generateSubtasksForTask(String title, String category) {
        Map<String, Object> result = new HashMap<>();
        String cleanTitle = title != null ? title.trim() : "";
        String cat = category != null ? category.trim() : "General";

        if (cleanTitle.isEmpty()) {
            result.put("subtasks", List.of());
            return result;
        }

        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                String prompt = """
                        Break down this task into 2 to 4 concrete, actionable sub-ticks/subtasks:
                        Task: "%s"
                        Category: "%s"

                        Respond ONLY with raw JSON:
                        {
                          "subtasks": [
                            { "title": "Subtask 1 action" },
                            { "title": "Subtask 2 action" }
                          ]
                        }
                        """.formatted(cleanTitle.replace("\"", "\\\""), cat.replace("\"", "\\\""));

                HttpHeaders headers = new HttpHeaders();
                headers.set("x-goog-api-key", apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);

                String body = """
                        {
                          "contents": [{"parts": [{"text": %s}]}],
                          "generationConfig": {
                            "responseMimeType": "application/json"
                          }
                        }
                        """.formatted(objectMapper.valueToTree(prompt).toString());

                HttpEntity<String> request = new HttpEntity<>(body, headers);
                JsonNode response = restTemplate.postForObject(getGeminiUrl(), request, JsonNode.class);

                if (response != null && response.has("candidates") && !response.get("candidates").isEmpty()) {
                    String rawText = extractCandidateText(response.get("candidates").get(0));
                    String cleanedJson = extractJsonFromText(rawText);
                    if (cleanedJson != null && !cleanedJson.isEmpty()) {
                        return objectMapper.readValue(cleanedJson, Map.class);
                    }
                }
            } catch (Exception e) {
                log.warn("Gemini subtask generator failed: {}, using smart fallback", e.getMessage());
            }
        }

        // Smart dynamic heuristics fallback
        List<Map<String, Object>> subtasks = new ArrayList<>();
        String lower = cleanTitle.toLowerCase();

        if (lower.contains("skip") || lower.contains("rope") || lower.contains("jump")) {
            Matcher m = Pattern.compile("(\\d+)").matcher(cleanTitle);
            int count = m.find() ? Integer.parseInt(m.group(1)) : 1500;
            int split = Math.max(100, count / 3);
            subtasks.add(Map.of("title", split + " jumps (Warmup round)", "completed", false));
            subtasks.add(Map.of("title", split + " jumps (High tempo set)", "completed", false));
            subtasks.add(Map.of("title", (count - (split * 2)) + " jumps (Finisher set)", "completed", false));
        } else if (lower.contains("morning") || lower.contains("routine") || lower.contains("habit")) {
            subtasks.add(Map.of("title", "Hydration & 5-min mobility stretches", "completed", false));
            subtasks.add(Map.of("title", "Core activity execution (" + cleanTitle + ")", "completed", false));
            subtasks.add(Map.of("title", "Cooldown & log streak in Reviser", "completed", false));
        } else if (cat.equalsIgnoreCase("DSA") || lower.contains("problem") || lower.contains("leetcode") || lower.contains("sum")) {
            subtasks.add(Map.of("title", "Identify pattern & write invariant logic", "completed", false));
            subtasks.add(Map.of("title", "Code optimal Java solution & verify complexity", "completed", false));
            subtasks.add(Map.of("title", "Trace boundary edge cases (empty, duplicates, overflow)", "completed", false));
        } else if (cat.equalsIgnoreCase("DBMS") || cat.equalsIgnoreCase("OS") || lower.contains("theory")) {
            subtasks.add(Map.of("title", "Study core mechanics & architecture diagrams", "completed", false));
            subtasks.add(Map.of("title", "Draft 2-sentence active recall summary in notes", "completed", false));
        } else {
            subtasks.add(Map.of("title", "Setup & clarify requirements", "completed", false));
            subtasks.add(Map.of("title", "Core implementation & execution", "completed", false));
            subtasks.add(Map.of("title", "Verify & final review", "completed", false));
        }

        result.put("subtasks", subtasks);
        return result;
    }

    private Map<String, Object> fallbackGoalPlan(String userGoalPrompt) {
        Map<String, Object> plan = new HashMap<>();
        plan.put("month", LocalDate.now().toString().substring(0, 7));
        plan.put("summary", "Master 4-Week Blueprint: DSA 2 revisions + 3 new daily, daily DBMS lectures, OS/backend theory, and a weekly rotating build slot.");
        plan.put("overallTarget", 60);
        plan.put("dailyTarget", 2);
        plan.put("categories", List.of(
                Map.of("category", "dsa", "targetCount", 50),
                Map.of("category", "os_dbms", "targetCount", 24),
                Map.of("category", "build", "targetCount", 24)
        ));
        plan.put("priorityOrder", List.of("dsa", "os_dbms", "build"));
        plan.put("dsaPatterns", List.of(
                Map.of(
                        "id", "pat-1",
                        "name", "Two Pointers & Sliding Window",
                        "priority", "Essential (Flagged Weak Spot)",
                        "difficulty", "Medium",
                        "description", "Linear subarray scanning and boundary adjustments.",
                        "keyIntuition", "Expand right boundary, shrink left conditionally.",
                        "sampleProblems", List.of("3Sum", "Minimum Window Substring", "Longest Substring Without Repeating Characters"),
                        "targetCount", 14
                ),
                Map.of(
                        "id", "pat-2",
                        "name", "Monotonic Stack & Queue",
                        "priority", "High",
                        "difficulty", "Medium",
                        "description", "Nearest greater/smaller element queries in O(N).",
                        "keyIntuition", "Maintain sorted invariant stack.",
                        "sampleProblems", List.of("Daily Temperatures", "Next Greater Element", "Trapping Rain Water"),
                        "targetCount", 10
                ),
                Map.of(
                        "id", "pat-3",
                        "name", "Trees & BST DFS/BFS",
                        "priority", "Essential",
                        "difficulty", "Medium",
                        "description", "Tree properties, depth, path finding, and level-order traversal.",
                        "keyIntuition", "Recursive base case or level-by-level queue processing.",
                        "sampleProblems", List.of("Invert Binary Tree", "Validate BST", "Binary Tree Level Order Traversal"),
                        "targetCount", 12
                )
        ));
        return plan;
    }
}
