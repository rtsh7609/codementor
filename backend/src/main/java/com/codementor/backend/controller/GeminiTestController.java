package com.codementor.backend.controller;

import com.codementor.backend.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class GeminiTestController {

    private final GeminiService geminiService;

    @PostMapping("/gemini")
    public ResponseEntity<Map<String, String>> testGemini(@RequestBody Map<String, String> body) {
        String prompt = body.get("prompt");
        String response = geminiService.generateContent(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }
}