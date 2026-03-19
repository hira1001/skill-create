# Anti-Pattern Detection Rules

Use this table during Phase 3 to detect known quality problems in skills.

| ID | Anti-Pattern | Detection Rule |
|----|-------------|---------------|
| AP-1 | Kitchen Sink | Body >300 lines AND description lists 3+ unrelated capabilities |
| AP-2 | Vague Description | Description lacks "Use when:" or has no trigger phrases |
| AP-3 | Keyword Triggering | Description relies on single generic keywords without context |
| AP-4 | Inline Everything | Body >400 lines AND no references/ directory |
| AP-5 | Ambiguous Instructions | Contains: "make it good", "handle appropriately", "ensure quality", "process as needed" |
| AP-6 | No Quality Criteria | No explicit success criteria, output format, or quality checklist |
| AP-7 | Context Assumption | References specific files/tools without checking they exist |
| AP-8 | Output Format Drift | No output format specification (for skills that produce structured output) |
| AP-9 | No Error Path | No error handling instructions |
| AP-10 | Stale References | references/ files contradict SKILL.md content |
| AP-11 | Over-Engineered | >5 reference files for a single (non-suite) skill |
| AP-12 | Missing Disambiguation | No "Do NOT use when:" clause to redirect to sibling skills |

## Severity Classification

| Severity | Anti-Patterns | Impact on Status |
|----------|--------------|-----------------|
| Critical | AP-1, AP-5, AP-6 | FAIL |
| Major | AP-2, AP-4, AP-9, AP-12 | WARN |
| Minor | AP-3, AP-7, AP-8, AP-10, AP-11 | Note in report |

## Detection Notes

- **AP-5**: Scan the full SKILL.md body and all agents/ files for the listed phrases.
- **AP-7**: Check every file path or tool name referenced in SKILL.md — if it is not a standard system path, mark as conditional dependency and verify it exists or is guarded with a fallback.
- **AP-10**: Read each file in references/ and verify it matches the workflow described in SKILL.md (e.g., no references to removed tools).
