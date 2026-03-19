# Safe Patch Guidelines

## Minimal Change Principle

A good bug fix:
- Touches the **fewest lines possible** to resolve the root cause
- Does NOT refactor surrounding code
- Does NOT change variable names or formatting beyond what's necessary
- Preserves all existing whitespace and indentation style

If you find yourself wanting to clean up the code around the bug, note it but don't do it.
That's a separate refactoring task.

---

## Before Writing the Fix

1. **Read the full function** containing the bug, not just the problem line
2. **Trace the call path** from the error location to its callers (2-3 levels up)
3. **Check for similar patterns** in 5-10 related files (the same bug may appear elsewhere)
4. **Understand the intended behavior** — what should happen vs. what does happen

---

## Safe Patch Techniques by Error Type

### Null/Undefined Guards
```typescript
// Before (crashes when user is null)
return user.id;

// After (guard at the right level)
if (!user) return null;  // or throw, or return 401 — match the function's contract
return user.id;
```
Prefer guarding at the function boundary, not inline at each usage.

### Off-by-One Fixes
```typescript
// Before
for (let i = 0; i < items.length - 1; i++) { ... }  // misses last item

// After
for (let i = 0; i < items.length; i++) { ... }
```
Always check: should the boundary be `<` or `<=`? 0-indexed or 1-indexed?

### Async/Await Fixes
```typescript
// Before (returns Promise, not value)
const data = fetchData();

// After
const data = await fetchData();
```
Check: does the calling function also need `async`?

### Type Coercion Fixes
```typescript
// Before (comparing string to number fails)
if (userId === req.params.id) { ... }

// After
if (userId === parseInt(req.params.id, 10)) { ... }
```

---

## Regression Test Requirements

Every fix must include a regression test that:
1. Reproduces the exact failure scenario before the fix
2. Confirms the expected behavior after the fix
3. Is named descriptively: `test_[what]_when_[condition]_should_[expected]`

Example:
```typescript
it('returns 401 when session expires during request', async () => {
  const response = await request(app).get('/api/user').set('X-Session', 'expired');
  expect(response.status).toBe(401);
});
```

---

## Multiple Occurrences

When searching for the same bug pattern in related files:
1. Search the 10 most related files (imports, siblings, shared utilities)
2. Stop at 10 files maximum
3. If the same bug is found: fix all occurrences in the same commit
4. If uncertain whether another occurrence is the same bug: note it in fix_output.json's change_summary but don't modify that file

---

## What NOT to Do

- Do NOT add error handling that can never trigger
- Do NOT add null checks on values guaranteed by the framework
- Do NOT change function signatures unless strictly necessary
- Do NOT add logging without removing it later (note as a TODO if needed)
- Do NOT fix multiple bugs in one pass (one fix per root cause)
