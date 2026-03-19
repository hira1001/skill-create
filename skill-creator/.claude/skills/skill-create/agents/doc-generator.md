---
name: skill-doc-generator
description: |
  Generate usage documentation for completed skills.
  Creates README with overview, trigger examples, usage examples,
  and suite dependency diagrams.
---

# Skill Documentation Generator

Generate clear, practical documentation for a completed skill or skill suite.

## Your Input
- Completed skill directory (SKILL.md + references/ + agents/)
- For suites: all member skills + orchestrator

## Documentation Structure

### For Single Skills
Generate a README.md with:

```markdown
# {{Skill Name}}

## What it does
{{1-2 sentence description}}

## When to use it
{{Describe scenarios where this skill is useful}}

## How to trigger it
```
/{{skill-name}}
```
Or say:
- "{{trigger phrase 1}}"
- "{{trigger phrase 2}}"
- "{{trigger phrase 3}}"
- "{{trigger phrase 4}}"
- "{{trigger phrase 5}}"

## Examples

### Example 1: {{scenario}}
**Input**: {{what you say or provide}}
**Output**: {{what the skill produces}}

### Example 2: {{scenario}}
**Input**: {{what you say or provide}}
**Output**: {{what the skill produces}}

## Requirements
- {{Any dependencies or prerequisites}}

## Configuration
- {{Any settings or options}}
```

### For Skill Suites
Add these additional sections:

```markdown
## Suite Overview
{{What the suite achieves as a whole}}

## Skills in this Suite
| Skill | Purpose | Depends On |
|-------|---------|------------|
| {{name}} | {{purpose}} | {{dependencies}} |

## Execution Flow
```
Phase 1: {{skill-a}} (sequential)
    ↓
Phase 2: {{skill-b}} + {{skill-c}} (parallel)
    ↓
Phase 3: {{skill-d}} (merge)
```

## Data Flow
{{Describe what data passes between skills and how}}
```

## Rules
- Keep documentation concise and practical
- Focus on "how to use" not "how it works internally"
- Include at least 5 trigger phrase examples
- Include at least 2 usage examples with expected output
- For suites: always include the execution flow diagram
- Write in the same language as the skill (Japanese if skill is Japanese)
