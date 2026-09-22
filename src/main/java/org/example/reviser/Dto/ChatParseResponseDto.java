package org.example.reviser.Dto;

public class ChatParseResponseDto {

    private boolean parsed;
    private String rawMessage;

    // Extracted fields (null if parsing failed or field not detected)
    private String problemTitle;
    private Integer problemNumber;
    private String topic;
    private String pattern;
    private String difficulty;  // "Easy", "Medium", "Hard"
    private String platform;    // "LeetCode", "Codeforces", etc.
    private String keyIntuition;
    private String timeComplexity;
    private String spaceComplexity;
    private String status;      // "solved", "attempted", "reviewed"
    private Integer timeTakenMin;
    private Integer confidence; // 1-5
    private String description;
    private String tags;

    public ChatParseResponseDto() {}

    public static ChatParseResponseDto failed(String rawMessage) {
        ChatParseResponseDto dto = new ChatParseResponseDto();
        dto.parsed = false;
        dto.rawMessage = rawMessage;
        return dto;
    }

    public boolean isParsed() { return parsed; }
    public void setParsed(boolean parsed) { this.parsed = parsed; }

    public String getRawMessage() { return rawMessage; }
    public void setRawMessage(String rawMessage) { this.rawMessage = rawMessage; }

    public String getProblemTitle() { return problemTitle; }
    public void setProblemTitle(String problemTitle) { this.problemTitle = problemTitle; }

    public Integer getProblemNumber() { return problemNumber; }
    public void setProblemNumber(Integer problemNumber) { this.problemNumber = problemNumber; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getKeyIntuition() { return keyIntuition; }
    public void setKeyIntuition(String keyIntuition) { this.keyIntuition = keyIntuition; }

    public String getTimeComplexity() { return timeComplexity; }
    public void setTimeComplexity(String timeComplexity) { this.timeComplexity = timeComplexity; }

    public String getSpaceComplexity() { return spaceComplexity; }
    public void setSpaceComplexity(String spaceComplexity) { this.spaceComplexity = spaceComplexity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getTimeTakenMin() { return timeTakenMin; }
    public void setTimeTakenMin(Integer timeTakenMin) { this.timeTakenMin = timeTakenMin; }

    public Integer getConfidence() { return confidence; }
    public void setConfidence(Integer confidence) { this.confidence = confidence; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
}
