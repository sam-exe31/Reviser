package org.example.reviser.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/settings")
public class AppSettingController {

    private final AppSettingRepository settingRepository;

    public AppSettingController(AppSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @GetMapping("/{key}")
    public ResponseEntity<Map<String, String>> getSetting(@PathVariable String key) {
        return settingRepository.findById(key)
                .map(s -> ResponseEntity.ok(Map.of("key", s.getKey(), "value", s.getValue() != null ? s.getValue() : "")))
                .orElseGet(() -> ResponseEntity.ok(Map.of("key", key, "value", "")));
    }

    @PutMapping("/{key}")
    public ResponseEntity<Map<String, String>> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> body) {
        String value = body.getOrDefault("value", "");
        AppSetting setting = settingRepository.findById(key)
                .orElse(new AppSetting(key, value));
        setting.setValue(value);
        setting.setUpdatedAt(LocalDateTime.now());
        settingRepository.save(setting);
        return ResponseEntity.ok(Map.of("key", key, "value", value));
    }
}
