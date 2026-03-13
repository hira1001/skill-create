# Dev-Agent Phase Data Contract

## Directory Structure

```
.agent/
  phase1/
    context-output.json           ← dev-agent-context
  phase2/
    diagnose-output.json          ← dev-agent-diagnose (Flow B only)
    arch-output.json              ← dev-agent-arch (all flows except A, D, F)
  phase3/
    fix-output.json               ← dev-agent-fix       (Flow B)
    generate-output.json          ← dev-agent-generate  (Flow C)
    refactor-output.json          ← dev-agent-refactor  (Flow E)
  phase4/
    validate-output-1.json        ← dev-agent-validate (first attempt)
    validate-output-2.json        ← dev-agent-validate (retry attempt, if needed)
  phase5/
    review-output.json            ← dev-agent-review
    test-output.json              ← dev-agent-test (optional)
    docs-output.json              ← dev-agent-docs (optional)
  rollback-ref.txt                ← orchestrator (pre-Phase 3 safety point)
  summary.json                    ← dev-agent orchestrator
```

---

## Phase 1 — Context Output

**File**: `phase1/context-output.json`
**Written by**: `dev-agent-context`
**Read by**: all downstream phases

| Field | Type | Notes |
|-------|------|-------|
| `project_root` | string | Absolute path |
| `language` | string | Primary language |
| `framework` | string \| null | Primary framework |
| `build_tool` | string \| null | e.g. "npm", "cargo" |
| `test_framework` | string \| null | e.g. "jest", "pytest" |
| `lint_tool` | string \| null | e.g. "eslint", "ruff" |
| `formatter` | string \| null | e.g. "prettier", "black" |
| `entry_points` | string[] | Main entry files |
| `key_directories` | object | `{"src": "...", "tests": "..."}` |
| `conventions` | object | `{naming, import_style, patterns[]}` |
| `git_status` | object \| null | `{branch, has_uncommitted}` |
| `source_file_count` | number | Total source files |
| `monorepo` | object \| null | `{type, packages[], active_package}` if monorepo detected |

**Null handling**: If a field cannot be detected, set it to `null`.
Downstream skills must handle null gracefully (skip that check, default behavior, or ask user).

---

## Phase 2 — Diagnose Output (Flow B only)

**File**: `phase2/diagnose-output.json`
**Written by**: `dev-agent-diagnose`
**Read by**: `dev-agent-arch` (to inform the implementation plan)

| Field | Type | Notes |
|-------|------|-------|
| `symptom` | string | The error or behavior reported |
| `root_cause` | string | Identified root cause |
| `root_cause_file` | string \| null | File containing root cause |
| `root_cause_line` | number \| null | Line number |
| `call_chain` | string[] | `["file.ts:N", ...]` |
| `evidence` | string[] | Specific observations citing file:line that support the diagnosis |
| `hypothesis_confidence` | "high" \| "medium" \| "low" | See confidence calibration in dev-agent-diagnose |
| `fix_approach` | string | Recommended fix strategy |
| `files_to_fix` | string[] | Files that need changes |
| `related_files` | string[] | Files related to the bug but not the root cause (e.g., callers, test files) |
| `regression_risk` | "high" \| "medium" \| "low" | |
| `additional_causes` | object[] | Secondary root causes (same schema, minus this field) |

**Important**: dev-agent-arch in Flow B reads this file to produce an informed
implementation plan. The plan then goes to dev-agent-fix.

---

## Phase 2 — Architecture Output

**File**: `phase2/arch-output.json`
**Written by**: `dev-agent-arch`
**Read by**: `dev-agent-fix`, `dev-agent-generate`, `dev-agent-refactor`

### Plan mode (Flows B, C, E — most common)

| Field | Type | Notes |
|-------|------|-------|
| `mode` | `"plan"` | Discriminator field |
| `task_type` | "bug-fix" \| "new-feature" \| "refactor" | |
| `goal` | string | What should work when done |
| `files_to_modify` | `{path, reason, change_summary}[]` | |
| `files_to_create` | `{path, reason}[]` | |
| `files_to_avoid` | string[] | Risk of regression |
| `change_order` | string[] | Ordered list of paths |
| `risks` | string[] | Known risks |
| `unknowns` | string[] | Blocking unknowns |
| `approach_notes` | string | Implementation strategy |

### Analyze mode (Flow G only)

| Field | Type | Notes |
|-------|------|-------|
| `mode` | `"analyze"` | Discriminator field |
| `layers` | string[] | Architectural layers |
| `components` | `{name, files[], dependencies[]}[]` | |
| `metrics` | `{coupling, cohesion, complexity_hotspots[]}` | |
| `recommendations` | `{issue, suggestion}[]` | |

---

## Phase 3 — Execution Output

**Written by**: `dev-agent-fix`, `dev-agent-generate`, or `dev-agent-refactor`
**Read by**: `dev-agent-validate`, `dev-agent-review`, `dev-agent-test`, `dev-agent-docs`

**Required fields** (all Phase 3 outputs must have these):

