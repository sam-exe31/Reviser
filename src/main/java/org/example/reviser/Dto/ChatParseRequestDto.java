package org.example.reviser.Dto;

import jakarta.validation.constraints.NotBlank;

public class ChatParseRequestDto {

    @NotBlank(message = "Message cannot be empty")
    private String message;

    public ChatParseRequestDto() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
