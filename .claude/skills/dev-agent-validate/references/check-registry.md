# Check Registry

Language-specific commands for compile, lint, and test checks.

## TypeScript/JavaScript

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `npx tsc --noEmit` | For TS projects |
| Lint | `npx eslint <files>` | Or `npx eslint .` for all |
| Test | `npm test` or `npx jest <files>` | Use `-- --passWithNoTests` if needed |
| Format check | `npx prettier --check <files>` | Non-destructive check |

**Package manager detection**: Use `npm` if `package-lock.json`, `yarn` if `yarn.lock`, `pnpm` if `pnpm-lock.yaml`.

## Python

| Check | Command | Notes |
|-------|---------|-------|
| Type check | `mypy <files>` or `pyright <files>` | If configured |
| Lint | `ruff check <files>` or `flake8 <files>` | Ruff preferred |
| Test | `pytest <files>` or `python -m pytest` | |
| Format check | `ruff format --check <files>` or `black --check <files>` | Non-destructive |

## Rust

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `cargo check` | Fast compile check |
| Lint | `cargo clippy` | |
| Test | `cargo test` | |
| Format check | `cargo fmt -- --check` | |

## Go

| Check | Command | Notes |
|-------|---------|-------|
| Compile | `go build ./...` | |
| Lint | `golangci-lint run` | If installed |
| Test | `go test ./...` | |
| Format check | `gofmt -l .` | Lists unformatted files |

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
