# Implementation Planning Strategies

## Task-Type Heuristics

### Bug Fix Planning
1. Start from the error location (file + line from diagnose output)
2. Trace backward through the call chain to find the root file
3. Identify only the minimal set of files needed to fix the root cause
4. List files_to_avoid: anything that calls the broken function (change callers only if signature changes)
5. Preferred change order: root cause file first, then any necessary callers

**Heuristic**: A good bug fix touches ≤ 3 files. If more, consider whether root cause is correctly identified.

### New Feature Planning
1. Find the entry point for similar existing features (e.g., a sibling route)
2. Identify the full stack: route → service → repository/model → types
3. Order: types/interfaces first → service → repository → route → wiring (index/app)
4. Create new files rather than expanding existing ones when adding unrelated functionality
5. Mark existing files that register routes/handlers as files_to_modify (not files_to_create)

**Heuristic**: A new feature typically creates 2-4 files and modifies 1-2 (wiring files).

### Refactor Planning
1. Read the target code first to identify the specific smell
2. Identify all callers of the function/class being refactored (they are files_to_modify)
3. Order: extraction target first → update all callers → update tests last
4. List files_to_avoid: files that are NOT callers (no collateral changes)
5. Set behavioral_changes: "none" and verify this in approach_notes

**Heuristic**: Refactor should NOT add new logic. If approach_notes mentions "also fix..." it has scope creep.

---

## Identifying Files to Avoid

Always populate files_to_avoid to prevent scope creep:
- Test files (unless the fix requires test changes)
- Configuration files (unless the feature requires new config)
- Unrelated modules (even if they share a utility)
- Auto-generated files

---

## Risk Assessment

| Condition | Risk Level |
|-----------|-----------|
| Modifying shared utilities used by >10 files | High |
| Changing a database schema | High |
| Modifying authentication/authorization code | High |
| Changing an interface/type signature | Medium |
| Adding a new file with no callers yet | Low |
| Modifying a single function in a single file | Low |

---

## Change Order Principles

1. **Dependencies before dependents**: Change the module being imported before changing the importer
2. **Types before implementations**: Change interfaces before classes that implement them
3. **Tests last** (unless TDD is requested)
4. **Wiring files last**: `app.ts`, `index.ts`, `routes.ts` — changes here expose new code to the system

---

## When to Ask Before Planning

Ask 1 clarifying question before planning if:
- 5+ files could be affected and the correct subset is unclear
- The task description mentions multiple possible interpretations
- A file the user named doesn't exist in the project (possible typo)
- The approach requires a decision between two valid strategies (e.g., "extract to new file vs. inline")
