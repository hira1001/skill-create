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

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read upstream output (fix, generate, refactor, or test) from the latest `.agent/phase*/` output JSON to identify which files were modified.

### Standalone Mode
If no suite context, detect the project tooling directly and validate the entire project or specified files.

## Process

1. **Load project context**: Read `.agent/phase1/context-output.json` for build_tool, test_framework, lint_tool.

2. **Identify targets**: Read the upstream output JSON to find `files_modified` and `files_created`.

3. **Run checks** in order. See [check-registry.md](references/check-registry.md) for language-specific commands.

   **Check 1: Compile/Build**
   - Run the language-appropriate build command
   - Capture stdout/stderr and exit code

   **Check 2: Lint**
   - Run the project's linter on modified files only (if possible)
   - Capture warnings and errors

   **Check 3: Test**
   - Run the test suite (or targeted tests if upstream provides `run_command` or `verification_hint`)
   - Capture pass/fail count and output

4. **Produce report** with pass/fail for each check.

## Output Format

Write to `.agent/phase4/validate-output.json` (phase number matches the flow):

```json
{
  "checks": [
    {"check": "compile", "passed": true, "output": ""},
    {"check": "lint", "passed": false, "output": "src/auth.ts:42 - no-unused-vars"},
    {"check": "test", "passed": true, "output": "12 tests passed, 0 failed"}
  ],
  "all_passed": false,
  "failing_checks": ["lint"],
  "remediation_hints": ["Run eslint --fix on src/auth.ts"]
}
```

Also display a summary to the user.

## Quality Criteria
- [ ] All available checks executed (don't skip if tool exists)
- [ ] Output accurately reflects actual command results
- [ ] Remediation hints are actionable and specific
- [ ] Partial results reported (don't fail silently if one check errors)

## Error Handling
- If a check tool is not installed: skip that check, note in output as `{"check": "lint", "passed": null, "output": "eslint not found"}`
- If project context is missing: detect tooling directly from project root
- If no files_modified info available: run checks on entire project
