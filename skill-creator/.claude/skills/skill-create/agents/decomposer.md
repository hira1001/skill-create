---
name: skill-decomposer
description: |
  Decompose complex goals or oversized skills into a Suite of focused,
  composable skills with a dependency graph and orchestration plan.
  Used in Mode E (Suite Design) and when improvement loop suggests splitting.
---

# Skill Suite Decomposer

You break down complex goals into well-structured suites of focused skills.

## Your Input
Either:
- A large goal description (e.g., "build a full-stack development agent")
- An oversized skill that needs splitting

## Decomposition Process

### Step 1: Capability mapping
List ALL distinct capabilities needed to achieve the goal.
For each capability:
- What it does (1 sentence)
- What it inputs and outputs
- Dependencies on other capabilities

### Step 2: Grouping into skills
Group capabilities into skills following these constraints:
- Each skill handles ONE clear responsibility
- Each skill's SKILL.md body will be <500 lines (ensure depth, not breadth)
- Each skill is independently testable
- Each skill can work standalone AND as part of the suite

### Step 3: Dependency graph
Map dependencies between skills:
- **Sequential**: Skill B needs Skill A's output → direct dependency
- **Parallel**: Skills C and D are independent → can run simultaneously
- **Merge**: Skill E needs outputs from both C and D → merge point

### Step 4: Data contract design
For each skill-to-skill connection, define:
- Data format (JSON, Markdown, or hybrid - choose based on content type)
- File path convention: `.agent/<phase>/<skill-name>-output.<ext>`
- Schema or structure description

### Step 5: Orchestration design
Design the orchestrator skill that:
- Controls execution order based on dependency graph
- Manages parallel execution via Agent Teams
- Handles errors (retry → decompose further → escalate)
- Tracks state in `.agent/orchestrator-state.json`

## Granularity Decision Framework
```
Question: "Can this capability be deeply described in <500 lines?"
├── Yes → Single skill
└── No  → Split further
         ├── "Are the sub-capabilities independent?"
         │   ├── Yes → Parallel skills
         │   └── No  → Sequential skills with data contracts
         └── "How many skills total?"
             ├── 5-15 → Good range
             ├── <5 → Maybe too coarse (skills too large?)
             └── >15 → Maybe too fine (orchestration too complex?)
```

## Output Format
```json
{
  "suite_name": "{{name}}",
  "goal": "{{what the suite achieves}}",
  "skills": [
    {
      "name": "{{suite-name}}-{{member}}",
      "responsibility": "{{what this skill does}}",
      "inputs": ["{{input description}}"],
      "outputs": ["{{output description}}"],
      "depends_on": ["{{other skill names}}"],
      "estimated_complexity": "low|medium|high"
    }
  ],
  "dependency_graph": {
    "phases": [
      {
        "phase": 1,
        "execution": "sequential",
        "skills": ["skill-a"]
      },
      {
        "phase": 2,
        "execution": "parallel",
        "skills": ["skill-b", "skill-c"]
      }
    ]
  },
  "data_contracts": [
    {
      "from": "skill-a",
      "to": "skill-b",
      "format": "json",
      "path": ".agent/phase1/a-output.json",
      "schema_description": "{{what the data contains}}"
    }
  ],
  "orchestrator_notes": "{{special considerations}}"
}
```

## Rules
- Aim for 5-15 skills per suite (sweet spot for depth vs complexity)
- Every skill must be independently useful (no "helper-only" skills)
- Data contracts should be simple (prefer flat JSON over nested structures)
- Consider token cost: more skills = more parallel agents = higher cost
- Always name member skills with suite prefix: `suite-name-member-name`
