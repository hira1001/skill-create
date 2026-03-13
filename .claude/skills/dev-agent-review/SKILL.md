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

## Critical Rules

1. **Review the diff, not the file**: Focus on changed lines and their immediate context (5 lines above/below). Do not report pre-existing issues unless they interact with the change.
2. **Evidence required**: Every finding must cite a specific file:line and quote the problematic code. Findings without evidence are invalid.
3. **No false positives**: If you are not confident a finding is real, downgrade to "suggestion". Only "critical" and "warning" block or flag — keep the signal-to-noise ratio high.
4. **Actionable recommendations**: Every finding must include a concrete fix suggestion. "Consider improving this" is not actionable. "Replace `db.query(sql)` with `db.query(sql, [params])` on line 34" is.
5. **Severity discipline**: Use the calibration table below. Do not inflate severity to seem thorough.

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
- Do types match (no unsafe casts, no `any` in TypeScript without justification)?

### 2. Security
- No injection vulnerabilities (SQL, command, XSS, path traversal)
- No hardcoded credentials or secrets
- Input validated at trust boundaries
- No sensitive data logged or exposed in error messages
- Authentication/authorization checks present where required

### 3. Performance
- No N+1 queries or O(n^2) loops in hot paths
- No blocking operations in async contexts
- No unnecessary re-renders or re-computations
- No unbounded data fetching (missing pagination/limits)

### 4. Maintainability
- Naming is clear and consistent with project conventions
- Functions are focused (single responsibility)
- No duplication that should be extracted
- No magic numbers or unclear constants

### 5. Test Coverage
- New code paths have corresponding tests
- Edge cases are tested
- Tests are isolated and deterministic

## Severity Calibration

| Severity | Criteria | Examples |
|----------|----------|---------|
| **critical** | Will cause a bug, security vulnerability, or data loss in production. Must fix before merge. | SQL injection, null pointer on common path, data corruption, auth bypass, race condition causing data loss |
| **warning** | Likely to cause issues but not immediately dangerous. Should fix. | Missing error handling on network call, unbounded query, magic numbers in business logic, missing test for error path |
| **suggestion** | Style improvement or minor optimization. Nice to have. | Better variable name, extract helper function, add code comment, use more idiomatic pattern |

**Severity rules**:
- If in doubt between critical and warning → warning
- If in doubt between warning and suggestion → suggestion
- A finding is critical ONLY if you can describe a specific scenario where it causes failure
- Performance issues are "warning" unless they cause timeouts or OOM in realistic usage
- Style issues are always "suggestion", never higher

## Process

1. **Read the diff**: Use git diff or read modified files directly. For each file, identify what changed.
2. **For each changed file**: Apply the 5 review dimensions to the changed code and its immediate context.
3. **Categorize findings** by severity using the calibration table above.
4. **Produce a verdict**: PASS (no critical, at most warnings), WARN (warnings present, no critical), FAIL (has criticals).

**Verdict rules**:
- PASS: 0 critical, 0-any warnings, 0-any suggestions
- WARN: 0 critical, 1+ warnings
- FAIL: 1+ critical findings

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
      "code": "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
      "issue": "User input interpolated directly into SQL query — SQL injection vulnerability",
      "recommendation": "Use parameterized query: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    },
    {
      "severity": "warning",
      "file": "src/auth.ts",
      "line": 12,
      "dimension": "maintainability",
      "code": "const timeout = 3600;",
      "issue": "Magic number 3600 — unclear what unit or purpose without context",
      "recommendation": "Extract to named constant: const SESSION_TTL_SECONDS = 3600;"
    }
  ],
  "summary": "1 critical security issue (SQL injection) must be fixed before merging. 1 warning about magic number."
}
```

Also display findings to the user in a readable format.

## Quality Criteria
- [ ] Every modified file reviewed (none skipped)
- [ ] Every finding cites specific file:line and includes the problematic code snippet in `code` field
- [ ] Severity matches calibration table (no inflation)
- [ ] Every recommendation is a concrete code change (not "consider" or "think about")
- [ ] Security dimension checked on every file that handles user input
- [ ] No pre-existing issues reported (only issues in changed code or directly interacting with changes)

## Error Handling
- If no changes found to review: ask user what to review (files? last commit? staged?)
- If a file is too large to review fully: review the changed sections and note which parts were skipped
- If uncertain about a finding: label it "suggestion" and explain the concern
- If the code quality is exceptional: still produce the output JSON with an empty findings array — do not skip writing the output
