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

---

## Plan Mode

Produce a concrete implementation plan before any code is written.

### Input

**Suite Mode**: Read `phase1/context-output.json` and `phase2/diagnose-output.json` (if it exists).
**Standalone**: If no context, run dev-agent-context first or ask for project details.

### Process

1. **Understand the task**: Parse request into goal, constraints, and task type
   (bug-fix / new-feature / refactor / test / docs).

2. **If diagnose-output.json exists**: Read `fix_approach`, `files_to_fix`, and `root_cause`
   to inform the plan. The arch plan in Flow B translates diagnosis → concrete file changes.

3. **Identify affected areas**: Which files to change, create, and avoid.
   See [planning-strategies.md](references/planning-strategies.md) for task-type heuristics.

4. **Sequence changes**: Order to minimize risk (data layer before business logic,
   interfaces before implementations).

5. **Identify risks and unknowns**: Surface blockers before execution.

6. **Verify with user if needed**: Ask at most 1 clarifying question if task is ambiguous.

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
      "reason": "Extend session TTL logic",
      "change_summary": "Add activity listener that resets expiry timer"
    }
  ],
  "files_to_create": [],
  "files_to_avoid": ["src/auth/middleware.ts"],
  "change_order": ["src/auth/session.ts"],
  "risks": ["Session store may have concurrent write issues"],
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

1. **Map the layers**: Identify presentation, business logic, and data access layers
   by reading `key_directories` from context and sampling representative files.

2. **Find components**: Identify major modules/packages. For each:
   - List files in the component
   - List external dependencies (imports from other components)

3. **Measure metrics**: For each component:
   - **Coupling**: Count of external imports (low/medium/high)
   - **Cohesion**: Do all files in the component share a single purpose? (high/medium/low)
   - **Complexity hotspots**: Files with >300 lines or >5 external dependencies

4. **Identify issues**: Circular dependencies, god objects, unclear layer boundaries,
   high coupling + low cohesion combinations.

5. **Produce recommendations**: Ranked by impact (highest impact first).

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
      "dependencies": ["DatabaseModule", "UserModule"]
    }
  ],
  "metrics": {
    "coupling": "medium",
    "cohesion": "high",
    "complexity_hotspots": ["src/auth/session.ts"]
  },
  "recommendations": [
    {
      "issue": "Circular dependency: AuthModule ↔ UserModule",
      "suggestion": "Extract shared interface to a new SharedModule"
    }
  ]
}
```

Also display a human-readable summary to the user.

---

## Quality Criteria

**Plan mode**:
- [ ] All files to modify identified (no surprises during execution)
- [ ] Diagnose output incorporated if it exists
- [ ] Change order minimizes risk
- [ ] Risks and unknowns surfaced before execution

**Analyze mode**:
- [ ] All major components identified
- [ ] Coupling/cohesion metrics based on actual file sampling
- [ ] At least 1 concrete recommendation provided
- [ ] Circular dependencies explicitly listed if found

## Error Handling
- If context missing: run dev-agent-context first, then proceed
- If task is vague (plan mode): ask one clarifying question
- If codebase too large to analyze fully (analyze mode): focus on the top 5 components by file count
