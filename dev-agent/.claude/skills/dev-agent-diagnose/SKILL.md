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

## Critical Rules

1. **Diagnose, do NOT fix**: This skill identifies the problem. It never modifies application code.
2. **Evidence over intuition**: Every claim must cite a file:line or log entry. Never state a root cause without pointing to the exact code.
3. **One root cause per diagnosis**: If multiple causes exist, produce one diagnosis per cause in `additional_causes[]`.
4. **Bounded investigation**: Read at most 20 files. If root cause is not found within 20 files, report "low" confidence and list what additional information would help.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Receive error description, stack trace, or reproduction steps from the orchestrator.

### Standalone Mode
Accept error message, stack trace, logs, or behavior description from the user.

## Process

### Step 1: Parse the symptom
Extract from user input:
- Error message / exception type (exact text, not paraphrased)
- Stack trace (if available) — note the top 3 frames
- Affected behavior / reproduction steps
- When it started happening (if known — check `git log --oneline -20` for recent changes)

If the user provides only a vague description ("it doesn't work"), ask for:
1. What they expected to happen
2. What actually happened
3. Any error messages or logs

Do NOT proceed without at least one concrete signal (error message, wrong output, or specific failing behavior).

### Step 2: Locate the failure point
From the stack trace or error:
- Identify the exact file and line throwing the error
- Trace the call chain upward (callee → caller) to find the real origin
- Check `git log --oneline --since="1 week ago" -- <file>` for recent changes that may have introduced the issue
- If no stack trace: search codebase for the error message text using grep

### Step 3: Read relevant code
Read the identified files to understand:
- What the code is supposed to do (read function name, docstring, tests)
- What it actually does (trace the logic line by line)
- Where the contract is violated (expected type vs actual, expected state vs actual)

**Reading strategy**: Start with the crash file, then read its direct imports, then callers. Stop when you find the mismatch between expected and actual behavior.

### Step 4: Check for common patterns
See [diagnosis-patterns.md](references/diagnosis-patterns.md) for specific search strategies:
- Null/undefined access → search for optional chaining absence
- Type mismatches → search for type assertions or `any` casts
- Off-by-one → check loop bounds and array indexing
- Async/await misuse → search for missing `await` on async calls
- State mutation → search for shared mutable references
- Import/dependency issues → check for circular imports or version mismatches

### Step 5: Form hypothesis
State the root cause with this structure:
- **What**: The specific code defect (e.g., "missing null check on line 42")
- **Where**: File path and line number
- **Why**: The assumption that was violated (e.g., "assumes user is always non-null, but session expiry sets it to null")
- **When**: The condition that triggers the bug (e.g., "when a request arrives after session TTL expires")

### Step 6: Validate hypothesis
Confirm by at least one of:
- Tracing the data flow manually through the code path that triggers the bug
- Finding a test that should catch this but doesn't (or is missing)
- Identifying contradicting evidence (if found, revise hypothesis)
- Checking if the same pattern exists elsewhere (indicates systematic issue)

### Confidence Calibration

| Confidence | Criteria (ALL must be met) |
|-----------|---------------------------|
| **high** | Exact file:line identified AND code path traced AND hypothesis explains all symptoms |
| **medium** | File identified but exact line uncertain, OR hypothesis explains most but not all symptoms |
| **low** | Multiple possible causes OR cannot trace full code path OR key files are unreadable |

## Output Format

Write to `.agent/phase2/diagnose-output.json`:

```json
{
  "symptom": "TypeError: Cannot read property 'id' of undefined at src/auth.ts:42",
  "root_cause": "User object is null when session expires mid-request because getSession() returns null after TTL but callers assume non-null",
  "root_cause_file": "src/auth.ts",
  "root_cause_line": 42,
  "call_chain": ["src/routes/user.ts:88", "src/middleware/auth.ts:23", "src/auth.ts:42"],
  "evidence": [
    "src/auth.ts:42 accesses user.id without null check",
    "src/auth.ts:30 getSession() returns null when Date.now() > session.expiry",
    "No test covers the expired-session path"
  ],
  "hypothesis_confidence": "high",
  "fix_approach": "Add null check before accessing user.id; return 401 if null",
  "files_to_fix": ["src/auth.ts"],
  "related_files": ["src/middleware/auth.ts", "tests/auth.test.ts"],
  "regression_risk": "low",
  "additional_causes": []
}
```

Field notes:
- `evidence`: Array of specific observations supporting the diagnosis. Each entry cites a file:line or concrete fact.
- `related_files`: Files related to the bug but not the root cause (callers, test files, configuration files that influence behavior). Helps downstream skills understand the impact scope.
- `additional_causes`: If multiple independent root causes are found, list secondary causes here with the same schema as the top-level fields (minus `additional_causes` itself).

Also display a human-readable diagnosis summary to the user.

## Quality Criteria
- [ ] Root cause identified with exact file:line (not just symptom described)
- [ ] `evidence` array contains at least 2 concrete observations citing file:line
- [ ] Fix approach is a specific action (not "investigate further" or "check the code")
- [ ] Confidence level matches calibration table above
- [ ] Call chain traces from user-visible symptom to root cause code

## Error Handling
- If no stack trace available: ask user for logs or reproduction steps before proceeding
- If root cause cannot be determined with confidence: report "low" confidence, provide best hypothesis, and list exactly what information would raise confidence
- If multiple possible root causes: rank by likelihood, report the most likely as primary, others in `additional_causes`
- If the bug appears to be in a dependency (not project code): identify the dependency, version, and known issue if searchable
