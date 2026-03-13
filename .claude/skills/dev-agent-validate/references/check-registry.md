# Check Registry

Language-specific commands for compile, lint, and test checks.

## TypeScript/JavaScript

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `npx tsc --noEmit` | For TS projects |
| Lint | `npx eslint <files>` | Or `npx eslint .` for all |
| Lint fix | `npx eslint --fix <files>` | Auto-fix — modifies files |
| Test | `npm test` or `npx jest <files>` | Use `-- --passWithNoTests` if needed |
| Format check | `npx prettier --check <files>` | Non-destructive check |
| Format fix | `npx prettier --write <files>` | Auto-fix — modifies files |

**Package manager detection**: Use `npm` if `package-lock.json`, `yarn` if `yarn.lock`, `pnpm` if `pnpm-lock.yaml`.

## Python

| Check | Command | Notes |
|-------|---------|-------|
| Type check | `mypy <files>` or `pyright <files>` | If configured |
| Lint | `ruff check <files>` or `flake8 <files>` | Ruff preferred |
| Lint fix | `ruff check --fix <files>` | Auto-fix — modifies files |
| Test | `pytest <files>` or `python -m pytest` | |
| Format check | `ruff format --check <files>` or `black --check <files>` | Non-destructive |
| Format fix | `ruff format <files>` or `black <files>` | Auto-fix — modifies files |

## Rust

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `cargo check` | Fast compile check |
| Lint | `cargo clippy` | |
| Lint fix | `cargo clippy --fix --allow-dirty` | Auto-fix — modifies files |
| Test | `cargo test` | |
| Format check | `cargo fmt -- --check` | |
| Format fix | `cargo fmt` | Auto-fix — modifies files |

## Go

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `go build ./...` | |
| Lint | `golangci-lint run` | If installed |
| Test | `go test ./...` | |
| Format check | `gofmt -l .` | Lists unformatted files |
| Format fix | `gofmt -w .` | Auto-fix — modifies files |

## Java (Maven)

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `mvn compile` | |
| Lint | `mvn checkstyle:check` | If configured |
| Test | `mvn test` | |

## Java (Gradle)

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `gradle compileJava` | |
| Test | `gradle test` | |

## Targeted vs Full Checks

When `files_modified` is available:
- **Lint**: Prefer running on specific files (`eslint src/auth.ts src/routes.ts`)
- **Test**: If upstream provides `run_command`, use it; otherwise run full suite
- **Compile**: Always run full project (partial compile is unreliable)

When `files_modified` is not available:
- Run all checks on the full project

## Auto-Fix Policy

When `dev-agent-validate` finds lint or format failures:
1. If the fix is a safe auto-fix (formatting, import sorting, unused import removal): run the auto-fix command automatically.
2. After auto-fix, re-run the check to confirm it passes.
3. Add auto-fixed files to `files_modified` in the validate output.
4. If auto-fix changes semantic code (not just formatting): do NOT auto-fix. Instead, add to `remediation_hints`.
5. Never auto-fix compile errors or test failures.