| Field | Type | Notes |
|-------|------|-------|
| `files_modified` | string[] | Changed files |
| `files_created` | string[] | New files |
| `run_command` | string \| null | Specific test command, if known |
| `verification_hint` | string \| null | Human-readable check description |

---

## Phase 4 — Validate Output

**File**: `phase4/validate-output-{N}.json` (N = attempt number: 1, 2)
**Written by**: `dev-agent-validate`
**Read by**: orchestrator (for retry decision), Phase 3 skills (for retry mode)

| Field | Type | Notes |
|-------|------|-------|
| `attempt` | number | 1 = first run, 2 = retry |
| `checks` | `{check, passed, output}[]` | Each check result |
| `all_passed` | boolean | True if all checks passed |
| `failing_checks` | string[] | Names of failed checks |
| `remediation_hints` | string[] | Actionable fix instructions (each hint is a single sentence) |
| `auto_fixed_files` | string[] | Files modified by auto-fix (formatting, import sorting) |

**Check order**: Run compile → lint → test in order.
If compile fails, still run lint but skip test (can't test broken code).
If lint fails, still run test (lint issues don't block tests).

**Versioning**: Each validate run writes a new numbered file.
The orchestrator reads the latest file for the retry decision.

---

## Phase 5 — Outputs

### Review Output
**File**: `phase5/review-output.json`

| Field | Type | Notes |
|-------|------|-------|
| `verdict` | "PASS" \| "WARN" \| "FAIL" | Overall verdict |
| `files_reviewed` | string[] | |
| `findings` | `{severity, file, line?, dimension, code?, issue, recommendation}[]` | `code` field quotes the problematic snippet |
| `summary` | string | Human-readable summary |

### Test Output
**File**: `phase5/test-output.json`

| Field | Type | Notes |
|-------|------|-------|
| `files_tested` | string[] | Source files covered |
| `test_files_created` | string[] | |
| `test_files_modified` | string[] | |
| `test_cases_added` | number | |
| `run_command` | string | Command to run these tests |

### Docs Output
**File**: `phase5/docs-output.json`

| Field | Type | Notes |
|-------|------|-------|
| `files_documented` | string[] | Source files with new docstrings |
| `doc_files_modified` | string[] | README, CHANGELOG, etc. |
| `doc_files_created` | string[] | New doc files |
| `change_summary` | object | Per-file descriptions |

---

## Summary Output

**File**: `summary.json`
**Written by**: `dev-agent` orchestrator

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
  "review_retried": false,
  "overall_passed": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `flow` | string | Flow letter (A-G) |
| `task` | string | User's task description |
| `phases_run` | string[] | Phase names executed |
| `phase3_skill` | string \| null | Which Phase 3 skill ran |
| `files_modified` | string[] | All files changed |
| `files_created` | string[] | All files created |
| `validation_passed` | boolean | Final validate result |
| `validate_attempts` | number | 1 or 2 |
| `review_retried` | boolean | Whether review retry loop was used |
| `phase5` | object | `{review_verdict, test_passed, docs_updated}` |
| `overall_passed` | boolean | Final verdict |

`overall_passed` rules:
- `false` if `review_verdict == "FAIL"`
- `false` if `test_passed == false` (test ran but failed)
- `true` otherwise (docs failure does not block overall_passed)

---

## Missing File Behavior

| Missing File | Recovery |
|-------------|----------|
| `phase1/context-output.json` | Run dev-agent-context (max 1 auto-retry) |
| `phase2/arch-output.json` | Run dev-agent-arch (max 1 auto-retry) |
| `phase2/diagnose-output.json` | Run dev-agent-diagnose (max 1 auto-retry) |
| `phase3/*-output.json` | Cannot auto-recover. Report: "Phase 3 output missing. This means the code change skill (fix/generate/refactor) did not complete. Please (1) check for partially written files and undo them, (2) re-run the full flow, or (3) re-run from Phase 3 using: resume from phase 3." |
| `phase4/validate-output-1.json` | Report error and skip to Phase 5 with warning |

Auto-recovery is capped at **1 attempt per phase**. If the recovery run fails,
report the error and stop. Do not recurse.

---

## Output Validation Rules

Each phase output JSON must satisfy these rules before being consumed by the next phase:

| Phase Output | Required Fields | Type Checks |
|-------------|----------------|-------------|
| context-output.json | `project_root`, `language` | `project_root` is non-empty string, `language` is non-empty string |
| diagnose-output.json | `root_cause`, `fix_approach`, `files_to_fix` | `files_to_fix` is non-empty array |
| arch-output.json | `mode`, `goal` (plan) or `mode`, `layers` (analyze) | `mode` is "plan" or "analyze" |
| *-output.json (Phase 3) | `files_modified`, `files_created` | Both are arrays |
| validate-output-{N}.json | `all_passed`, `checks` | `all_passed` is boolean, `checks` is non-empty array |
| review-output.json | `verdict`, `findings` | `verdict` is one of "PASS", "WARN", "FAIL" |

If a consumed JSON is missing a required field, the consuming skill should report the error
and trigger the auto-recovery mechanism (re-run the producing skill once).
