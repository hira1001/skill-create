# Common Bug Diagnosis Patterns

## Null / Undefined Errors
- **Symptom**: `TypeError: Cannot read property 'x' of null/undefined`
- **Cause**: Missing null guard, optional chaining, or object not initialized
- **Where to look**: The line throwing + the function that returns the object
- **Fix hint**: Add null check or optional chaining (`?.`)
- **Search command**: `grep -rnE "\.id\b|\.name\b|\.email\b" <file>` to find property accesses that may need null guards

## Type Mismatches
- **Symptom**: Unexpected behavior, wrong output, or runtime cast error
- **Cause**: String passed where number expected, or vice versa
- **Where to look**: Function signatures, API/DB response parsing
- **Fix hint**: Add type coercion or validate at boundary
- **Search command**: `grep -rnE "parseInt|parseFloat|Number(|String(|toString" <file>` to find type conversion points

## Off-by-One Errors
- **Symptom**: Missing first/last item, fence-post errors in loops
- **Cause**: `<` vs `<=`, 0-indexed vs 1-indexed confusion
- **Where to look**: Loop bounds, slice/substring calls, pagination
- **Fix hint**: Add +1/-1 correction or change comparison operator
- **Search command**: `grep -rnE "\.length|\.size|\.count|\.slice|\.substring" <file>` to find boundary operations

## Async / Await Misuse
- **Symptom**: Promise returned instead of value, `.then()` on non-Promise
- **Cause**: Missing `await`, forgetting `async`, mixing callbacks and Promises
- **Where to look**: Any function interacting with I/O, DB, or HTTP
- **Fix hint**: Add `await` keyword, wrap in `async` function
- **Search command**: `grep -rnE "\.then(|new Promise|async " <file>` to find async patterns

## State Mutation Bugs
- **Symptom**: Unexpected side effects, tests passing in isolation but failing together
- **Cause**: Shared mutable state, reference aliasing
- **Where to look**: Array/object spreads, global/module-level state
- **Fix hint**: Use spread/clone to create new copies, avoid mutation
- **Search command**: `grep -rnE "\.push(|\.splice(|\.sort(|= \[" <file>` to find mutation operations

## Import / Dependency Issues
- **Symptom**: `Module not found`, `is not a function`, undefined exports
- **Cause**: Wrong import path, circular dependency, missing export
- **Where to look**: The import statement and the module being imported
- **Fix hint**: Check path, check named vs default export, check circular deps
- **Search command**: `grep -rnE "import|require(|from " <file>` to trace imports

## Race Conditions
- **Symptom**: Intermittent failures, different behavior under load
- **Cause**: Multiple async operations completing in unexpected order
- **Where to look**: Any code with concurrent async operations
- **Fix hint**: Add proper sequencing with `await`, mutex, or queue
- **Search command**: `grep -rnE "Promise\.all|Promise\.race|setTimeout|setInterval" <file>` to find concurrency patterns

## Environment / Config Errors
- **Symptom**: Works locally but fails in CI/production
- **Cause**: Missing env var, different config value, platform difference
- **Where to look**: Env var reads, config files, CI environment
- **Fix hint**: Validate required env vars at startup, add fallback defaults
- **Search command**: `grep -rnE "process\.env|os\.environ|env::|getenv" <file>` to find env var usage

## Systematic Search Strategy

When the stack trace is insufficient, use these search strategies:

1. **Recent change search**: `git log --oneline -20 -- <file>` to find recent changes near the error
2. **Similar pattern search**: `grep -rnE "<error_pattern>" src/` to find if the same mistake exists elsewhere
3. **Call chain tracing**: `grep -rnE "import.*from.*<module>" src/` to find all callers of the failing module
4. **Configuration search**: `grep -rnE "<config_key>" .` to find where a config value is set vs. read
5. **Dead code detection**: `grep -rnE "function <name>|export.*<name>" src/` then `grep -rnE "<name>" src/ | wc -l` — if only 1 match, it may be unused
