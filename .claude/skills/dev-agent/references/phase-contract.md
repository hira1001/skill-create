# Dev-Agent Phase Data Contract

## Overview

Each phase reads from the previous phase's output JSON. All files live under `.agent/` in the project root.

```
.agent/
  phase1/context-output.json     ← written by dev-agent-context
  phase2/arch-output.json        ← written by dev-agent-arch
  phase2/diagnose-output.json    ← written by dev-agent-diagnose (optional)
  phase3/generate-output.json    ← written by dev-agent-generate  } one of these
  phase3/fix-output.json         ← written by dev-agent-fix        }
  phase3/refactor-output.json    ← written by dev-agent-refactor   }
  phase4/validate-output.json    ← written by dev-agent-validate
  phase5/review-output.json      ← written by dev-agent-review
  phase5/test-output.json        ← written by dev-agent-test (optional)
  phase5/docs-output.json        ← written by dev-agent-docs (optional)
  summary.json                   ← written by dev-agent orchestrator
```

---

## Phase 1 Output: context-output.json

**Required fields** (downstream consumers depend on these):

| Field | Type | Used by |
|-------|------|---------|
| `project_root` | string (absolute path) | all phases |
| `language` | string | phase 3, phase 4 |
| `framework` | string \| null | phase 3 |
| `build_tool` | string \| null | phase 4 |
| `test_framework` | string \| null | phase 4, phase 5 |
| `lint_tool` | string \| null | phase 4 |
| `conventions.naming` | string | phase 3 |
| `conventions.import_style` | string | phase 3 |

---

## Phase 2 Output: arch-output.json

**Required fields**:

| Field | Type | Used by |
|-------|------|---------|
| `task_type` | "bug-fix" \| "new-feature" \| "refactor" | orchestrator routing |
| `files_to_modify` | array of `{path, reason, change_summary}` | phase 3 |
| `files_to_create` | array of `{path, reason}` | phase 3 |
| `change_order` | array of paths | phase 3 |
| `approach_notes` | string | phase 3 |

---

## Phase 3 Output: *-output.json

**Required fields** (for all phase 3 skills):

| Field | Type | Used by |
|-------|------|---------|
| `files_modified` | array of paths | phase 4, phase 5 |
| `files_created` | array of paths | phase 4, phase 5 |
| `run_command` | string \| null | phase 4 |
| `verification_hint` | string \| null | phase 4 |

---

## Phase 4 Output: validate-output.json

**Required fields**:

| Field | Type | Used by |
|-------|------|---------|
| `all_passed` | boolean | orchestrator decision |
| `failing_checks` | array of strings | orchestrator retry logic |
| `remediation_hints` | array of strings | orchestrator retry → phase 3 |

---

## Phase 5 Output: review-output.json

**Required fields**:

| Field | Type | Used by |
|-------|------|---------|
| `verdict` | "PASS" \| "WARN" \| "FAIL" | orchestrator decision |
| `findings` | array of `{severity, file, issue, recommendation}` | user report |

---

## Missing File Behavior

If a required phase output is missing when a downstream phase starts:

| Missing File | Behavior |
|-------------|----------|
| `phase1/context-output.json` | Run dev-agent-context automatically |
| `phase2/arch-output.json` | Run dev-agent-arch automatically |
| `phase3/*-output.json` | Error: report which phase failed |
| `phase4/validate-output.json` | Error: report and skip to phase 5 with warning |
