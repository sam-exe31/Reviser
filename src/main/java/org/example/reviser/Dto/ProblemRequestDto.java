package org.example.reviser.Dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.reviser.problem.Difficulty;

public class ProblemRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Platform is required")
    private String platform;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    private String pattern;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public Difficulty getDifficulty() { return difficulty; }
    public void setDifficulty(Difficulty difficulty) { this.difficulty = difficulty; }

    public String getPattern() { return pattern; }
    public void setPattern(String pattern) { this.pattern = pattern; }
}
