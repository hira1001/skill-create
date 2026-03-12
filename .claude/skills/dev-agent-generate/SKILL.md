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

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read architecture plan from `.agent/phase2/arch-output.json`.
Receive task description from the orchestrator.

### Standalone Mode
If no suite context, analyze the project directly. Ask user to describe the feature to implement.

## Process

1. **Load context and plan**: Read the context JSON for conventions (naming, import style, patterns) and the arch plan for files to create/modify.

2. **Read existing code** (max 5 files): Before writing, read:
   - Files listed in `files_to_modify`
   - 1-2 adjacent files to understand patterns (e.g., a sibling route if adding a route)
   - Type definitions and interfaces relevant to the feature
   If conventions are still unclear after 5 files, use language-standard conventions and note the assumption.

3. **Design the implementation**: Following the arch plan's `approach_notes`:
   - Define new interfaces/types first
   - Stub out function signatures
   - Then fill in implementations

4. **Write code**: Apply the project's detected conventions:
   - Use the same naming convention (camelCase, snake_case, etc.)
   - Match existing import style (relative vs. absolute)
   - Follow detected patterns (repository pattern, DI, etc.)
   - Match file structure and organization of sibling files
   - See [code-gen-patterns.md](references/code-gen-patterns.md) for language-specific guidance

5. **Update wiring**: Ensure the new code is properly integrated:
   - Register routes, handlers, or modules in the appropriate index/app files
   - Export new symbols from barrel files (index.ts, etc.)
   - Add configuration entries if required

6. **Write basic tests**: Create or update test files for new public APIs (unless user says skip).

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
    "src/routes/profile.ts": "New route handler for GET /users/:id/profile",
    "src/services/profile.service.ts": "New service fetching user profile from DB",
    "tests/routes/profile.test.ts": "Tests for 200 OK, 404 not found cases",
    "src/app.ts": "Registered profile router"
  },
  "run_command": "npm test -- tests/routes/profile.test.ts",
  "verification_hint": "GET /users/1/profile should return { id: 1, bio: '...' }"
}
```

Also display a summary to the user showing what was generated.

## Quality Criteria
- [ ] Generated code matches project conventions (naming, imports, patterns)
- [ ] New code is properly wired into existing entry points
- [ ] At least one test written for each new public API
- [ ] No placeholder TODOs left in generated code

## Error Handling
- If arch plan is missing: run dev-agent-arch first, then proceed
- If an existing file is too large to read fully: read the relevant section only (top 100 lines + function signatures)
- If a convention cannot be detected: follow language-standard conventions and note the assumption
