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

### Compound Requests

If the user's request maps to multiple flows (e.g., "fix this bug then refactor the module" = Flow B + Flow E):
1. Identify the component flows in execution order (fix before refactor, generate before test, etc.).
2. Run the first flow completely (through validation and review).
3. If it passes, run the second flow. The second flow reuses `phase1/context-output.json` but gets fresh Phase 2/3/4/5 outputs.
4. Report a combined summary covering both flows.

Maximum 2 flows per compound request. If more, ask user to split into separate requests.

Compound flow pairs and their order: B+E (fix then refactor), C+D (generate then test), B+D (fix then add tests).

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
4. dev-agent-test      → phase5/test-output.json
5. dev-agent-validate  → phase4/validate-output-1.json
   [retry if fails: re-run generate → phase4/validate-output-2.json]
6. dev-agent-docs      → phase5/docs-output.json  (see Docs Trigger Rules below)
7. dev-agent-review    → phase5/review-output.json
```
Tests are generated before validation so that the validate phase can run them.

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

### Docs Trigger Rules (Flow C)

Run `dev-agent-docs` in Flow C if ANY of these are true:
1. `files_created` in Phase 3 output contains files in directories matching `routes/`, `api/`, `handlers/`, `controllers/`, or `endpoints/`.
2. `files_created` contains files with `export` of classes or functions that are imported by entry points.
3. The user's request explicitly mentions "public", "API", "endpoint", or "interface".
4. A new module or package is created (new directory with index/init file).

If none apply, skip docs. Note the skip reason in the summary.

## Process

### Sub-Skill Invocation Method

To invoke a sub-skill, use the **Skill tool** with the skill name:
- Example: `Skill("dev-agent-context")`, `Skill("dev-agent-fix", args: "<task description>")`.
- Each sub-skill reads its input from `.agent/` JSON files and writes its output there. You do not need to pass JSON data through the Skill tool arguments.
- Wait for each Skill tool call to complete before proceeding to the next phase (unless running parallel phases as described below).

### Rollback Strategy

Before running any Phase 3 skill (fix/generate/refactor), create a git safety point:
1. If there are uncommitted changes: run `git stash push -m "dev-agent-pre-phase3"`.
2. If working tree is clean: record the current commit hash in `.agent/rollback-ref.txt`.

If validation fails after 2 attempts OR the user requests rollback:
1. If stash was used: `git stash pop` to restore original state.
2. If commit ref was recorded: `git checkout <ref> -- .` to restore files.

Report: "Changes rolled back to pre-execution state."
Note: This is best-effort. Warn the user before rollback that it will undo all Phase 3 changes.

### Step 1: Initialize workspace

Before creating directories, check if `.agent/` already exists from a previous run:
- If it exists: delete all JSON files inside `.agent/phase*/` subdirectories (`rm .agent/phase*/*.json` but preserve the directories).
- Preserve `.agent/rollback-ref.txt` only if the user is explicitly resuming (see Resume from Phase section).
- Then create the directory structure.

Create `.agent/phase1/ phase2/ phase3/ phase4/ phase5/` directories.
Read user's request and apply Flow Routing table to select flow.

### Step 2: Run each flow phase in sequence

Before invoking each phase, print a progress line to the user:
```
[Phase N/Total] Running dev-agent-X...
```
After each phase completes, print a one-line result:
```
[Phase N/Total] dev-agent-X: done (e.g., "3 files identified", "PASS", etc.)
```

For each phase in the selected flow, invoke the corresponding sub-skill.
Pass the user's task description to each skill invocation.

**Auto-recovery** (max 1 attempt per phase):
- If a required input file is missing when a phase starts, run its producing skill automatically.
- If the automatic run also fails, report the error and stop. Do NOT recurse further.
- Report: "Required skill `dev-agent-X` failed. Please check [reason] and retry."

### Parallel Phase Execution

In Phase 5, the skills `dev-agent-review`, `dev-agent-test`, and `dev-agent-docs` have no data dependencies on each other. They all read from Phase 3 output. Invoke them in parallel using multiple Skill tool calls in a single response:
```
# In a single response, invoke all applicable Phase 5 skills:
Skill("dev-agent-review", args: "<task>")
Skill("dev-agent-test", args: "<task>")    # if test is in this flow
Skill("dev-agent-docs", args: "<task>")    # if docs trigger met
```
Wait for all parallel calls to complete before proceeding to Step 4 (synthesis).

**Note**: In Flow C, `dev-agent-test` runs at step 4 (before validate), so it is NOT parallelized with review/docs. Only skills that appear at the same phase number can run in parallel.

### Step 3: Validation retry (for flows with validate)
On first validation failure:
1. Read `remediation_hints` from `phase4/validate-output-1.json`
2. Re-run the Phase 3 skill (it will auto-read the hints from that file)
3. Re-run dev-agent-validate → writes `phase4/validate-output-2.json`
4. If still failing: report hints to user and stop. Do NOT retry a third time.

### Review Retry (Optional)

If `review_verdict == "FAIL"` and the flow includes a Phase 3 skill (fix/generate/refactor):
1. Extract `critical` findings from `phase5/review-output.json`.
2. Re-invoke the Phase 3 skill with the findings as remediation context. The Phase 3 skill should address each critical finding.
3. Re-run `dev-agent-validate` (writes `phase4/validate-output-2.json` or increments).
4. Re-run `dev-agent-review` (overwrites `phase5/review-output.json`).
5. If still FAIL after 1 retry: report findings to user and stop. Do NOT retry again.

This loop is capped at **1 iteration**. Set `review_retried: true` in summary.json when used.

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

### Resume from Phase

If the user says "resume from phase N" or "continue from validate":
1. Check `.agent/` for existing output files from phases 1 through N-1.
2. If all required predecessor outputs exist, start from phase N using the existing files.
3. If a required file is missing, report which file is missing and offer to re-run that phase.

Do NOT clean up `.agent/` when resuming (skip the cleanup step).
This is useful after a failed validation where the user made manual fixes.

## Error Handling
- If any phase fails and auto-recovery also fails: report error + stop
- If validate fails after 2 attempts: list unresolved hints and ask user how to proceed
- If context detection fails: ask user to specify `project_root`
- If flow is ambiguous: ask one clarifying question before starting
