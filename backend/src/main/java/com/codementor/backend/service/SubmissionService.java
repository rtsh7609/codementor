package com.codementor.backend.service;

import com.codementor.backend.entity.Submission;
import com.codementor.backend.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;

    public Submission createSubmission(Submission submission, Long userId) {
        submission.setUserId(userId);
        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsForUser(Long userId) {
        return submissionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Submission getSubmissionByIdForUser(Long id, Long userId) {
        return submissionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException(
                        "Submission not found with id: " + id));
    }

    // Used internally by ReviewService — doesn't enforce userId
    public Submission getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Submission not found with id: " + id));
    }
}