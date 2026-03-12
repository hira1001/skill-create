# Skill Creator

Autonomous skill creation, improvement, and composition toolkit for Claude Code.

## What's Included

### Skills

- **skill-create** — Create, improve, and compose Claude Code skills with autonomous iterative quality improvement. Supports 5 modes: Document-Driven, Artifact-Driven, Observation-Driven, Improve, and Suite Design.
- **skill-audit** — Audit installed skills for quality, structure, and best-practice compliance. Generates detailed reports with scores and improvement suggestions.

### MCP Server (`skill-creator-server`)

Provides deterministic tooling for the skill creation workflow:

| Tool | Purpose |
|------|---------|
| `validate_skill` | Validate structure, frontmatter, and conventions |
| `generate_eval_set` | Generate template evaluation test cases |
| `run_eval` | Execute eval cases via `claude -p` subprocesses |
| `get_loop_state` | Read autonomous improvement loop state |
| `update_loop_state` | Update loop state with iteration results |
| `install_skill` | Copy completed skill to `~/.claude/skills/` |

## Installation

```bash
./install.sh
```

This will:
1. Build the MCP server (`npm install` + `tsc`)
2. Register the MCP server with Claude Code
3. Install both skills to `~/.claude/skills/`

## Usage

### Creating a Skill

```
/skill-create
```

Or provide input directly:

```
/skill-create docs/my-procedure.md    # From a document
/skill-create improve ~/.claude/skills/my-skill  # Improve existing
```

### Auditing Skills

```
/skill-audit                          # Audit all installed skills
/skill-audit ~/.claude/skills/my-skill  # Audit a specific skill
```

## Architecture

```
skill-create/
├── .claude/skills/
│   ├── skill-create/
│   │   ├── SKILL.md              # Main skill definition
│   │   ├── agents/               # Subagent definitions
│   │   │   ├── analyzer.md       # Improvement analyzer
│   │   │   ├── grader.md         # Output quality grader
│   │   │   ├── decomposer.md    # Suite decomposition
│   │   │   └── doc-generator.md  # Documentation generator
│   │   └── references/           # Reference docs & templates
│   │       ├── quality-rubric.md
│   │       ├── anti-patterns.md
│   │       ├── best-practices.md
│   │       ├── skill-structure.md
│   │       ├── agent-teams-guide.md
│   │       └── templates/
│   └── skill-audit/
│       ├── SKILL.md
│       └── agents/
│           └── scorer.md
├── mcp-server/                   # MCP server (TypeScript)
│   ├── src/
│   │   ├── index.ts
│   │   ├── tools/
│   │   └── schemas/
│   └── package.json
└── install.sh
```

## Autonomous Improvement Loop

The core differentiator of skill-create is its autonomous improvement loop:

1. **Generate** eval test cases (should/shouldn't trigger)
2. **Execute** tests via `claude -p` subprocesses
3. **Grade** outputs using the 5-axis quality rubric
4. **Analyze** patterns across failures and generate fixes
5. **Converge** when quality thresholds are met (avg >= 4.0, min >= 3.0) or after 5 iterations

## Quality Rubric (5 Axes)

| Axis | What it measures |
|------|-----------------|
| Accuracy | Output matches skill's promise |
| Completeness | All required elements present |
| Structure | Progressive Disclosure, file organization |
| Trigger Precision | Activates when it should, stays silent when it shouldn't |
| Reusability | Works across different inputs and contexts |

Pass threshold: average >= 4.0, no axis below 3.0.
