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

1. **Detect project root**: Find the nearest directory containing a package.json, Cargo.toml, go.mod, pyproject.toml, pom.xml, or .git directory.

2. **Identify language and framework**: Read the primary config file to determine:
   - Primary language (typescript, python, rust, go, java, etc.)
   - Framework (express, nextjs, django, flask, fastapi, actix, gin, spring, etc.)
   - See [project-detection-rules.md](references/project-detection-rules.md) for heuristics.

3. **Detect tooling**:
   - Build tool (npm, yarn, pnpm, cargo, go, pip, maven, gradle)
   - Test framework (jest, pytest, go test, cargo test, junit)
   - Linter (eslint, ruff, clippy, golangci-lint, checkstyle)
   - Formatter (prettier, black, rustfmt, gofmt)

4. **Map project structure**:
   - Identify key directories (src, tests, docs, scripts, etc.)
   - Find entry points
   - Count source files by type

5. **Check git status**:
   - Current branch
   - Whether there are uncommitted changes
   - Recent commit count

6. **Detect conventions** by sampling **8-12 source files** across different directories:
   - Sample at least 2 files from each key directory (src, tests, etc.)
   - Include files of varying sizes (not just the smallest)
   - If the project has multiple sub-packages/modules, sample from at least 3 different ones
   - Naming convention (camelCase, snake_case, PascalCase)
   - Import style (relative, absolute, aliases)
   - Notable patterns (dependency injection, repository pattern, etc.)

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

Also display a human-readable summary to the user.

## Quality Criteria
- [ ] All fields populated (no nulls for detectable values)
- [ ] Language and framework correctly identified
- [ ] Test framework detection matches actual project config
- [ ] Git status accurate
- [ ] Conventions derived from actual file sampling, not guessing

## Error Handling
- If no project config found: report "No project detected" and ask user to specify the project root
- If a specific tool cannot be detected: set that field to `null` and note it in the summary
- If git is not initialized: set `git_status` to `null`
