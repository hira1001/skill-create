---
name: dev-agent-test
description: |
  Generates comprehensive tests for existing or new code. Covers unit tests,
  integration tests, and edge cases. Follows the project's test framework and
  conventions. Produces a test output JSON listing all created/modified test files.
  Use when: "write tests for", "add test coverage", "テストを書いて",
  "テストカバレッジを上げて", "unit test this function", "test this module".
  Can also be used standalone or as Phase 5 of dev-agent.
---

# Test Generator

Generate comprehensive tests that cover happy paths, edge cases, and error conditions.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read execution output from `.agent/phase3/` to find `files_created` and `files_modified`.
Focus test generation on those files.

### Standalone Mode
Accept a file path, function name, or module name from the user.

## Process

1. **Identify testable units**: From the target files, identify:
   - Public functions and methods
   - API endpoints / route handlers
   - Classes and their public interfaces
   - Edge cases in the business logic

2. **Read existing tests**: Check the test directory for patterns:
   - Test file naming convention (`*.test.ts`, `*_test.py`, etc.)
   - Import style in tests (how is the module imported?)
   - Test structure (describe/it, class-based, etc.)
   - Mock/stub patterns used

3. **Design test cases**: For each unit, cover:
   - Happy path (expected inputs → expected outputs)
   - Edge cases (empty, null, boundary values, max values)
   - Error cases (invalid input, missing dependencies, network failure)
   - Concurrent/async behavior (if applicable)

4. **Write tests**: Follow the project's test framework conventions.
   See [test-patterns.md](references/test-patterns.md) for framework-specific patterns.

5. **Ensure tests are isolated**: Each test should:
   - Not depend on test execution order
   - Mock external dependencies (DB, network, filesystem)
   - Clean up state after itself

6. **Verify test quality**: Check that tests actually test behavior, not implementation.

## Test Coverage Targets

| Code Type | Minimum Coverage Goal |
|-----------|----------------------|
| Business logic / domain | 90%+ |
| API route handlers | 80%+ |
| Utility functions | 100% |
| Error handling paths | 80%+ |

## Output Format

Write to `.agent/phase5/test-output.json`:

```json
{
  "files_tested": ["src/auth.ts", "src/services/user.service.ts"],
  "test_files_created": ["tests/auth.test.ts"],
  "test_files_modified": ["tests/services/user.service.test.ts"],
  "test_cases_added": 12,
  "coverage_estimate": "~85%",
  "run_command": "npm test -- tests/auth.test.ts tests/services/user.service.test.ts",
  "change_summary": {
    "tests/auth.test.ts": "New: 8 tests covering login, logout, token refresh, and expired session",
    "tests/services/user.service.test.ts": "Added 4 tests for new getProfile method"
  }
}
```

Also display a summary to the user.

## Quality Criteria
- [ ] Happy path, edge cases, and error cases all covered
- [ ] Tests are isolated (no order dependence, no shared mutable state)
- [ ] External dependencies mocked appropriately
- [ ] Tests verify behavior, not internal implementation details

## Error Handling
- If no test framework detected: ask user which framework to use before generating
- If existing test file exists: read it first and add to it rather than replacing
- If a function has too many parameters to test exhaustively: cover the most critical combinations and note what was skipped
