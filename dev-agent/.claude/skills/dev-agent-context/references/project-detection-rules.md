# Project Detection Rules

## Language Detection (by config file)

| Config File | Language |
|------------|----------|
| package.json + tsconfig.json | TypeScript |
| package.json (no tsconfig) | JavaScript |
| pyproject.toml, setup.py, requirements.txt | Python |
| Cargo.toml | Rust |
| go.mod | Go |
| pom.xml, build.gradle | Java |
| *.csproj, *.sln | C# |
| Gemfile | Ruby |
| mix.exs | Elixir |
| pubspec.yaml | Dart/Flutter |

If multiple config files exist, prioritize by the most source files.

## Framework Detection

### TypeScript/JavaScript
| Signal | Framework |
|--------|-----------|
| `next` in dependencies | Next.js |
| `express` in dependencies | Express |
| `@nestjs/core` in dependencies | NestJS |
| `react` without `next` | React (CRA/Vite) |
| `vue` in dependencies | Vue.js |
| `@angular/core` in dependencies | Angular |
| `hono` in dependencies | Hono |
| `fastify` in dependencies | Fastify |

### Python
| Signal | Framework |
|--------|-----------|
| `django` in dependencies | Django |
| `flask` in dependencies | Flask |
| `fastapi` in dependencies | FastAPI |
| `streamlit` in dependencies | Streamlit |

### Go
| Signal | Framework |
|--------|-----------|
| `gin-gonic/gin` in go.mod | Gin |
| `labstack/echo` in go.mod | Echo |
| `gorilla/mux` in go.mod | Gorilla Mux |
| No web framework imports | Standard library |

## Test Framework Detection

| Language | Signals |
|----------|---------|
| TS/JS | `jest` in devDeps → Jest; `vitest` → Vitest; `mocha` → Mocha; `@playwright/test` → Playwright |
| Python | `pytest` in deps → pytest; `unittest` imports → unittest |
| Rust | Built-in `#[test]` → cargo test |
| Go | Built-in `_test.go` → go test |
| Java | `junit` in deps → JUnit; `testng` → TestNG |

## Build Tool Detection

| Language | Default | Alternatives |
|----------|---------|-------------|
| TS/JS | npm (package-lock.json) | yarn (yarn.lock), pnpm (pnpm-lock.yaml), bun (bun.lockb) |
| Python | pip | poetry (poetry.lock), pdm, uv |
| Rust | cargo | — |
| Go | go | — |
| Java | maven (pom.xml) | gradle (build.gradle) |

## Linter/Formatter Detection

Check for config files in project root:
- `.eslintrc*`, `eslint.config.*` → ESLint
- `.prettierrc*` → Prettier
- `ruff.toml`, `[tool.ruff]` in pyproject.toml → Ruff
- `.flake8` → Flake8
- `clippy.toml` → Clippy
- `.golangci.yml` → golangci-lint

## Monorepo Detection

| Signal | Monorepo Type |
|--------|--------------|
| `workspaces` field in package.json | npm/yarn/pnpm workspaces |
| `pnpm-workspace.yaml` in root | pnpm workspace |
| `lerna.json` in root | Lerna |
| `nx.json` in root | Nx |
| `turbo.json` in root | Turborepo |
| Multiple `go.mod` files in subdirectories | Go multi-module |
| `Cargo.toml` with `[workspace]` section | Rust workspace |

When a monorepo is detected:
- Set `project_root` to the workspace root.
- Add a `monorepo` field to context-output.json:
  ```json
  "monorepo": {
    "type": "npm-workspaces",
    "packages": ["packages/core", "packages/api", "apps/web"],
    "active_package": "packages/api"
  }
  ```
- Determine `active_package` by finding which package contains the files the user is asking about.
- Downstream skills should scope their operations to `active_package` unless the user specifies otherwise.
