---
name: dev-agent-diagnose
description: |
  Investigates a bug, error, or unexpected behavior by reading logs, tracing
  execution paths, and identifying root cause. Produces a diagnosis JSON with
  root cause and fix recommendations for dev-agent-fix to act on.
  Use when: "why is this failing", "debug this", "エラーの原因を調べて",
  "バグを診断して", "what's causing this crash". Can also be used standalone.
---

# Bug Diagnoser

Investigate reported issues systematically to identify root cause before attempting fixes.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Receive error description, stack trace, or reproduction steps from the orchestrator.

### Standalone Mode
Accept error message, stack trace, logs, or behavior description from the user.

## Process

1. **Parse the symptom**: Extract from user input:
   - Error message / exception type
   - Stack trace (if available)
   - Affected behavior / reproduction steps
   - When it started happening (if known)

2. **Locate the failure point**: From the stack trace or error:
   - Identify the exact file and line throwing the error
   - Trace the call chain upward to find the real origin
   - Check for recent changes in git that may have introduced the issue

3. **Read relevant code**: Read the identified files to understand:
   - What the code is supposed to do
   - What it actually does
   - Where the contract is violated

4. **Check for common patterns**: See [diagnosis-patterns.md](references/diagnosis-patterns.md) for:
   - Null/undefined errors
   - Type mismatches
   - Off-by-one errors
   - Async/await misuse
   - State mutation bugs
   - Import/dependency issues

5. **Form hypothesis**: State the root cause clearly:
   - What assumption was violated
   - Which code path leads to the bug
   - Why the error occurs in this specific scenario

6. **Validate hypothesis**: Where possible, confirm by:
   - Tracing the data flow manually
   - Finding contradicting evidence
   - Identifying which tests would catch this

## Output Format

Write to `.agent/phase2/diagnose-output.json`:

```json
{
  "symptom": "TypeError: Cannot read property 'id' of undefined at src/auth.ts:42",
  "root_cause": "User object is null when session expires mid-request",
  "root_cause_file": "src/auth.ts",
  "root_cause_line": 42,
  "call_chain": ["src/routes/user.ts:88", "src/middleware/auth.ts:23", "src/auth.ts:42"],
  "hypothesis_confidence": "high",
  "fix_approach": "Add null check before accessing user.id; return 401 if null",
  "files_to_fix": ["src/auth.ts"],
  "related_files": ["src/middleware/auth.ts"],
  "regression_risk": "low"
}
```

Also display a human-readable diagnosis summary to the user.

## Quality Criteria
- [ ] Root cause identified (not just symptom described)
- [ ] Specific file and line number given
- [ ] Fix approach is concrete and actionable
- [ ] Confidence level stated honestly (high / medium / low)

## Error Handling
- If no stack trace available: ask user for logs or reproduction steps
- If root cause cannot be determined with confidence: report "low confidence" hypothesis and list what information would help
- If multiple possible root causes: list all with confidence levels
