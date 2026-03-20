# Skill Authoring Guidelines

Combines best practices and structural requirements for creating Claude Code skills.

---

## Skill Structure

### Required File
- `SKILL.md` — Main skill definition file

### YAML Frontmatter (Required)
```yaml
---
name: my-skill-name          # Required. kebab-case only. No spaces, capitals, or reserved words (claude, anthropic).
description: |                # Required. Max 1024 chars. Must include BOTH what it does AND when to use it.
  What this skill does.
  Use when: specific trigger phrases and scenarios.
---
```

### Optional Frontmatter Fields
```yaml
disable-model-invocation: true   # Prevent auto-triggering (manual slash command only)
user-invocable: false            # Prevent manual invocation (auto-trigger only)
```

### Body (<500 lines)
The markdown body contains instructions Claude follows when the skill activates.

1. Start with a brief overview (1-2 sentences)
2. Define clear steps or sections
3. Specify input requirements and output format
4. Include quality criteria and constraints
5. Reference files in references/ for detailed specs

### Optional Directories

**`references/`** — Reference documents loaded into context when skill activates.
- Detailed specs, schemas, examples
- Keep each file focused (<200 lines recommended)
- Use for Progressive Disclosure: keep SKILL.md concise, put details here

**`agents/`** — Subagent definitions (markdown files with frontmatter).
- Each agent = isolated context for specialized tasks
- Must have `name` and `description` in frontmatter
- Used for Writer/Reviewer patterns, parallel processing

**`scripts/`** — Executable scripts the skill can invoke via bash.
- Validation, testing, data processing
- Keep deterministic logic here (not in LLM instructions)

**`assets/`** — Static files (images, templates, config files).

### Progressive Disclosure Pattern
```
Layer 1: Frontmatter description → Decides whether to trigger
Layer 2: SKILL.md body (<500 lines) → Core instructions
Layer 3: references/ → Detailed specs, examples, schemas
```

### Name Convention
- Use kebab-case: `my-skill-name`
- Descriptive but concise
- The name becomes the slash command: `/my-skill-name`
- Do not include "claude" or "anthropic"

---

## Best Practices

### When to Create a Skill
- You've done the task manually at least 5 times
- You expect to do it 10+ more times
- The task has a repeatable pattern with clear inputs/outputs

### The "One Job" Principle
Each skill should handle ONE job well. If your skill does multiple unrelated things:
- Split into separate skills
- Or create a Suite (orchestrator + member skills)

### Description is King
The `description` field is the PRIMARY mechanism for triggering. Invest time here:
- Include exact phrases users would say
- Include both what it does AND when to use it
- Be specific, not generic
- Test trigger precision with should/shouldn't trigger cases

### Instruction Quality
- Use imperative language: "Generate a...", "Read the file...", "Check that..."
- Be specific about output format: "Output as JSON with fields: ..."
- Include constraints: "Do NOT add comments", "Maximum 100 lines"
- Specify error handling: "If X fails, then Y"

### Testing Your Skill
1. Create 5+ should_trigger prompts
2. Create 5+ should_not_trigger prompts
3. Manually test each prompt and verify the skill triggers correctly
4. Run the skill with a real input and evaluate output against quality criteria (see quality-rubric.md)
5. Iterate on description or instructions based on findings

### Token Efficiency
- Shorter skills load faster and consume fewer tokens
- Move reference data to references/ directory
- Use templates in references/ instead of inline examples
- Prefer structured formats (JSON, YAML) over prose for specs

### Agent Teams Integration
- Skills can be loaded into subagent context via `skills` field
- Design skills to work both standalone AND as part of a team
- Avoid assumptions about parent context
- Make inputs/outputs explicit

### Versioning
- Track changes in comments or a CHANGELOG
- When improving, keep the previous version as backup

### Avoid These Anti-Patterns
→ See anti-patterns.md for full list
