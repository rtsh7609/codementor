package com.codementor.backend.service;

import com.codementor.backend.dto.gemini.GeminiRequest;
import com.codementor.backend.dto.gemini.GeminiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 2000;

    private final RestClient geminiRestClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Value("${gemini.api.model}")
    private String model;

    public String generateContent(String prompt) {
        log.info("Calling Gemini API with prompt length: {}", prompt.length());

        GeminiRequest request = new GeminiRequest(
                List.of(new GeminiRequest.Content(
                        List.of(new GeminiRequest.Part(prompt))
                ))
        );

        String fullUrl = apiUrl + "/" + model + ":generateContent?key=" + apiKey;

        // Try up to MAX_RETRIES times if Gemini is overloaded
        HttpServerErrorException lastException = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                GeminiResponse response = geminiRestClient.post()
                        .uri(fullUrl)
                        .body(request)
                        .retrieve()
                        .body(GeminiResponse.class);

                if (response == null
                        || response.getCandidates() == null
                        || response.getCandidates().isEmpty()) {
                    log.error("Gemini returned an empty response");
                    throw new RuntimeException("Gemini returned an empty response");
                }

                String text = response.getCandidates().get(0)
                        .getContent()
                        .getParts().get(0)
                        .getText();

                log.info("Gemini responded with {} characters (attempt {})", text.length(), attempt);
                return text;

            } catch (HttpServerErrorException e) {
                lastException = e;
                log.warn("Gemini API error (attempt {}/{}): {} — retrying in {}ms",
                        attempt, MAX_RETRIES, e.getStatusCode(), RETRY_DELAY_MS);

                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Interrupted while waiting to retry", ie);
                    }
                }
            }
        }

        log.error("Gemini API failed after {} attempts", MAX_RETRIES);
        throw new RuntimeException(
                "Gemini is temporarily unavailable. Please try again in a moment.",
                lastException
        );
    }
}