package org.example.reviser.chat;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat/history")
public class ChatMessageController {

    private final ChatMessageRepository chatMessageRepository;

    public ChatMessageController(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @GetMapping
    public List<ChatMessage> getChatHistory() {
        return chatMessageRepository.findAllByOrderByTimestampAsc();
    }

    @PostMapping
    public ResponseEntity<ChatMessage> saveMessage(@RequestBody ChatMessage message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }
        ChatMessage saved = chatMessageRepository.save(message);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/card-state")
    public ResponseEntity<ChatMessage> updateCardState(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        return chatMessageRepository.findById(id).map(msg -> {
            if (body.containsKey("confirmed")) {
                msg.setConfirmed(Boolean.TRUE.equals(body.get("confirmed")));
            }
            if (body.containsKey("savedProblemId") && body.get("savedProblemId") != null) {
                msg.setSavedProblemId(((Number) body.get("savedProblemId")).longValue());
            }
            if (body.containsKey("savedRating") && body.get("savedRating") != null) {
                msg.setSavedRating(((Number) body.get("savedRating")).intValue());
            }
            if (body.containsKey("cardStateJson") && body.get("cardStateJson") != null) {
                msg.setCardStateJson(body.get("cardStateJson").toString());
            }
            return ResponseEntity.ok(chatMessageRepository.save(msg));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> clearHistory() {
        chatMessageRepository.deleteAll();
        return ResponseEntity.ok(Map.of("status", "cleared"));
    }
}
