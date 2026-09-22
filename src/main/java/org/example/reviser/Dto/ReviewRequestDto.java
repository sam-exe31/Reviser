package org.example.reviser.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class ReviewRequestDto {

    @Min(value = 1, message = "Confidence must be between 1 and 5")
    @Max(value = 5, message = "Confidence must be between 1 and 5")
    private int confidence;

    private boolean solvedWithoutHelp;
    private boolean neededHint;
    private boolean rememberedPattern;
    private boolean couldExplainSolution;

    // Room for a full problem description + journal + user notes. The DB column
    // is TEXT, so this cap only guards against absurd payloads, not real notes.
    @Size(max = 20000, message = "Notes must be 20000 characters or fewer")
    private String notes;

    public int getConfidence() { return confidence; }
    public void setConfidence(int confidence) { this.confidence = confidence; }

    public boolean isSolvedWithoutHelp() { return solvedWithoutHelp; }
    public void setSolvedWithoutHelp(boolean solvedWithoutHelp) { this.solvedWithoutHelp = solvedWithoutHelp; }

    public boolean isNeededHint() { return neededHint; }
    public void setNeededHint(boolean neededHint) { this.neededHint = neededHint; }

    public boolean isRememberedPattern() { return rememberedPattern; }
    public void setRememberedPattern(boolean rememberedPattern) { this.rememberedPattern = rememberedPattern; }

    public boolean isCouldExplainSolution() { return couldExplainSolution; }
    public void setCouldExplainSolution(boolean couldExplainSolution) { this.couldExplainSolution = couldExplainSolution; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
