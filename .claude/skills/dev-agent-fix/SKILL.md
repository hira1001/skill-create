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

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read arch plan from `.agent/phase2/arch-output.json` (preferred — contains `fix_approach` informed by diagnosis).
Fall back to `.agent/phase2/diagnose-output.json` directly if arch output is absent.
Receive bug description from the orchestrator.

### Retry Mode
If `.agent/phase4/validate-output-1.json` exists and contains `"all_passed": false`:
- Read `remediation_hints` array from it
- Address each hint in this execution
- Note in `change_summary` which hints were addressed with prefix `[RETRY: {hint}]`

### Standalone Mode
Accept bug description, error message, or file+line from the user directly.

## Process

1. **Load diagnosis**: If `.agent/phase2/diagnose-output.json` exists, read the `fix_approach`, `files_to_fix`, and `root_cause`. Otherwise work from the user's description.

2. **Read the broken code**: Read each file listed in `files_to_fix` fully before making any changes.

3. **Apply the fix**: Make the minimal change that resolves the root cause:
   - Prefer fixing the root cause over patching the symptom
   - Do not refactor unrelated code in the same change
   - Preserve existing formatting and style
   - If the fix is non-obvious, add a brief inline comment explaining why

4. **Check for related occurrences**: Search for the same pattern in the 10 most related files (imports, siblings, shared utilities) — the same bug may exist in multiple places. Stop after 10 files.

5. **Update tests if needed**: If there is an existing test that should have caught this bug but didn't:
   - Fix the test to actually cover the bug case
   - Or add a regression test

6. **Verify fix logic**: Before saving, mentally trace the execution path with the fix applied to confirm it resolves the issue.

## Output Format

Write to `.agent/phase3/fix-output.json`:

```json
{
  "bug_summary": "User object is null when session expires mid-request",
  "files_modified": ["src/auth.ts"],
  "files_created": [],
  "change_summary": {
    "src/auth.ts": "Added null guard on line 42: return 401 if user is null"
  },
  "regression_test_added": true,
  "test_file": "tests/auth.test.ts",
  "run_command": "npm test -- tests/auth.test.ts",
  "verification_hint": "Expired session requests should now return 401 instead of 500"
}
```

Also display a human-readable fix summary to the user.

## Quality Criteria
- [ ] Fix targets root cause, not just symptom
- [ ] Change is minimal (no unrelated modifications)
- [ ] Regression test added or existing test updated
- [ ] Code style consistent with surrounding code

## Error Handling
- If diagnosis output is missing: read the code around the reported error and reason through the fix
- If the fix requires a larger refactor: report this to the user and switch to dev-agent-refactor
- If multiple files have the same bug: fix all occurrences in one pass
