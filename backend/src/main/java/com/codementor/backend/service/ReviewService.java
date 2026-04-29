package com.codementor.backend.service;

import com.codementor.backend.entity.Review;
import com.codementor.backend.entity.Submission;
import com.codementor.backend.repository.ReviewRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final SubmissionService submissionService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Review reviewSubmission(Long submissionId) {
        // 1. Fetch the submission from the database
        Submission submission = submissionService.getSubmissionById(submissionId);

        // 2. Build the prompt
        String prompt = buildPrompt(submission.getLanguage(), submission.getCode());

        // 3. Call Gemini
        String geminiResponse = geminiService.generateContent(prompt);

        // 4. Clean up the response (sometimes Gemini wraps JSON in ```json ... ```)
        String cleanedJson = cleanJsonResponse(geminiResponse);

        // 5. Parse it to extract score and summary
        Integer score = null;
        String summary = null;
        String status = "COMPLETED";

        try {
            JsonNode root = objectMapper.readTree(cleanedJson);
            score = root.has("overall_score") ? root.get("overall_score").asInt() : null;
            summary = root.has("summary") ? root.get("summary").asText() : null;
        } catch (Exception e) {
            log.error("Failed to parse Gemini response as JSON: {}", e.getMessage());
            status = "FAILED";
        }

        // 6. Save the review
        Review review = new Review();
        review.setSubmissionId(submissionId);
        review.setOverallScore(score);
        review.setSummary(summary);
        review.setRawJson(cleanedJson);
        review.setStatus(status);

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsForSubmission(Long submissionId) {
        return reviewRepository.findBySubmissionIdOrderByCreatedAtDesc(submissionId);
    }

    private String buildPrompt(String language, String code) {
        return """
                You are a senior software engineer doing a thorough code review.
                
                Language: %s
                Code:
```%s
                %s
```
                
                Analyze the code carefully and respond with ONLY a valid JSON object (no markdown, no code fences, no explanation outside JSON) in this EXACT schema:
                
                {
                  "overall_score": <integer from 1 to 100>,
                  "summary": "<2-3 sentence overall assessment>",
                  "bugs": [
                    {
                      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                      "line": <line number or null>,
                      "issue": "<short description>",
                      "fix": "<how to fix it>"
                    }
                  ],
                  "suggestions": [
                    {
                      "type": "REFACTOR" | "PERFORMANCE" | "READABILITY",
                      "line": <line number or null>,
                      "current": "<the current code snippet>",
                      "suggested": "<the improved code>",
                      "reason": "<brief explanation>"
                    }
                  ],
                  "complexity": {
                    "time": "<Big-O notation, e.g. O(n)>",
                    "space": "<Big-O notation>",
                    "explanation": "<brief explanation>"
                  },
                  "best_practices": [
                    "<a list of best-practice observations - good or bad>"
                  ]
                }
                
                If there are no bugs or suggestions, return empty arrays.
                Respond with ONLY the JSON object, nothing else.
                """.formatted(language, language, code);
    }

    private String cleanJsonResponse(String response) {
        // Gemini sometimes wraps JSON in ```json ... ```
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}