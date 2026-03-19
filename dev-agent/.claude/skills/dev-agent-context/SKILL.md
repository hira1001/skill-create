---
name: dev-agent-context
description: |
  Analyzes project structure, language, frameworks, conventions, and tooling.
  Produces a standardized project-context JSON consumed by other dev-agent skills.
  Use when: starting any development workflow, "analyze project", "プロジェクト分析",
  "what stack is this", "プロジェクト構造を調べて". Can also be used standalone.
---

# Project Context Gatherer

Analyze the current project and produce a structured context JSON that other dev-agent skills consume.

## Critical Rules

1. **Detect, don't guess**: Every field must be derived from reading actual project files. If a field cannot be determined by reading files, set it to `null` — never guess.
2. **Conventions from sampling**: The `conventions` field must be derived from reading real source files (8-12 files minimum), not from assumptions about the language or framework.
3. **Verify tooling exists**: Before listing a tool (e.g., eslint), verify its config file exists OR it's in package.json/pyproject.toml dependencies. Don't assume a tool exists because the language commonly uses it.
4. **Cache responsibly**: Reuse cached context only if `project_root` matches AND file modification time is within 30 minutes. When in doubt, re-detect.

## Input

### Suite Mode
If invoked as part of a dev-agent flow, write output to `.agent/phase1/context-output.json`.

### Standalone Mode
If invoked directly, display the analysis to the user and optionally write to `.agent/phase1/context-output.json`.

## Process

### Cache Check
Before running detection, check if `.agent/phase1/context-output.json` already exists:
1. Read the existing file.
2. If `project_root` matches the current working directory AND the file was written within the last 30 minutes (check file modification time): reuse it and skip detection.
3. If the user explicitly says "re-analyze" or "refresh context": ignore cache and re-run.
4. Otherwise, proceed with fresh detection.

### Step 1: Detect project root
Find the nearest directory containing a package.json, Cargo.toml, go.mod, pyproject.toml, pom.xml, build.gradle, or .git directory.

### Step 2: Identify language and framework
Read the primary config file to determine:
- Primary language (typescript, python, rust, go, java, kotlin, ruby, etc.)
- Framework (express, nextjs, django, flask, fastapi, actix, gin, spring, rails, etc.)
- See [project-detection-rules.md](references/project-detection-rules.md) for heuristics.

**Detection evidence**: For each detected value, the evidence must be a specific file that was read:
- Language: determined by config file type (package.json → JS/TS, Cargo.toml → Rust, etc.)
- Framework: determined by dependency in config (e.g., `"express"` in package.json dependencies)

### Step 3: Detect tooling
For each tool category, check for config files AND dependency listings:
- Build tool: npm/yarn/pnpm (check lock files), cargo, go, pip/poetry/uv, maven/gradle
- Test framework: jest (jest.config), pytest (pytest.ini/pyproject.toml), go test, cargo test, junit
- Linter: eslint (.eslintrc*), ruff (ruff.toml/pyproject.toml), clippy, golangci-lint, checkstyle
- Formatter: prettier (.prettierrc*), black (pyproject.toml), rustfmt, gofmt

### Step 4: Map project structure
- Identify key directories (src, tests, docs, scripts, lib, etc.)
- Find entry points (main.ts, index.ts, app.py, main.go, etc.)
- Count source files by extension (exclude node_modules, vendor, .git, build artifacts)

### Step 5: Check git status
- Current branch name
- Whether there are uncommitted changes (`git status --porcelain`)
- Do NOT run expensive git operations (no `git log` with large ranges)

### Step 6: Detect conventions
Sample **8-12 source files** across different directories:
- Sample at least 2 files from each key directory (src, tests, etc.)
- Include files of varying sizes (not just the smallest)
- If the project has multiple sub-packages/modules, sample from at least 3 different ones

From the samples, detect:
- **Naming convention**: camelCase, snake_case, PascalCase, kebab-case for files
- **Import style**: relative (`./foo`), absolute (`@/foo`), alias patterns (`~/foo`)
- **Notable patterns**: dependency injection, repository pattern, factory pattern, etc.

**Convention confidence**: Only report a convention if at least 6 out of 8+ sampled files agree. If conventions are mixed, report `"naming": "mixed (camelCase in src/, snake_case in tests/)"`.

## Output Format

Write to `.agent/phase1/context-output.json`:

```json
{
  "project_root": "/absolute/path",
  "language": "typescript",
  "framework": "express",
  "build_tool": "npm",
  "test_framework": "jest",
  "lint_tool": "eslint",
  "formatter": "prettier",
  "entry_points": ["src/index.ts"],
  "key_directories": {
    "src": "source code",
    "tests": "test files",
    "docs": "documentation"
  },
  "conventions": {
    "naming": "camelCase",
    "import_style": "relative",
    "patterns": ["repository pattern"]
  },
  "git_status": {
    "branch": "main",
    "has_uncommitted": false
  },
  "source_file_count": 42,
  "monorepo": null
}
```

When a monorepo is detected (see [project-detection-rules.md](references/project-detection-rules.md#monorepo-detection)):
```json
"monorepo": {
  "type": "npm-workspaces",
  "packages": ["packages/core", "packages/api", "apps/web"],
  "active_package": "packages/api"
}
```

Also display a human-readable summary to the user.

## Quality Criteria
- [ ] All fields populated (nulls only for genuinely undetectable fields)
- [ ] Language and framework identified from actual config files (not guessed)
- [ ] Test framework detection verified against actual config/dependency
- [ ] Git status reflects actual current state
- [ ] Conventions derived from sampling 8+ real source files, not language defaults
- [ ] Tooling verified by config file existence or dependency listing

## Error Handling
- If no project config found: report "No project detected" and ask user to specify the project root
- If a specific tool cannot be detected: set that field to `null` and note it in the summary
- If git is not initialized: set `git_status` to `null`
- If the project uses multiple languages: report the primary language (most source files) and note secondary languages in the summary
