# Skill Authoring Best Practices

## When to Create a Skill
- You've done the task manually at least 5 times
- You expect to do it 10+ more times
- The task has a repeatable pattern with clear inputs/outputs

## The "One Job" Principle
Each skill should handle ONE job well. If your skill does multiple unrelated things:
- Split into separate skills
- Or create a Suite (orchestrator + member skills)

## Description is King
The `description` field is the PRIMARY mechanism for triggering. Invest time here:
- Include exact phrases users would say
- Include both what it does AND when to use it
- Be specific, not generic
- Test trigger precision with should/shouldn't trigger evals

## Progressive Disclosure
- SKILL.md body: Only essential instructions (<500 lines)
- references/: Detailed specs, examples, schemas
- agents/: Specialized subagent definitions
- Never put everything in SKILL.md

## Instruction Quality
- Use imperative language: "Generate a...", "Read the file...", "Check that..."
- Be specific about output format: "Output as JSON with fields: ..."
- Include constraints: "Do NOT add comments", "Maximum 100 lines"
- Specify error handling: "If X fails, then Y"

## Avoid These Anti-Patterns
→ See anti-patterns.md for full list

## Testing Your Skill
1. Create 5+ should_trigger test prompts
2. Create 5+ should_not_trigger test prompts
3. Run eval to check trigger precision
4. Check output quality with grader agent
5. Iterate based on findings

## Token Efficiency
- Shorter skills load faster and consume fewer tokens
- Move reference data to references/ directory
- Use templates in references/ instead of inline examples
- Prefer structured formats (JSON, YAML) over prose for specs

## Agent Teams Integration
- Skills can be loaded into subagent context via `skills` field
- Design skills to work both standalone AND as part of a team
- Avoid assumptions about parent context
- Make inputs/outputs explicit

## Versioning
- Track changes in comments or a CHANGELOG
- When improving, keep the previous version as backup
- Use the improvement loop to measure before/after quality
