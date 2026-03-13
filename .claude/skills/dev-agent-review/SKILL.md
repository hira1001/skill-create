---
name: dev-agent-review
description: |
  Reviews code changes for correctness, security, performance, and maintainability.
  Can review staged changes, a PR diff, or specific files. Produces a structured
  review report with findings categorized by severity.
  Use when: "review my code", "check for issues", "コードレビューして",
  "変更をレビューして", "find security issues", "is this code good?",
  "security review", "performance review", "変更点をレビュー".
  Can also be used standalone or as Phase 5 of dev-agent.
  Do NOT use when: user wants code changed (use dev-agent), or wants explanation
  only without a review verdict.
---

# Code Reviewer

Evaluate code changes against quality, security, correctness, and maintainability criteria.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read the most recent execution output (fix/generate/refactor) from `.agent/phase3/`.
Review the files listed in `files_modified` and `files_created`.

### Suite Mode — Review Retry
The orchestrator may invoke this skill a second time in the same flow if the first review returned `"verdict": "FAIL"`. On the second invocation:
- The Phase 3 skill will have already re-run to address the critical findings.
- Focus the re-review on whether the previously reported `critical` findings have been resolved.
- Produce a fresh `review-output.json` (overwrites the previous one).
- It is acceptable to report new findings discovered during re-review.

### Standalone Mode
Accept specific files, a directory, or "review staged changes" from the user.
Run `git diff --staged` or `git diff HEAD~1` to get the diff if reviewing recent changes.

## Review Dimensions

Evaluate each change across 5 dimensions. See [review-criteria.md](references/review-criteria.md) for detailed rules.

### 1. Correctness
- Does the code do what it claims to do?
- Are edge cases handled (null, empty, overflow, concurrent access)?
- Are error paths covered?

### 2. Security
- No injection vulnerabilities (SQL, command, XSS)
- No hardcoded credentials or secrets
- Input validated at trust boundaries
- No sensitive data logged or exposed

### 3. Performance
- No obvious N+1 queries or O(n²) loops in hot paths
- No blocking operations in async contexts
- No unnecessary re-renders or re-computations

### 4. Maintainability
- Naming is clear and consistent with project conventions
- Functions are focused (single responsibility)
- No duplication that should be extracted
- No magic numbers or unclear constants

### 5. Test Coverage
- New code paths have corresponding tests
- Edge cases are tested
- Tests are isolated and deterministic

## Process

1. **Read the diff**: Use git diff or read modified files directly.
2. **For each changed file**: Apply the 5 review dimensions.
3. **Categorize findings** by severity: `critical` / `warning` / `suggestion`.
4. **Produce a verdict**: PASS (no critical), WARN (warnings only), FAIL (has criticals).

## Output Format

Write to `.agent/phase5/review-output.json`:

```json
{
  "verdict": "WARN",
  "files_reviewed": ["src/auth.ts", "src/routes/user.ts"],
  "findings": [
    {
      "severity": "critical",
      "file": "src/routes/user.ts",
      "line": 34,
      "dimension": "security",
      "issue": "User input passed directly to SQL query without sanitization",
      "recommendation": "Use parameterized query: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    },
    {
      "severity": "warning",
      "file": "src/auth.ts",
      "line": 12,
      "dimension": "maintainability",
      "issue": "Magic number 3600 should be a named constant SESSION_TTL_SECONDS",
      "recommendation": "Extract to a named constant"
    }
  ],
  "summary": "1 critical security issue found. Must fix before merging."
}
```

Also display findings to the user in a readable format.

## Quality Criteria
- [ ] Every modified file reviewed (none skipped)
- [ ] Severity accurately reflects impact (don't over- or under-state)
- [ ] Recommendations are specific and actionable
- [ ] Security dimension always checked

## Error Handling
- If no changes found to review: ask user what to review (files? last commit? staged?)
- If a file is too large to review fully: review the changed sections and note which parts were skipped
- If uncertain about a finding: label it "suggestion" and explain the concern
