# Suite Orchestrator Template

Use this template for the orchestrator skill that coordinates a Suite of member skills.

```markdown
---
name: {{suite-name}}
description: |
  Orchestrate {{suite purpose}} by coordinating multiple specialized skills.
  Use when: {{trigger phrases for the overall goal}}.
---

# {{Suite Name}} Orchestrator

## Overview
This skill coordinates the following member skills to {{achieve goal}}:

## Member Skills
| Order | Skill | Responsibility | Depends On |
|-------|-------|---------------|------------|
| 1 | {{skill-a}} | {{what it does}} | - |
| 2 | {{skill-b}} | {{what it does}} | skill-a |
| 3 | {{skill-c}} | {{what it does}} | - |
| 4 | {{skill-d}} | {{what it does}} | skill-b, skill-c |

## Execution Plan

### Phase 1: {{Phase Name}} (Sequential)
1. Run `{{skill-a}}` with input: {{description}}
2. Save output to `.agent/phase1/{{output-file}}`

### Phase 2: {{Phase Name}} (Parallel via Agent Teams)
Run simultaneously:
- `{{skill-b}}` reading from `.agent/phase1/`
- `{{skill-c}}` reading from {{input source}}
Save outputs to `.agent/phase2/`

### Phase 3: {{Phase Name}} (Sequential)
1. Run `{{skill-d}}` reading from `.agent/phase2/`
2. Final output to {{target directory}}

## Data Flow
```
skill-a → .agent/phase1/output.json
               ↓
skill-b → .agent/phase2/b-output.json ─┐
                                        ├→ skill-d → final output
skill-c → .agent/phase2/c-output.json ─┘
```

## Error Handling
- If any skill fails: retry up to 2 times
- If retry fails: log error and ask user for guidance
- Partial results are preserved in `.agent/` for recovery

## State Management
- Progress tracked in `.agent/orchestrator-state.json`
- Idempotent: can resume from any failed phase
```

## Design Principles
- Each member skill should work independently (testable alone)
- Data passes through filesystem (.agent/ directory)
- Orchestrator never implements business logic itself
- Parallel phases use Agent Teams for efficiency
