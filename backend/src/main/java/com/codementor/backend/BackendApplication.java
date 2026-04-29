package com.codementor.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner verifyGeminiKey(@Value("${gemini.api.key}") String apiKey) {
        return args -> {
            if (apiKey == null || apiKey.isBlank()) {
                System.out.println("⚠️  Gemini API key is MISSING!");
            } else {
                String masked = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length() - 4);
                System.out.println("✅ Gemini API key loaded: " + masked);
            }
        };
    }
}