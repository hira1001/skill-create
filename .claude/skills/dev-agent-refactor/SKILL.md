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

## Critical Rules

1. **Behavior preservation is non-negotiable**: After refactoring, all existing tests must pass with zero assertion changes. If a test needs to change, the refactor changed behavior — fix the refactor, not the test.
2. **One transformation per commit**: Each logical refactoring step should be separable. Do not combine "extract function" with "rename variable" with "reorganize imports" in a single tangled change.
3. **No scope creep**: Refactor only the code the user identified (or the arch plan specifies). Finding a code smell in an adjacent file does NOT mean refactoring it. Note it in `verification_hint` instead.
4. **Read all consumers first**: Before changing any function signature, read every caller. Use grep to find all import/usage sites. Missing a caller breaks the build.
5. **Public API stability**: If the function/class is imported by code outside its module, do NOT change its signature without listing the change in `public_interface_changes` and warning the user.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read architecture plan from `.agent/phase2/arch-output.json`.
Receive refactoring goal from the orchestrator.

### Retry Mode (Validation)
If `.agent/phase4/validate-output-1.json` exists and contains `"all_passed": false`:
- Read `remediation_hints` array from it
- Address each hint in this execution
- Note in `change_summary` which hints were addressed with prefix `[RETRY: {hint}]`

### Retry Mode (Review)
If `.agent/phase5/review-output.json` exists with `"verdict": "FAIL"`:
- Read `findings` array filtered to `severity == "critical"`
- Address each critical finding in this execution
- Note in `change_summary` which findings were addressed with prefix `[REVIEW-FIX: {issue}]`

### Standalone Mode
Accept a file path, module, or description of what to refactor from the user.

## Process

### Step 1: Understand the goal
Determine what quality problem the refactor addresses:
- Duplication (DRY violation) → Extract shared function/module
- Long function (>50 lines) → Extract sub-functions
- Poor naming → Rename with project-convention-matching names
- Complex conditional logic → Guard clauses, early returns, strategy pattern
- Tight coupling → Introduce interface/abstraction, dependency injection
- Dead code → Remove (verify with grep that no callers exist)

### Step 2: Read all affected code
Read target files AND all their consumers:
1. Read the target file(s) fully
2. `grep -rn "import.*<module>" src/` to find all callers
3. Read each caller file to understand usage patterns
4. Read the test file(s) for the target module

### Step 3: Plan the refactor
Identify the specific transformation from [refactor-catalog.md](references/refactor-catalog.md):
- Extract Function / Method
- Extract Class / Module
- Rename for Clarity
- Simplify Conditionals (guard clauses, early returns)
- Introduce Interface / Abstraction
- Remove Dead Code
- Inline Function (when abstraction adds no value)

**Verify the plan**: For each change, confirm:
- [ ] The transformation preserves behavior (same inputs → same outputs)
- [ ] All callers will still compile after the change
- [ ] No circular dependency is introduced

### Step 4: Apply incrementally
Make one logical change at a time rather than restructuring everything at once. After each change:
- Mentally verify all callers still work
- Verify test expectations are still correct (without changing assertions)

### Step 5: Update caller sites
If function signatures changed:
- Update every import and call site
- Use grep to verify no usages were missed
- If a public interface must change, note it explicitly in `public_interface_changes`

### Step 6: Verify test compatibility
- Run through the test file mentally to confirm all assertions still hold
- If a test references an internal (now-renamed/moved) function, update the test's import — but NOT its assertions
- If a test would fail because behavior changed, the refactor is wrong

### Step 7: Check for knock-on effects
Search for all usages of renamed/moved symbols to ensure nothing is broken:
- `grep -rn "<old_name>" src/ tests/` should return zero results (except in change_summary comments)

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
  "verification_hint": "All existing tests should pass unchanged. Also noticed potential duplication in src/routes/admin.ts — consider refactoring separately."
}
```

Also display a human-readable summary of what was refactored.

## Quality Criteria
- [ ] External behavior unchanged: same inputs produce same outputs
- [ ] All public interfaces preserved (or changes explicitly listed in `public_interface_changes`)
- [ ] Existing test assertions unchanged (only imports/references updated if moved)
- [ ] Each change addresses exactly one quality problem
- [ ] All callers updated (grep for old names returns zero results)
- [ ] No code outside the specified scope was modified

## Error Handling
- If the refactor scope is unclear: ask the user to identify the specific code smell or target
- If caller analysis reveals more than 20 usage sites: warn the user about the scope and ask for confirmation before proceeding
- If behavior preservation cannot be guaranteed: report to user and ask for confirmation before proceeding
- If a test must change its assertions (not just imports): the refactor changed behavior — revert and try a different approach
