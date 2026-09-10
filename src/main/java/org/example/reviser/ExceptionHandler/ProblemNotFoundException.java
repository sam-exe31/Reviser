package org.example.reviser.ExceptionHandler;

public class ProblemNotFoundException extends RuntimeException{
    public ProblemNotFoundException(Long problemId) {
        super("Problem not found: " + problemId);
    }

}
