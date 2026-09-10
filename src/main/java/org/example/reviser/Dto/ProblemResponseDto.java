package org.example.reviser.Dto;

import org.example.reviser.problem.Difficulty;

public class ProblemResponseDto {

    private Long id;
    private String title;
    private String platform;
    private Difficulty difficulty;
    private String pattern;

    public ProblemResponseDto() {}

    public ProblemResponseDto(Long id, String title, String platform,
                              Difficulty difficulty, String pattern) {
        this.id = id;
        this.title = title;
        this.platform = platform;
        this.difficulty = difficulty;
        this.pattern = pattern;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }
}
