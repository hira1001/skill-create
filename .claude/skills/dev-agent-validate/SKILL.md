---
name: dev-agent-validate
description: |
  Validates generated or modified code by running compile, lint, and test checks.
  Produces a structured validation report consumed by the dev-agent orchestrator.
  Use when: "validate code", "check if it compiles", "run checks", "コード検証",
  "lint and test", "ビルド確認". Can also be used standalone.
---

# Output Validator

Run objective quality checks (compile, lint, test) on generated or modified code.

## Critical Rules

1. **Run real commands**: Execute actual build/lint/test commands. Never simulate results or assume pass/fail without running the command.
2. **Capture exact output**: Record stdout/stderr verbatim (truncated to 500 lines if excessive). The output is used for remediation — accuracy matters.
3. **Honest reporting**: If a check fails, report it as failed. Never mark a failing check as passed. Never omit a failing check.
4. **Actionable hints**: Every failed check must produce at least one `remediation_hint` that describes what to fix and where.
5. **Timeout awareness**: If a command hangs for more than 120 seconds, kill it and report `{"check": "<name>", "passed": false, "output": "Command timed out after 120s"}`.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read upstream output (fix, generate, refactor, or test) from the latest `.agent/phase*/` output JSON to identify which files were modified.

### Standalone Mode
If no suite context, detect the project tooling directly and validate the entire project or specified files.

## Process

### Step 1: Load project context
Read `.agent/phase1/context-output.json` for `build_tool`, `test_framework`, `lint_tool`, `formatter`.

### Step 2: Identify targets
Read the upstream output JSON to find `files_modified` and `files_created`.

### Step 3: Run checks in order
See [check-registry.md](references/check-registry.md) for language-specific commands.

**Check 1: Compile/Build**
- Run the language-appropriate build command
- Capture stdout/stderr and exit code
- If exit code != 0: `passed: false`

**Check 2: Lint**
- Run the project's linter on modified files only (if possible)
- Capture warnings and errors
- **Auto-fix**: If lint or format fails with auto-fixable issues (formatting, import sorting, unused imports), run the auto-fix command (see [check-registry.md](references/check-registry.md) Auto-Fix Policy). Re-run the check to confirm. Track auto-fixed files in `auto_fixed_files`.
- After auto-fix: if the re-run still fails, report the remaining issues as `passed: false`

**Check 3: Test**
- If Check 1 (compile) failed: **skip** this check. Record `{"check": "test", "passed": null, "output": "Skipped: compile failed"}`.
- Otherwise: run the test suite (or targeted tests if upstream provides `run_command`)
- Parse pass/fail count from output when possible
- **Flaky test detection**: If a test fails, check if it's in `files_modified`. If not, it may be a pre-existing flaky test. Note this in the output: "Test failure may be pre-existing (file not modified in this change)".

### Step 4: Produce report with pass/fail for each check

**Remediation hint quality**: Each hint must be a single sentence that answers: "What file, what line (if known), and what action to take?"
- Good: "Fix type error in src/auth.ts:42 — argument type 'string' is not assignable to 'number'"
- Bad: "Fix compilation errors"

## Output Format

Write to `.agent/phase4/validate-output-{N}.json` where N is the attempt number (1 for first run, 2 for retry):

```json
{
  "attempt": 1,
  "checks": [
    {"check": "compile", "passed": true, "output": ""},
    {"check": "lint", "passed": false, "output": "src/auth.ts:42 - no-unused-vars: 'oldToken' is defined but never used"},
    {"check": "test", "passed": true, "output": "12 tests passed, 0 failed"}
  ],
  "all_passed": false,
  "failing_checks": ["lint"],
  "remediation_hints": ["Remove unused variable 'oldToken' on src/auth.ts:42 or prefix with underscore"],
  "auto_fixed_files": []
}
```

Also display a summary to the user.

## Quality Criteria
- [ ] All available checks executed (don't skip if tool exists)
- [ ] Output accurately reflects actual command results (no simulated results)
- [ ] Remediation hints are specific: cite file, line, and action
- [ ] Partial results reported (don't fail silently if one check errors)
- [ ] Command timeouts handled (120s limit per command)

## Error Handling
- If a check tool is not installed: skip that check, note in output as `{"check": "lint", "passed": null, "output": "eslint not found — install with npm install -D eslint"}`
- If project context is missing: detect tooling directly from project root
- If no files_modified info available: run checks on entire project
- If a command times out: kill it and report timeout in output
