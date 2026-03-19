# Suite Member Skill Template

Use this template for a skill that is part of a Suite (coordinated by an orchestrator).

```markdown
---
name: {{suite-name}}-{{member-name}}
description: |
  {{What this member skill does}} as part of {{suite-name}} suite.
  Use when: {{trigger phrases}}. Can also be used standalone.
---

# {{Member Skill Title}}

## Overview
{{What this skill does within the suite context}}

## Standalone vs Suite Mode
- **Standalone**: Accepts {{direct input description}}
- **Suite mode**: Reads input from `.agent/{{phase}}/{{input-file}}`

## Inputs
### Primary Input
- Source: `.agent/{{phase}}/{{input-file}}` OR direct user input
- Format: {{JSON/Markdown/etc.}}
- Schema: {{reference to schema if applicable}}

### Context (Optional)
- Project constraints from `.agent/project-config.json`
- Previous phase outputs for context

## Process
1. Read input (check both suite path and direct input)
2. {{Step 2}}
3. {{Step 3}}
4. Validate output against quality criteria

## Output
- Path: `.agent/{{phase}}/{{output-file}}`
- Format: {{specify exact format}}
- Also display summary to user

## Quality Criteria
- [ ] {{Criterion 1}}
- [ ] {{Criterion 2}}

## Error Handling
- If input not found: ask user for direct input
- If {{specific error}}: {{specific recovery}}
```

## Suite Member Guidelines
- Must work both standalone AND as part of the suite
- Input: check .agent/ first, fall back to user input
- Output: always write to .agent/ AND display to user
- Never assume other skills have run (check, don't assume)
- Prefix name with suite name for discoverability
