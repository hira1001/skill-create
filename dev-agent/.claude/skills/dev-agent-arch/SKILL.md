---
name: dev-agent-arch
description: |
  Dual-mode skill: (1) produces an implementation plan (which files to change,
  in what order) for dev-agent-fix, dev-agent-generate, and dev-agent-refactor;
  (2) analyzes codebase architecture (dependencies, coupling, cohesion metrics).
  Use when: "plan the implementation", "what files need to change", "設計して",
  "実装計画を立てて", "analyze architecture", "依存関係を調べて",
  "アーキテクチャ分析", "結合度を調べて". Can also be used standalone.
  Do NOT use when: user wants code changes made immediately (use dev-agent).
---

# Architecture Planner & Analyzer

Two modes in one skill. Mode is determined by context.

## Mode Detection

| Context | Mode |
|---------|------|
| Invoked by dev-agent with `mode: "analyze"` | **Analyze** |
| User says "analyze architecture", "依存関係", "アーキテクチャ分析" | **Analyze** |
| Invoked by dev-agent for Flow B/C/E with a task description | **Plan** |
| User says "plan the implementation", "設計して", "what files need to change" | **Plan** |

When ambiguous, ask: "Should I analyze the architecture structure, or plan a specific implementation?"

## Critical Rules

1. **Plan mode — completeness**: The plan must list ALL files that will be touched. If the Phase 3 skill needs to modify a file not in the plan, the plan was incomplete.
2. **Plan mode — no code**: This skill produces a plan, not code. Do not write implementation code. Do not create application files.
3. **Analyze mode — evidence-based metrics**: Coupling/cohesion assessments must cite specific imports and file relationships. "Medium coupling" alone is meaningless — say "medium coupling: 8 external imports across 3 components."
4. **Both modes — read before claiming**: Do not claim a file exists, contains a function, or has a dependency without reading it first.

---

## Plan Mode

Produce a concrete implementation plan before any code is written.

### Input

**Suite Mode**: Read `phase1/context-output.json` and `phase2/diagnose-output.json` (if it exists).
**Standalone**: If no context, run dev-agent-context first or ask for project details.

### Process

#### Step 1: Understand the task
Parse request into goal, constraints, and task type (bug-fix / new-feature / refactor / test / docs).

#### Step 2: Incorporate diagnosis (Flow B)
If `diagnose-output.json` exists, read `fix_approach`, `files_to_fix`, `root_cause`, and `evidence`. The arch plan in Flow B translates diagnosis into concrete file changes.

#### Step 3: Identify affected areas
See [planning-strategies.md](references/planning-strategies.md) for task-type heuristics.

For each file in the plan:
- **files_to_modify**: Read the file to confirm it exists and contains the code you expect to change. Provide a specific `change_summary` (not "modify as needed").
- **files_to_create**: Specify the full path. Base the path on the project's directory conventions from context.
- **files_to_avoid**: List files that could be accidentally changed but shouldn't be (high regression risk).

#### Step 4: Sequence changes
Order to minimize risk:
1. Type definitions and interfaces first
2. Data layer before business logic
3. Business logic before presentation
4. New files before modifications to existing files
5. Tests last (they depend on everything else)

#### Step 5: Identify risks and unknowns
- **Risk**: Something that could go wrong. Must include what the risk is and how to mitigate it.
- **Unknown**: Something you need to know but couldn't determine from reading code. Must include what specifically is unknown and what information would resolve it.

If there are blocking unknowns (information needed before implementation can start), list them in `unknowns` and recommend asking the user before proceeding.

#### Step 6: Verify with user if needed
Ask at most 1 clarifying question if task is ambiguous. If the task is clear, proceed without asking.

### Output (Plan Mode)

Write to `.agent/phase2/arch-output.json`:

```json
{
  "mode": "plan",
  "task_type": "bug-fix",
  "goal": "Fix authentication timeout not being refreshed on activity",
  "files_to_modify": [
    {
      "path": "src/auth/session.ts",
      "reason": "Contains session TTL logic that needs activity-based refresh",
      "change_summary": "Add activity listener that resets expiry timer in refreshSession()"
    }
  ],
  "files_to_create": [],
  "files_to_avoid": ["src/auth/middleware.ts"],
  "change_order": ["src/auth/session.ts"],
  "risks": ["Session store may have concurrent write issues — use atomic update if available"],
  "unknowns": [],
  "approach_notes": "Use debounced activity handler to avoid excessive writes"
}
```

---

## Analyze Mode

Produce an architectural analysis of the codebase: structure, dependencies, quality metrics.

### Input

**Suite Mode**: Read `phase1/context-output.json` for project root and key directories.
**Standalone**: Auto-detect project or ask for root directory.

### Process

#### Step 1: Map the layers
Identify presentation, business logic, and data access layers by reading `key_directories` from context and sampling representative files (2-3 per directory).

#### Step 2: Find components
Identify major modules/packages. For each:
- List files in the component
- List external dependencies (imports from other components)
- Count import/export relationships

#### Step 3: Measure metrics
For each component, provide evidence-based assessments:
- **Coupling**: Count of external imports. Low (0-3), Medium (4-8), High (9+).
- **Cohesion**: Do all files in the component share a single purpose? High (all related), Medium (mostly related), Low (mixed responsibilities).
- **Complexity hotspots**: Files with >300 lines OR >5 external dependencies OR >10 functions.

#### Step 4: Identify issues
Look for: circular dependencies, god objects, unclear layer boundaries, high coupling + low cohesion combinations.

#### Step 5: Produce recommendations
Ranked by impact (highest impact first). Each recommendation must be actionable: specify what to change and why.

### Output (Analyze Mode)

Write to `.agent/phase2/arch-output.json`:

```json
{
  "mode": "analyze",
  "layers": ["presentation", "business", "data"],
  "components": [
    {
      "name": "AuthModule",
      "files": ["src/auth/session.ts", "src/auth/token.ts"],
      "dependencies": ["DatabaseModule", "UserModule"],
      "external_import_count": 6
    }
  ],
  "metrics": {
    "coupling": "medium (avg 6 external imports per component)",
    "cohesion": "high (components are single-purpose)",
    "complexity_hotspots": ["src/auth/session.ts (342 lines, 8 dependencies)"]
  },
  "recommendations": [
    {
      "issue": "Circular dependency: AuthModule ↔ UserModule via src/auth/session.ts importing src/user/types.ts and src/user/service.ts importing src/auth/token.ts",
      "suggestion": "Extract shared types into a new SharedTypes module imported by both"
    }
  ]
}
```

Also display a human-readable summary to the user.

---

## Quality Criteria

**Plan mode**:
- [ ] All files to modify were read to confirm they exist and contain expected code
- [ ] Every `change_summary` is specific (not "modify as needed" or "update")
- [ ] Diagnose output incorporated if it exists
- [ ] Change order follows risk-minimizing sequence
- [ ] Risks include mitigation strategy; unknowns include resolution path

**Analyze mode**:
- [ ] All major components identified with file lists
- [ ] Coupling/cohesion metrics cite specific import counts
- [ ] Complexity hotspots list specific files with line counts
- [ ] Recommendations are actionable (specify what to change)
- [ ] Circular dependencies explicitly listed with import chain if found

## Error Handling
- If context missing: run dev-agent-context first, then proceed
- If task is vague (plan mode): ask one clarifying question
- If codebase too large to analyze fully (analyze mode): focus on the top 5 components by file count and note which areas were not analyzed
