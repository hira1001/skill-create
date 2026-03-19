# Agent Teams Integration Guide

## When to Use Agent Teams
- Multiple independent tasks that can run in parallel
- Tasks that benefit from isolated context windows
- Suite generation (creating multiple skills simultaneously)

## When NOT to Use Agent Teams
- Sequential tasks with tight dependencies
- Tasks that need to edit the same file
- Simple tasks that don't justify the overhead

## Pattern: Parallel Skill Generation
```
Lead Agent (orchestrator)
├── Agent A → generates skill-1 using Mode A
├── Agent B → generates skill-2 using Mode A
└── Agent C → generates skill-3 using Mode A
→ Lead merges results and runs integration tests
```

## Pattern: Parallel Evaluation
```
Lead Agent (orchestrator)
├── Executor A → runs eval cases 1-3
├── Executor B → runs eval cases 4-6
└── Executor C → runs eval cases 7-10
→ Lead aggregates results → passes to grader
```

## Pattern: Writer/Reviewer
```
Writer Agent → generates skill draft
Reviewer Agent → grades the output (isolated context, no bias)
→ Lead synthesizes feedback → applies improvements
```

## Key Constraints
- Teammates share MCP server access
- Teammates do NOT share context (each has isolated window)
- File conflicts: ensure agents work on different files
- Communication: use messaging between teammates for coordination
- Token cost: each teammate consumes tokens independently

## Subagent Model Selection
Set `CLAUDE_CODE_SUBAGENT_MODEL` to control cost:
- Main session: Opus (complex reasoning)
- Subagents: Sonnet (focused tasks, lower cost)

## Integration with MCP Server
All teammates can access skill-creator-server tools:
- `validate_skill` - any teammate can validate
- `run_eval` - executor teammates run evals
- `get_loop_state` / `update_loop_state` - shared state across team
- `install_skill` - lead agent installs final result
