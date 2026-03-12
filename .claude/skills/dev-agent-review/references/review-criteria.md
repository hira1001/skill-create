# Code Review Criteria

## Severity Definitions

| Severity | Definition | Action Required |
|----------|------------|-----------------|
| `critical` | Security vulnerability, data loss risk, or definitely broken behavior | Must fix before merge |
| `warning` | Likely bug, performance issue, or significant maintainability concern | Should fix before merge |
| `suggestion` | Style improvement, minor optimization, or optional enhancement | Fix at discretion |

---

## Correctness Checklist

- [ ] Function does what its name and docstring claim
- [ ] All code paths return a value (no implicit undefined returns)
- [ ] Null/undefined inputs handled
- [ ] Empty collection inputs handled (empty array, empty string)
- [ ] Integer overflow / underflow considered for numeric operations
- [ ] Off-by-one errors in loops and slices
- [ ] Concurrent access to shared state is safe

---

## Security Checklist

| Check | Critical Pattern |
|-------|-----------------|
| SQL injection | User input directly interpolated into SQL string |
| Command injection | User input in `exec()`, `shell()`, `subprocess` |
| XSS | Unsanitized user input rendered as HTML |
| Path traversal | User input used in file path without normalization |
| Hardcoded secrets | API keys, passwords, tokens in source code |
| Sensitive data in logs | Passwords, tokens, PII logged |
| Missing auth check | Endpoint accessible without authentication |
| Insecure deserialization | Untrusted data passed to `JSON.parse(eval(...))` or pickle |

---

## Performance Checklist

- [ ] No N+1 query (DB query inside a loop)
- [ ] No O(n²) or worse algorithm in hot path
- [ ] No synchronous/blocking I/O in async context
- [ ] No unnecessary re-computation on each render/request
- [ ] Large collections paginated, not loaded entirely into memory

---

## Maintainability Checklist

- [ ] Variable and function names are self-explanatory
- [ ] Functions have single responsibility (< 30 lines typical)
- [ ] No magic numbers (use named constants)
- [ ] No deeply nested conditionals (max 3 levels)
- [ ] No duplicated logic (DRY)
- [ ] Naming consistent with rest of codebase

---

## Test Coverage Checklist

- [ ] New public functions have at least one test
- [ ] Happy path tested
- [ ] At least one error/edge case tested per function
- [ ] Tests are isolated (no shared mutable state)
- [ ] Tests are deterministic (no random values, no time dependencies without mocking)
