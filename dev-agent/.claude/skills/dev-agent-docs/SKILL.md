---
name: dev-agent-docs
description: |
  Generates or updates documentation for code changes: inline docstrings,
  API reference docs, README sections, and changelogs. Follows the project's
  existing documentation style and format.
  Use when: "document this", "add docstrings", "update the README",
  "ドキュメントを書いて", "APIドキュメントを生成して", "write a changelog entry".
  Can also be used standalone or as Phase 5 of dev-agent.
---

# Documentation Generator

Generate accurate, readable documentation that stays in sync with the code.

## Critical Rules

1. **Accuracy over completeness**: Every documented parameter, return type, and example must match the actual code. An inaccurate doc is worse than no doc.
2. **Match existing style**: If the project uses JSDoc, write JSDoc. If it uses Google-style Python docstrings, write Google-style. Never introduce a new documentation style.
3. **Document why, not what**: Function names and signatures describe *what*. Docs should explain *why* — the purpose, constraints, and non-obvious behavior.
4. **Verify examples**: Every code example in documentation must be syntactically correct and use actual function signatures from the source code.
5. **No orphan docs**: Don't create documentation files that aren't linked from anywhere. README sections must be reachable from the main README. API docs must be discoverable.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read execution output from `.agent/phase3/` for `files_created` and `files_modified`.
Focus documentation on newly added or changed public APIs.

In Flow C, the orchestrator decides whether to invoke this skill based on Docs Trigger Rules (e.g., files created in `routes/`, `api/`, `controllers/`, or `endpoints/` directories; user mentions "public", "API", "endpoint"; new module/package created). If invoked, prioritize documenting public-facing APIs from `files_created`.

### Standalone Mode
Accept a file path, function name, or "document everything in X" from the user.

## Process

### Step 1: Identify what needs documentation
From the target files:
- New public functions, methods, classes, or modules
- Changed function signatures or return types
- New configuration options or environment variables
- New API endpoints

### Step 2: Read existing docs
Before writing, check:
- Existing README structure and style
- Docstring style in the codebase (JSDoc, Google style, NumPy style, etc.)
- CHANGELOG format (keep-a-changelog, conventional commits, etc.)
- Any doc generation config (typedoc, sphinx, pdoc, etc.)

Read at least 3 existing documented functions to establish the style pattern.

### Step 3: Determine documentation type and produce accordingly

**Inline docstrings**: For functions and classes
- Describe purpose (not just what, but why)
- Document every parameter with type and meaning
- Document return value and error conditions
- Include a usage example for complex APIs (>3 params or non-obvious usage)
- See [doc-style-guide.md](references/doc-style-guide.md) for style patterns

**README sections**: For new features visible to end users
- Installation or configuration steps if new deps added
- Usage examples with real code that compiles/runs
- Link to detailed API reference if applicable

**API reference**: For public-facing APIs
- Complete endpoint/function reference
- Request/response schemas with types
- Authentication requirements
- Error codes and meanings with example responses

**Changelog entry**: For any user-visible change
- Under the correct section (Added / Changed / Fixed / Removed)
- One line per change, in imperative mood
- Include a reference to the relevant issue/PR if available

### Step 4: Write documentation
Match the project's existing documentation style exactly.

### Step 5: Verify accuracy
Cross-check every doc against actual code:
- [ ] Parameter names match function signature exactly
- [ ] Parameter types match actual types
- [ ] Return type matches actual return
- [ ] Examples use correct function names and argument order
- [ ] Default values documented match actual defaults

## Output Format

Write to `.agent/phase5/docs-output.json`:

```json
{
  "files_documented": ["src/auth.ts", "src/routes/profile.ts"],
  "doc_files_modified": ["README.md", "CHANGELOG.md"],
  "doc_files_created": ["docs/api/profile.md"],
  "change_summary": {
    "src/auth.ts": "Added JSDoc to refreshSession(), validateToken()",
    "src/routes/profile.ts": "Added JSDoc to all route handlers",
    "README.md": "Added 'User Profile' section under API Reference",
    "CHANGELOG.md": "Added entry under [Unreleased] > Added",
    "docs/api/profile.md": "New: full API reference for profile endpoints"
  }
}
```

Also display a summary to the user.

## Quality Criteria
- [ ] All new public APIs have docstrings matching the project's existing style
- [ ] README updated for any user-visible features
- [ ] CHANGELOG entry added for any release-worthy change
- [ ] Documentation matches actual code: parameter names, types, return values, defaults
- [ ] Every code example is syntactically correct and uses real function signatures
- [ ] No orphan documentation: all new doc files are linked/discoverable

## Error Handling
- If no existing documentation style detected: read 5+ source files to check for any existing docstrings. If truly none exist, ask user for their preferred style (JSDoc, Google, NumPy, etc.)
- If README does not exist: ask user if they want one created
- If a function's behavior is unclear from reading the code: note the uncertainty in the doc and flag for the author to clarify
- If the project uses a doc generator (typedoc, sphinx): follow its format requirements
