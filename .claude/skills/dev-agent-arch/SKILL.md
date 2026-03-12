---
name: dev-agent-arch
description: |
  Analyzes a development task and produces an architecture plan: which files to
  touch, what changes to make, and in what order. Produces a plan JSON consumed
  by dev-agent-fix, dev-agent-generate, and dev-agent-refactor.
  Use when: "plan the implementation", "what files need to change", "設計して",
  "実装計画を立てて". Can also be used standalone before coding.
---

# Architecture Planner

Analyze the task and project context to produce a concrete implementation plan before any code is written.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Receive task description from the orchestrator (dev-agent).

### Standalone Mode
If no suite context, run `dev-agent-context` first or ask user for project details.

## Process

1. **Understand the task**: Parse the user's request into:
   - Goal (what should work when done)
   - Constraints (must not break X, stay within Y pattern)
   - Type: bug-fix / new-feature / refactor / test / docs

2. **Identify affected areas**: Based on context JSON and task:
   - Which modules / packages are involved
   - Which files likely need to change
   - Which files likely need to be created
   - Which files must NOT be changed (risk of regression)

3. **Sequence changes**: Order the changes to minimize risk:
   - Data layer changes before business logic
   - New interfaces before implementations
   - Tests after implementation (unless TDD requested)

4. **Identify risks and unknowns**:
   - Missing information that could block execution
   - Files that need reading before deciding approach
   - External dependencies that may be affected

5. **Verify with user if needed**: If task is ambiguous or risky, surface the top 1-2 questions before continuing.

## Output Format

Write to `.agent/phase2/arch-output.json`:

```json
{
  "task_type": "bug-fix",
  "goal": "Fix authentication timeout not being refreshed on activity",
  "files_to_modify": [
    {
      "path": "src/auth/session.ts",
      "reason": "Extend session TTL logic",
      "change_summary": "Add activity listener that resets expiry timer"
    }
  ],
  "files_to_create": [],
  "files_to_avoid": ["src/auth/middleware.ts"],
  "change_order": ["src/auth/session.ts"],
  "risks": ["Session store may have concurrent write issues"],
  "unknowns": [],
  "approach_notes": "Use debounced activity handler to avoid excessive writes"
}
```

Also display a human-readable plan summary to the user.

## Quality Criteria
- [ ] All files to modify are identified (no surprises during execution)
- [ ] Change order minimizes merge conflicts and test failures
- [ ] Risks and unknowns are surfaced before execution begins
- [ ] `files_to_avoid` prevents accidental regression

## Error Handling
- If project context is missing: run dev-agent-context first, then proceed
- If task is too vague to plan: ask one clarifying question before continuing
- If no files can be identified: report and ask user to point to the relevant area
