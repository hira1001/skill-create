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

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read execution output from `.agent/phase3/` for `files_created` and `files_modified`.
Focus documentation on newly added or changed public APIs.

In Flow C, the orchestrator decides whether to invoke this skill based on Docs Trigger Rules (e.g., files created in `routes/`, `api/`, `controllers/`, or `endpoints/` directories; user mentions "public", "API", "endpoint"; new module/package created). If invoked, prioritize documenting public-facing APIs from `files_created`.

### Standalone Mode
Accept a file path, function name, or "document everything in X" from the user.

## Process

1. **Identify what needs documentation**: From the target files:
   - New public functions, methods, classes, or modules
   - Changed function signatures or return types
   - New configuration options or environment variables
   - New API endpoints

2. **Read existing docs**: Before writing, check:
   - Existing README structure and style
   - Docstring style in the codebase (JSDoc, Google style, NumPy style, etc.)
   - CHANGELOG format (keep-a-changelog, conventional commits, etc.)
   - Any doc generation config (typedoc, sphinx, pdoc, etc.)

3. **Determine documentation type** and produce accordingly:

   **Inline docstrings**: For functions and classes
   - Describe purpose (not just what, but why)
   - Document parameters with types and meaning
   - Document return value and error conditions
   - Include a usage example for complex APIs

   **README sections**: For new features visible to end users
   - Installation or configuration steps if new deps added
   - Usage examples with real code
   - Link to detailed API reference if applicable

   **API reference**: For public-facing APIs
   - Complete endpoint/function reference
   - Request/response schemas
   - Authentication requirements
   - Error codes and meanings

   **Changelog entry**: For any user-visible change
   - Under the correct section (Added / Changed / Fixed / Removed)
   - One line per change, in imperative mood

4. **Write documentation**: Match the project's existing documentation style exactly.
   See [doc-style-guide.md](references/doc-style-guide.md) for style patterns.

5. **Verify accuracy**: Cross-check doc against actual code:
   - Parameter names match function signature
   - Return type matches actual return
   - Examples actually work (no syntax errors)

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
- [ ] All new public APIs have docstrings
- [ ] README updated for any user-visible features
- [ ] CHANGELOG entry added for any release-worthy change
- [ ] Documentation matches actual code (no stale params or types)

## Error Handling
- If no existing documentation style detected: ask user for their preferred style (JSDoc, Google, NumPy, etc.)
- If README does not exist: ask user if they want one created
- If a function's behavior is unclear from reading the code: note the uncertainty in the doc and ask the author to clarify
