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

## Critical Rules

1. **Test behavior, not implementation**: Tests should verify what a function does (inputs → outputs), not how it does it (internal calls, private methods). If a refactor breaks your test, the test was testing the wrong thing.
2. **Isolation is mandatory**: Each test must be independent. No shared mutable state between tests. No test-order dependencies. Mock all external dependencies (DB, network, filesystem, clock).
3. **No snapshot abuse**: Only use snapshot testing for stable serialized outputs (JSON APIs, rendered HTML). Never snapshot internal state or complex objects.
4. **Match project conventions exactly**: Read existing tests first. Use the same describe/it structure, import style, assertion library, and mock patterns.
5. **Tests must be runnable**: Every test file must compile and run. Verify imports resolve and mocked dependencies exist.

## Input

### Suite Mode
Read project context from `.agent/phase1/context-output.json`.
Read execution output from `.agent/phase3/` to find `files_created` and `files_modified`.
Focus test generation on those files.

### Standalone Mode
Accept a file path, function name, or module name from the user.

## Process

### Step 1: Identify testable units
From the target files, identify:
- Public functions and methods (exported or accessible via public API)
- API endpoints / route handlers
- Classes and their public interfaces
- Complex conditional logic and branching paths

**Priority order**: Test the most critical code first:
1. Functions that handle money, authentication, or authorization
2. Functions with complex branching (3+ code paths)
3. Public API endpoints
4. Utility functions
5. Simple getters/setters (lowest priority — skip if time-constrained)

### Step 2: Read existing tests
Check the test directory for:
- Test file naming convention (`*.test.ts`, `*_test.py`, `test_*.py`, `*_test.go`)
- Import style in tests (how is the module imported?)
- Test structure (describe/it, class-based, function-based)
- Mock/stub patterns used (jest.mock, unittest.mock, testify mock)
- Setup/teardown patterns (beforeEach, setUp, etc.)

Read at least 2 existing test files to establish the pattern. If no tests exist, use framework defaults from [test-patterns.md](references/test-patterns.md).

### Step 3: Design test cases
For each testable unit, design cases using **boundary value analysis**:

| Category | What to Test | Example |
|----------|-------------|---------|
| Happy path | Expected input → expected output | `getUser(1)` → `{id: 1, name: "Alice"}` |
| Empty/zero | Empty string, 0, empty array, null | `getUser(null)` → throws/returns error |
| Boundary | Min, max, off-by-one | `getUsers(limit: 0)`, `getUsers(limit: MAX_INT)` |
| Error | Invalid input, network failure, timeout | `getUser(-1)` → 404, DB down → 500 |
| Async | Race conditions, concurrent access | Two simultaneous updates to same record |

### Step 4: Write tests
Follow the project's test framework conventions.

**Test naming**: Each test name must describe the scenario and expected outcome:
- Good: `test("returns 401 when session token is expired")`
- Bad: `test("auth test 1")`, `test("should work")`

**Assertion style**: Use specific assertions, not generic truthy checks:
- Good: `expect(result).toEqual({id: 1, name: "Alice"})`
- Bad: `expect(result).toBeTruthy()`

**Mock strategy**:
- Mock at the boundary (external services, DB, filesystem) — not internal functions
- Use the lightest mock possible: stub > spy > full mock
- Reset mocks in afterEach/teardown

### Step 5: Ensure test isolation
Each test should:
- Not depend on test execution order
- Mock external dependencies (DB, network, filesystem)
- Clean up state after itself (use afterEach/teardown)
- Use fresh test data (no shared fixtures that mutate)

### Step 6: Verify tests compile and describe
Before finalizing, verify:
- All imports resolve (source module exists, test utilities exist)
- Mock signatures match the real function signatures
- Test expectations match actual return types

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
- [ ] Happy path, boundary, and error cases all covered for each testable unit
- [ ] Tests are isolated (no order dependence, no shared mutable state)
- [ ] External dependencies mocked at the boundary (not internal functions)
- [ ] Tests verify behavior (inputs → outputs), not internal implementation
- [ ] Test names describe scenario and expected outcome
- [ ] All test files compile and import correctly

## Error Handling
- If no test framework detected: ask user which framework to use before generating
- If existing test file exists: read it first and add to it rather than replacing
- If a function has too many parameters to test exhaustively: cover the most critical combinations and note what was skipped in `change_summary`
- If the source code has no clear public API (all private/internal): test through the nearest public entry point
