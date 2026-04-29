package com.codementor.backend.controller;

import com.codementor.backend.entity.Submission;
import com.codementor.backend.service.SubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<Submission> createSubmission(
            @RequestBody Submission submission,
            HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(submissionService.createSubmission(submission, userId));
    }

    @GetMapping
    public ResponseEntity<List<Submission>> getMySubmissions(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(submissionService.getSubmissionsForUser(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmission(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        Long userId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(submissionService.getSubmissionByIdForUser(id, userId));
    }
}