---
name: dev-agent
description: |
  Autonomous development agent that orchestrates multi-phase workflows:
  context analysis, planning, code changes, validation, and review.
  Use when: "fix this bug", "implement this feature", "refactor this module",
  "add tests for", "review my code", "analyze architecture",
  "バグを直して", "機能を実装して", "リファクタリングして", "コードレビューして".
  Do NOT use when: user only wants an explanation or answer with no code changes.
---

# Development Agent Orchestrator

Execute end-to-end development tasks by routing to the correct flow and orchestrating
specialized sub-skills. See [phase-contract.md](references/phase-contract.md) for data contracts.

## Flow Routing

Classify the user's request and select the matching flow:

| Request Pattern | Flow |
|----------------|------|
| "review", "check my code", "PR review", "コードレビュー" | **A** (review only) |
| "fix bug", "エラーを直して", "not working", stack trace | **B** (diagnose → fix) |
| "implement", "add feature", "新機能", "作成して" | **C** (generate) |
| "add tests", "テストを書いて", "test coverage" | **D** (test only) |
| "refactor", "clean up", "リファクタリング", "simplify" | **E** (refactor) |
| "document", "add docs", "ドキュメント", "update README" | **F** (docs only) |
| "analyze architecture", "依存関係", "アーキテクチャ分析" | **G** (arch analyze) |

If ambiguous between flows, ask: "Should I fix the bug, review your code, or implement something new?"

## Flows

### Flow A — Code Review (no code changes)
```
1. dev-agent-context  → phase1/context-output.json
2. dev-agent-review   → phase5/review-output.json
```
Stop after review. Do NOT modify files.

### Flow B — Bug Fix
```
1. dev-agent-context   → phase1/context-output.json
2. dev-agent-diagnose  → phase2/diagnose-output.json
3. dev-agent-arch      → phase2/arch-output.json  (informed by diagnose output)
4. dev-agent-fix       → phase3/fix-output.json
5. dev-agent-validate  → phase4/validate-output-1.json
   [retry if fails: re-run fix → phase4/validate-output-2.json]
6. dev-agent-review    → phase5/review-output.json
```

### Flow C — Code Generation
```
1. dev-agent-context   → phase1/context-output.json
2. dev-agent-arch      → phase2/arch-output.json
3. dev-agent-generate  → phase3/generate-output.json
4. dev-agent-validate  → phase4/validate-output-1.json
   [retry if fails: re-run generate → phase4/validate-output-2.json]
5. dev-agent-test      → phase5/test-output.json
6. dev-agent-docs      → phase5/docs-output.json  (if public API added)
7. dev-agent-review    → phase5/review-output.json
```

### Flow D — Test Generation
```
1. dev-agent-context  → phase1/context-output.json
2. dev-agent-test     → phase5/test-output.json
3. dev-agent-validate → phase4/validate-output-1.json
```

### Flow E — Refactoring
```
1. dev-agent-context   → phase1/context-output.json
2. dev-agent-arch      → phase2/arch-output.json
3. dev-agent-refactor  → phase3/refactor-output.json
4. dev-agent-validate  → phase4/validate-output-1.json
   [retry if fails: re-run refactor → phase4/validate-output-2.json]
5. dev-agent-review    → phase5/review-output.json
```

### Flow F — Documentation
```
1. dev-agent-context → phase1/context-output.json
2. dev-agent-docs    → phase5/docs-output.json
```

### Flow G — Architecture Analysis (no code changes)
```
1. dev-agent-context → phase1/context-output.json
2. dev-agent-arch    → phase2/arch-output.json  (analyze mode)
```
Pass `mode: "analyze"` to dev-agent-arch. Stop after analysis. Do NOT modify files.

## Process

### Step 1: Initialize workspace
Create `.agent/phase1/ phase2/ phase3/ phase4/ phase5/` directories.
Read user's request and apply Flow Routing table to select flow.

### Step 2: Run each flow phase in sequence
For each phase in the selected flow, invoke the corresponding sub-skill.
Pass the user's task description to each skill invocation.

**Auto-recovery** (max 1 attempt per phase):
- If a required input file is missing when a phase starts, run its producing skill automatically.
- If the automatic run also fails, report the error and stop. Do NOT recurse further.
- Report: "Required skill `dev-agent-X` failed. Please check [reason] and retry."

### Step 3: Validation retry (for flows with validate)
On first validation failure:
1. Read `remediation_hints` from `phase4/validate-output-1.json`
2. Re-run the Phase 3 skill (it will auto-read the hints from that file)
3. Re-run dev-agent-validate → writes `phase4/validate-output-2.json`
4. If still failing: report hints to user and stop. Do NOT retry a third time.

### Step 4: Phase 5 synthesis
After all Phase 5 skills complete, synthesize verdicts:
- `review_verdict`: from `phase5/review-output.json`.`verdict` (PASS/WARN/FAIL)
- `test_passed`: `true` if dev-agent-test ran and wrote `phase5/test-output.json`; `null` if skipped
- `docs_updated`: `true` if dev-agent-docs ran and wrote `phase5/docs-output.json`; `null` if skipped
- `overall_passed`: `false` if review_verdict == FAIL OR test_passed == false; otherwise `true`

### Step 5: Write summary and report to user

```json
{
  "flow": "B",
  "task": "fix authentication timeout bug",
  "phases_run": ["context", "diagnose", "arch", "fix", "validate", "review"],
  "phase3_skill": "dev-agent-fix",
  "files_modified": ["src/auth.ts"],
  "files_created": [],
  "validation_passed": true,
  "validate_attempts": 1,
  "phase5": {
    "review_verdict": "PASS",
    "test_passed": null,
    "docs_updated": null
  },
  "overall_passed": true
}
```

Print a concise summary:
```
✅ Flow B: Bug Fix
✅ Context: TypeScript/Express (42 files)
✅ Diagnose: null-user crash on session expiry
✅ Plan: 1 file to modify (src/auth.ts)
✅ Fix: applied null guard on line 42
✅ Validate: compile ✓, lint ✓, tests 12/12 ✓
✅ Review: PASS
Overall: PASSED
```

## Selective Execution

Users can scope to specific phases:
- "just analyze the project" → Phase 1 only (run dev-agent-context)
- "just diagnose this error" → dev-agent-diagnose standalone
- "review my changes" → Flow A
- "analyze my architecture" → Flow G

When a user requests a specific phase and predecessors haven't run yet:
- Run only the requested phase in standalone mode (it will auto-detect context)
- Do NOT run the full flow unless the user asks for it

## Error Handling
- If any phase fails and auto-recovery also fails: report error + stop
- If validate fails after 2 attempts: list unresolved hints and ask user how to proceed
- If context detection fails: ask user to specify `project_root`
- If flow is ambiguous: ask one clarifying question before starting
