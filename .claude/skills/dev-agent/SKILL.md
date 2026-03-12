---
name: dev-agent
description: |
  Autonomous development agent that orchestrates multi-phase workflows:
  context analysis, architecture planning, code changes, validation, and review.
  Use when: "fix this bug", "implement this feature", "refactor this module",
  "add tests for", "バグを直して", "機能を実装して", "リファクタリングして".
  Composes dev-agent-* sub-skills into a coherent end-to-end workflow.
  Do NOT use when: user only wants an explanation, code review without changes,
  or asking a question (no code modification required).
---

# Development Agent Orchestrator

Execute end-to-end development tasks by orchestrating specialized sub-skills across phases.

## Workflow Phases

```
Phase 1: Context    → dev-agent-context    → .agent/phase1/context-output.json
Phase 2: Plan       → dev-agent-arch       → .agent/phase2/arch-output.json
Phase 3: Execute    → dev-agent-fix        → .agent/phase3/fix-output.json
         (or)       → dev-agent-generate   → .agent/phase3/generate-output.json
         (or)       → dev-agent-refactor   → .agent/phase3/refactor-output.json
Phase 4: Validate   → dev-agent-validate   → .agent/phase4/validate-output.json
Phase 5: Review     → dev-agent-review     → .agent/phase5/review-output.json
         (opt)      → dev-agent-test       → .agent/phase5/test-output.json
         (opt)      → dev-agent-docs       → .agent/phase5/docs-output.json
```

## Task Classification

Determine which Phase 3 skill to invoke:

| User Request Pattern | Phase 3 Skill |
|----------------------|---------------|
| "fix bug", "エラーを直して", "not working" | `dev-agent-fix` |
| "add feature", "implement", "新機能", "作成して" | `dev-agent-generate` |
| "refactor", "clean up", "リファクタリング", "improve code" | `dev-agent-refactor` |
| "add tests", "テストを書いて", "test coverage" | Skip to `dev-agent-test` |
| "document", "ドキュメント", "add docs" | Skip to `dev-agent-docs` |

## Process

### Step 1: Initialize workspace
Create `.agent/` directory structure:
```
.agent/
  phase1/  phase2/  phase3/  phase4/  phase5/
```

### Step 2: Run Phase 1 — Context
Invoke `dev-agent-context` skill.
- Output: `.agent/phase1/context-output.json`

### Step 3: Run Phase 2 — Architecture Plan
Invoke `dev-agent-arch` skill with the user's task description.
- Input: context JSON + task description
- Output: `.agent/phase2/arch-output.json`

### Step 4: Run Phase 3 — Execute
Based on task classification, invoke the appropriate execution skill.
- Input: context JSON + arch plan JSON + task description
- Output: `.agent/phase3/*-output.json`

### Step 5: Run Phase 4 — Validate
Invoke `dev-agent-validate` skill.
- Input: context JSON + phase 3 output JSON
- Output: `.agent/phase4/validate-output.json`

If validation fails:
- Read `remediation_hints` from validate output
- Re-invoke the Phase 3 skill with hints (max 2 retry attempts)
- Re-validate after each fix attempt

### Step 6: Run Phase 5 — Review & Finalize
Invoke `dev-agent-review` to assess overall quality.
- Optionally invoke `dev-agent-test` if test coverage gaps were identified
- Optionally invoke `dev-agent-docs` if public API was added or changed

### Step 7: Report summary to user

```
✅ Phase 1: Context analyzed (TypeScript/Express, 42 files)
✅ Phase 2: Architecture planned (3 files to modify)
✅ Phase 3: Changes applied (src/auth.ts, src/routes/user.ts)
✅ Phase 4: Validated (compile ✓, lint ✓, tests 12/12 ✓)
✅ Phase 5: Review passed (no issues)
```

## Selective Execution

Users can request specific phases:
- "just analyze the project" → Phase 1 only
- "fix and validate" → Phase 1 + Phase 3 (fix) + Phase 4
- "review my changes" → Phase 4 + Phase 5 only

## Output

Final summary written to `.agent/summary.json`:

```json
{
  "task": "fix authentication timeout bug",
  "phases_run": ["context", "arch", "fix", "validate", "review"],
  "files_modified": ["src/auth.ts"],
  "files_created": [],
  "validation_passed": true,
  "review_passed": true,
  "retry_count": 0
}
```

## Auto-Recovery

If a required phase output file is missing when a downstream phase starts:
- Missing `phase1/context-output.json`: run `dev-agent-context` automatically
- Missing `phase2/arch-output.json`: run `dev-agent-arch` automatically
- Any sub-skill not available: report "Required skill `dev-agent-X` is not installed. Run `/skill-create` to install it."

See [phase-contract.md](references/phase-contract.md) for the full data contract between phases.

## Error Handling
- If any phase fails fatally: report the error and stop; don't proceed to next phases
- If validate fails after 2 retries: report the remaining issues and ask user how to proceed
- If context detection fails: ask user to specify project root manually

## Quick Start Example

User: "Fix the authentication timeout bug in src/auth.ts"

```
✅ Phase 1: Context → TypeScript/Express project detected (42 files)
✅ Phase 2: Plan   → 1 file to modify: src/auth.ts (add null guard on line 42)
✅ Phase 3: Fix    → Applied: return 401 if user is null; added regression test
✅ Phase 4: Validate → compile ✓, lint ✓, tests 12/12 passed
✅ Phase 5: Review → PASS (no critical issues)
Summary: Fixed null-user crash on session expiry. 1 file modified.
```
