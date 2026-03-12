# Common Bug Diagnosis Patterns

## Null / Undefined Errors
- **Symptom**: `TypeError: Cannot read property 'x' of null/undefined`
- **Cause**: Missing null guard, optional chaining, or object not initialized
- **Where to look**: The line throwing + the function that returns the object
- **Fix hint**: Add null check or optional chaining (`?.`)

## Type Mismatches
- **Symptom**: Unexpected behavior, wrong output, or runtime cast error
- **Cause**: String passed where number expected, or vice versa
- **Where to look**: Function signatures, API/DB response parsing
- **Fix hint**: Add type coercion or validate at boundary

## Off-by-One Errors
- **Symptom**: Missing first/last item, fence-post errors in loops
- **Cause**: `<` vs `<=`, 0-indexed vs 1-indexed confusion
- **Where to look**: Loop bounds, slice/substring calls, pagination
- **Fix hint**: Add +1/-1 correction or change comparison operator

## Async / Await Misuse
- **Symptom**: Promise returned instead of value, `.then()` on non-Promise
- **Cause**: Missing `await`, forgetting `async`, mixing callbacks and Promises
- **Where to look**: Any function interacting with I/O, DB, or HTTP
- **Fix hint**: Add `await` keyword, wrap in `async` function

## State Mutation Bugs
- **Symptom**: Unexpected side effects, tests passing in isolation but failing together
- **Cause**: Shared mutable state, reference aliasing
- **Where to look**: Array/object spreads, global/module-level state
- **Fix hint**: Use spread/clone to create new copies, avoid mutation

## Import / Dependency Issues
- **Symptom**: `Module not found`, `is not a function`, undefined exports
- **Cause**: Wrong import path, circular dependency, missing export
- **Where to look**: The import statement and the module being imported
- **Fix hint**: Check path, check named vs default export, check circular deps

## Race Conditions
- **Symptom**: Intermittent failures, different behavior under load
- **Cause**: Multiple async operations completing in unexpected order
- **Where to look**: Any code with concurrent async operations
- **Fix hint**: Add proper sequencing with `await`, mutex, or queue

## Environment / Config Errors
- **Symptom**: Works locally but fails in CI/production
- **Cause**: Missing env var, different config value, platform difference
- **Where to look**: Env var reads, config files, CI environment
- **Fix hint**: Validate required env vars at startup, add fallback defaults
