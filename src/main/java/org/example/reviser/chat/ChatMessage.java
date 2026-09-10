package org.example.reviser.chat;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String sender; // "user" or "bot"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // AI Detected problem details (if any)
    private String detectedProblemTitle;
    private String detectedProblemPlatform;
    private String detectedProblemDifficulty;
    private String detectedProblemPattern;
    private String suggestedSolveCommand;

    // Problem card confirmation & saved details
    private boolean confirmed;
    private Long savedProblemId;
    private Integer savedRating;

    // Extended self-assessment card state JSON (e.g. confidence, solvedWithoutHelp, neededHint)
    @Column(columnDefinition = "TEXT")
    private String cardStateJson;

    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String sender, String text) {
        this.sender = sender;
        this.text = text;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetectedProblemTitle() { return detectedProblemTitle; }
    public void setDetectedProblemTitle(String detectedProblemTitle) { this.detectedProblemTitle = detectedProblemTitle; }

    public String getDetectedProblemPlatform() { return detectedProblemPlatform; }
    public void setDetectedProblemPlatform(String detectedProblemPlatform) { this.detectedProblemPlatform = detectedProblemPlatform; }

    public String getDetectedProblemDifficulty() { return detectedProblemDifficulty; }
    public void setDetectedProblemDifficulty(String detectedProblemDifficulty) { this.detectedProblemDifficulty = detectedProblemDifficulty; }

    public String getDetectedProblemPattern() { return detectedProblemPattern; }
    public void setDetectedProblemPattern(String detectedProblemPattern) { this.detectedProblemPattern = detectedProblemPattern; }

    public String getSuggestedSolveCommand() { return suggestedSolveCommand; }
    public void setSuggestedSolveCommand(String suggestedSolveCommand) { this.suggestedSolveCommand = suggestedSolveCommand; }

    public boolean isConfirmed() { return confirmed; }
    public void setConfirmed(boolean confirmed) { this.confirmed = confirmed; }

    public Long getSavedProblemId() { return savedProblemId; }
    public void setSavedProblemId(Long savedProblemId) { this.savedProblemId = savedProblemId; }

    public Integer getSavedRating() { return savedRating; }
    public void setSavedRating(Integer savedRating) { this.savedRating = savedRating; }

    public String getCardStateJson() { return cardStateJson; }
    public void setCardStateJson(String cardStateJson) { this.cardStateJson = cardStateJson; }
}
