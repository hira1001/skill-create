---
name: dev-agent-fix
description: |
  Applies targeted bug fixes based on a diagnosis or direct user description.
  Makes minimal changes to resolve the issue without introducing regressions.
  Produces a fix output JSON listing modified files for downstream validation.
  Use when: "fix this bug", "resolve this error", "バグを直して", "エラーを修正して",
  "patch this issue". Can also be used standalone.
---

# Bug Fixer

Apply targeted, minimal fixes to resolve bugs identified through diagnosis or user description.

## Critical Rules

1. **Root cause only**: Fix the root cause, not the symptom. If diagnosis says "null check missing at line 42", fix line 42 — do not add try/catch around the caller.
2. **Minimal diff**: Each fix should be the smallest change that resolves the issue. If you can fix it by changing 1 line, do not change 5. If you can fix it without adding a new file, do not create one.
3. **No drive-by changes**: Do NOT rename variables, reformat code, add comments, or refactor unrelated code in the same change. The diff must contain only bug-fix-related changes.
4. **Read before write**: Read every file you plan to modify in its entirety before making any edits. Never edit a file you haven't read in this session.
5. **Verify the fix mentally**: Before saving, trace the execution path with your fix applied to confirm it resolves the symptom described in the diagnosis.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read arch plan from `.agent/phase2/arch-output.json` (preferred — contains `fix_approach` informed by diagnosis).
Fall back to `.agent/phase2/diagnose-output.json` directly if arch output is absent.
Receive bug description from the orchestrator.

### Retry Mode (Validation)
If `.agent/phase4/validate-output-1.json` exists and contains `"all_passed": false`:
- Read `remediation_hints` array from it
- Address each hint in this execution
- Note in `change_summary` which hints were addressed with prefix `[RETRY: {hint}]`

### Retry Mode (Review)
If `.agent/phase5/review-output.json` exists with `"verdict": "FAIL"`:
- Read `findings` array filtered to `severity == "critical"`
- Address each critical finding in this execution
- Note in `change_summary` which findings were addressed with prefix `[REVIEW-FIX: {issue}]`

### Standalone Mode
Accept bug description, error message, or file+line from the user directly.

## Process

### Step 1: Load diagnosis
If `.agent/phase2/diagnose-output.json` exists, extract:
- `fix_approach` — the recommended fix strategy
- `files_to_fix` — the files that need changes
- `root_cause` and `root_cause_file`:`root_cause_line` — the exact defect location
- `evidence` — concrete observations to guide the fix

If no diagnosis exists, work from the user's description. Read the reported error location and form your own understanding before attempting a fix.

### Step 2: Read the broken code
Read each file in `files_to_fix` fully before making any changes. Also read:
- The test file for the broken module (if it exists)
- Type definitions referenced by the broken code

### Step 3: Apply the fix
Make the minimal change that resolves the root cause:
- Prefer fixing the root cause over patching the symptom
- Do not refactor unrelated code in the same change
- Preserve existing formatting and style
- If the fix is non-obvious, add a brief inline comment explaining **why** (not what)

**Fix selection heuristic** (pick the first that applies):
1. Missing check → add the check (null guard, bounds check, type check)
2. Wrong value → correct the value (off-by-one, wrong constant, wrong variable)
3. Missing call → add the call (missing await, missing initialization, missing cleanup)
4. Wrong order → reorder (initialization before use, lock before access)
5. Missing import/export → add it
6. If none apply → the fix may require a design change; report to user and suggest dev-agent-refactor

### Step 4: Check for related occurrences
Search for the same bug pattern in related files:

**Search strategy** (in order, stop after finding all occurrences):
1. Files that import the broken module: `grep -l "import.*from.*<module>" src/`
2. Sibling files in the same directory
3. Files listed in `related_files` from diagnosis
4. Shared utility files used by the broken module

Cap at 10 files total. If the same pattern exists elsewhere, fix all occurrences. If you fix multiple occurrences, list each in `change_summary`.

### Step 5: Add regression test
If there is an existing test file for the broken module:
- Add a test case that would have caught this bug (before the fix, this test would fail)
- Name the test descriptively: `test("should return 401 when session is expired", ...)`

If no test file exists:
- Create one with at least the regression test case
- Follow the project's test naming convention from context output

### Step 6: Verify fix logic
Before saving, mentally trace the execution path:
1. Start from the user-reported trigger condition
2. Follow the code path through the fixed code
3. Confirm the symptom no longer occurs
4. Confirm no new error is introduced on the happy path

If the trace reveals a secondary issue, fix it only if it's directly caused by the same root cause. Otherwise, note it in `verification_hint` for the user.

## Output Format

Write to `.agent/phase3/fix-output.json`:

```json
{
  "bug_summary": "User object is null when session expires mid-request",
  "files_modified": ["src/auth.ts"],
  "files_created": [],
  "change_summary": {
    "src/auth.ts": "Added null guard on line 42: return 401 if user is null after getSession()"
  },
  "regression_test_added": true,
  "test_file": "tests/auth.test.ts",
  "run_command": "npm test -- tests/auth.test.ts",
  "verification_hint": "Expired session requests should now return 401 instead of 500"
}
```

Also display a human-readable fix summary to the user.

## Quality Criteria
- [ ] Fix targets root cause, not just symptom (addresses the exact `root_cause_file`:`root_cause_line` from diagnosis)
- [ ] Change is minimal: diff contains only bug-fix-related lines
- [ ] Regression test added that would have caught the original bug
- [ ] Code style consistent with surrounding code (same indent, same naming, same patterns)
- [ ] Every file in `files_modified` was read before editing

## Error Handling
- If diagnosis output is missing and no arch plan exists: read the code around the reported error and reason through the fix independently
- If the fix requires changes to more than 5 files: report to the user that this may be a design issue and suggest using dev-agent-refactor instead
- If multiple files have the same bug: fix all occurrences in one pass and list each in `change_summary`
- If the fix would break a public API: warn the user explicitly before proceeding
