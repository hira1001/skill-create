# Skill Creator

Autonomous skill creation, improvement, and composition toolkit for Claude Code.

## What's Included

- **skill-create** — Create, improve, and compose Claude Code skills. Supports 5 modes: Document-Driven, Artifact-Driven, Observation-Driven, Improve, and Suite Design.
- **skill-audit** — Audit installed skills for quality, structure, and best-practice compliance. Generates detailed reports with scores and improvement suggestions.

## Installation

```bash
./install.sh
```

This copies both skills to `~/.claude/skills/`.

## Usage

### Creating a Skill

```
/skill-create                                        # Interactive (will ask for input)
/skill-create docs/my-procedure.md                  # From a document
/skill-create improve ~/.claude/skills/my-skill     # Improve existing skill
```

### Auditing Skills

```
/skill-audit                                         # Audit all installed skills
/skill-audit ~/.claude/skills/my-skill              # Audit a specific skill
```

## Structure

```
skill-creator/
├── .claude/skills/
│   ├── skill-create/
│   │   ├── SKILL.md              # Main skill definition
│   │   ├── agents/
│   │   │   ├── decomposer.md     # Suite decomposition
│   │   │   └── doc-generator.md  # Documentation generator
│   │   └── references/
│   │       ├── quality-rubric.md
│   │       ├── anti-patterns.md
│   │       ├── best-practices.md
│   │       ├── skill-structure.md
│   │       └── templates/
│   │           ├── single-skill.md
│   │           ├── suite-orchestrator.md
│   │           └── suite-member.md
│   └── skill-audit/
│       ├── SKILL.md
│       ├── agents/
│       │   └── scorer.md
│       └── references/
│           └── anti-patterns-detection.md
└── install.sh
```

## Quality Rubric (5 Axes)

| Axis | What it measures |
|------|-----------------|
| Accuracy | Output matches skill's promise |
| Completeness | All required elements present |
| Structure | Progressive Disclosure, file organization |
| Trigger Precision | Activates when it should, stays silent when it shouldn't |
| Reusability | Works across different inputs and contexts |

Pass threshold: average >= 4.0, no axis below 3.0.
