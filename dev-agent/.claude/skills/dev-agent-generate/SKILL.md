---
name: dev-agent-generate
description: |
  Generates new code (features, modules, components, APIs) following the project's
  existing conventions and architecture plan. Produces a generation output JSON
  listing all created/modified files for downstream validation.
  Use when: "implement this feature", "add this endpoint", "create a component",
  "新機能を実装して", "コンポーネントを作成して". Can also be used standalone.
---

# Code Generator

Generate new code that fits naturally into the existing codebase, following its conventions and architecture.

## Critical Rules

1. **Convention compliance**: Generated code MUST match the project's detected conventions (naming, imports, patterns). If context-output.json says `naming: "camelCase"`, every new identifier uses camelCase. No exceptions.
2. **No placeholder code**: Never leave `TODO`, `FIXME`, `// implement later`, `pass`, `throw new Error("not implemented")`, or empty function bodies. Every function must have a complete implementation.
3. **Wiring is mandatory**: New code that isn't reachable from an entry point is dead code. Always register routes, export symbols, update barrel files, and add configuration entries.
4. **Read before create**: Before creating a new file, read at least one sibling file in the same directory to match structure, imports, and style exactly.
5. **Types first**: Define interfaces/types before implementations. This prevents type errors during generation and makes the code self-documenting.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read architecture plan from `.agent/phase2/arch-output.json`.
Receive task description from the orchestrator.

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
If no suite context, analyze the project directly. Ask user to describe the feature to implement.

## Process

### Step 1: Load context and plan
Read the context JSON for conventions (naming, import style, patterns) and the arch plan for files to create/modify. Extract:
- `conventions.naming` → apply to all new identifiers
- `conventions.import_style` → apply to all new imports
- `conventions.patterns` → follow detected patterns (repository, DI, etc.)
- `framework` → use framework idioms (e.g., Express middleware pattern, React hooks)

### Step 2: Read existing code (max 5 files)
Before writing, read in this priority order:
1. Files listed in `files_to_modify` from arch plan (must read all)
2. One sibling file in the same directory as each new file (to copy structure)
3. Type definitions and interfaces relevant to the feature
4. Entry point file (to understand wiring pattern)

If conventions are still unclear after 5 files, use language-standard conventions and note the assumption in `change_summary`.

### Step 3: Define types first
Before writing any implementation:
- Define new interfaces/types/structs for the feature
- Ensure they align with existing type patterns in the project
- Place them in the project's conventional location for types

### Step 4: Implement with convention matching
Apply the project's detected conventions strictly:
- **Naming**: Match exactly (camelCase/snake_case/PascalCase as detected)
- **Imports**: Match style (relative vs absolute, named vs default, alias patterns)
- **File structure**: Match organization of sibling files (exports at top/bottom, function ordering)
- **Error handling**: Match project's error handling pattern (exceptions, Result types, error codes)
- **Logging**: Use the project's existing logger if one exists
- See [code-gen-patterns.md](references/code-gen-patterns.md) for language-specific guidance

### Step 5: Wire into existing code
Ensure the new code is properly integrated:
- Register routes, handlers, or modules in the appropriate index/app files
- Export new symbols from barrel files (index.ts, __init__.py, etc.)
- Add configuration entries if required
- Update dependency injection container if the project uses DI

**Wiring verification checklist**:
- [ ] Every new exported symbol is imported somewhere
- [ ] Every new route/handler is registered in the router/app
- [ ] Every new config key has a default value or is documented as required
- [ ] Every new dependency is injected through the project's DI pattern (if applicable)

### Step 6: Write basic tests
Create or update test files for new public APIs (unless user says skip):
- At least one happy-path test per new endpoint/function
- At least one error-case test
- Follow the project's test file naming and structure conventions

## Output Format

Write to `.agent/phase3/generate-output.json`:

```json
{
  "task": "Add user profile endpoint GET /users/:id/profile",
  "files_created": [
    "src/routes/profile.ts",
    "src/services/profile.service.ts",
    "tests/routes/profile.test.ts"
  ],
  "files_modified": [
    "src/app.ts"
  ],
  "change_summary": {
    "src/routes/profile.ts": "New route handler for GET /users/:id/profile with input validation",
    "src/services/profile.service.ts": "New service fetching user profile from DB with error handling",
    "tests/routes/profile.test.ts": "Tests for 200 OK, 404 not found, 400 invalid ID cases",
    "src/app.ts": "Registered profile router at /users"
  },
  "run_command": "npm test -- tests/routes/profile.test.ts",
  "verification_hint": "GET /users/1/profile should return { id: 1, bio: '...' }"
}
```

Also display a summary to the user showing what was generated.

## Quality Criteria
- [ ] Generated code matches project conventions exactly (naming, imports, patterns)
- [ ] New code is reachable from entry points (wiring complete)
- [ ] At least one test per new public API
- [ ] No placeholder code: every function body is fully implemented
- [ ] All files in `files_modified` were read before editing
- [ ] Types/interfaces defined before implementations

## Error Handling
- If arch plan is missing: run dev-agent-arch first, then proceed
- If an existing file is too large to read fully: read the relevant section only (top 100 lines + function signatures)
- If a convention cannot be detected: follow language-standard conventions and note the assumption in `change_summary`
- If the feature requires a dependency not in the project: note the required dependency in `verification_hint` and ask user to install it
