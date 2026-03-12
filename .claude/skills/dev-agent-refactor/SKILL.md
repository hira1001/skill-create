---
name: dev-agent-refactor
description: |
  Improves code structure, readability, and maintainability without changing
  external behavior. Follows the project's conventions and patterns.
  Produces a refactor output JSON listing all modified files for validation.
  Use when: "refactor this", "clean up the code", "リファクタリングして",
  "コードを整理して", "extract this into a function", "remove duplication",
  "simplify", "decouple", "improve code structure".
  Can also be used standalone.
  Do NOT use when: request contains "TODO: refactor" as a code comment,
  fixing a bug (use dev-agent-fix), or adding new functionality (use dev-agent-generate).
---

# Code Refactorer

Improve code structure and quality while preserving existing behavior.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read architecture plan from `.agent/phase2/arch-output.json`.
Receive refactoring goal from the orchestrator.

### Retry Mode
If `.agent/phase4/validate-output-1.json` exists and contains `"all_passed": false`:
- Read `remediation_hints` array from it
- Address each hint in this execution
- Note in `change_summary` which hints were addressed with prefix `[RETRY: {hint}]`

### Standalone Mode
Accept a file path, module, or description of what to refactor from the user.

## Process

1. **Understand the goal**: Determine what quality problem the refactor addresses:
   - Duplication (DRY violation)
   - Long function / god object
   - Poor naming
   - Complex conditional logic
   - Tight coupling / missing abstraction
   - Dead code

2. **Read all affected code**: Read target files and any callers/consumers before making changes.

3. **Plan the refactor**: Identify the specific transformation:
   - Extract function / method
   - Extract class / module
   - Rename for clarity
   - Simplify conditionals (guard clauses, early returns)
   - Introduce interface / abstraction
   - Remove dead code
   - See [refactor-catalog.md](references/refactor-catalog.md) for patterns.

4. **Apply incrementally**: Make one logical change at a time rather than restructuring everything at once. This makes validation easier.

5. **Preserve all public interfaces**: External callers must continue to work without changes. If a public interface must change, note it explicitly.

6. **Update tests to match**: If function signatures change, update test files to match. Do not change test assertions (behavior must be preserved).

7. **Check for knock-on effects**: Search for all usages of renamed/moved symbols to ensure nothing is broken.

## Output Format

Write to `.agent/phase3/refactor-output.json`:

```json
{
  "refactor_goal": "Extract authentication logic from route handlers into reusable middleware",
  "files_modified": [
    "src/routes/user.ts",
    "src/routes/product.ts",
    "src/middleware/auth.ts"
  ],
  "files_created": [],
  "change_summary": {
    "src/routes/user.ts": "Removed inline auth check, now uses requireAuth middleware",
    "src/routes/product.ts": "Removed inline auth check, now uses requireAuth middleware",
    "src/middleware/auth.ts": "New requireAuth middleware extracted from route handlers"
  },
  "public_interface_changes": [],
  "run_command": "npm test",
  "verification_hint": "All existing tests should pass unchanged"
}
```

Also display a human-readable summary of what was refactored.

## Quality Criteria
- [ ] External behavior unchanged (same inputs produce same outputs)
- [ ] All public interfaces preserved (or changes explicitly listed)
- [ ] Existing tests still pass without modification to assertions
- [ ] Each change addresses exactly one quality problem

## Error Handling
- If the refactor scope is unclear: ask the user to identify the specific code smell or target
- If caller analysis would require reading too many files: refactor with a compatibility shim and note it
- If behavior preservation cannot be guaranteed: report to user and ask for confirmation before proceeding
