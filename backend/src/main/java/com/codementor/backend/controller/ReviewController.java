package com.codementor.backend.controller;

import com.codementor.backend.entity.Review;
import com.codementor.backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/submission/{submissionId}")
    public ResponseEntity<Review> reviewSubmission(@PathVariable Long submissionId) {
        Review review = reviewService.reviewSubmission(submissionId);
        return ResponseEntity.ok(review);
    }

    @GetMapping("/submission/{submissionId}")
    public ResponseEntity<List<Review>> getReviewsForSubmission(@PathVariable Long submissionId) {
        return ResponseEntity.ok(reviewService.getReviewsForSubmission(submissionId));
    }
}