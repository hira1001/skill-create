# Claude Code Skill Structure Reference

## Required File
- `SKILL.md` - Main skill definition file

## YAML Frontmatter (Required)
```yaml
---
name: my-skill-name          # Required. kebab-case only. No spaces, capitals, or reserved words (claude, anthropic).
description: |                # Required. Max 1024 chars. Must include BOTH what it does AND when to use it.
  What this skill does.
  Use when: specific trigger phrases and scenarios.
---
```

## Optional Fields
```yaml
disable-model-invocation: true   # Prevent auto-triggering (manual slash command only)
user-invocable: false            # Prevent manual invocation (auto-trigger only)
```

## Body (<500 lines)
The markdown body contains instructions Claude follows when the skill activates.

### Structure Guidelines
1. Start with a brief overview (1-2 sentences)
2. Define clear steps or sections
3. Specify input requirements and output format
4. Include quality criteria and constraints
5. Reference files in references/ for detailed specs

## Optional Directories

### `references/`
Reference documents loaded into context when skill activates.
- Detailed specs, schemas, examples
- Keep each file focused (<200 lines recommended)
- Use for Progressive Disclosure: keep SKILL.md concise, put details here

### `agents/`
Subagent definitions (markdown files with frontmatter).
- Each agent = isolated context for specialized tasks
- Must have `name` and `description` in frontmatter
- Used for Writer/Reviewer patterns, parallel processing

### `scripts/`
Executable scripts the skill can invoke via bash.
- Validation, testing, data processing
- Keep deterministic logic here (not in LLM instructions)

### `assets/`
Static files (images, templates, config files).

## Progressive Disclosure Pattern
```
Layer 1: Frontmatter description → Decides whether to trigger
Layer 2: SKILL.md body (<500 lines) → Core instructions
Layer 3: references/ → Detailed specs, examples, schemas
```

## Name Convention
- Use kebab-case: `my-skill-name`
- Descriptive but concise
- The name becomes the slash command: `/my-skill-name`
- Do not include "claude" or "anthropic"

## Description Best Practices
- First sentence: What the skill does
- Second part: When to use it (trigger phrases)
- Include both English and Japanese trigger phrases if bilingual
- Be "pushy" - make it clear when Claude should use this skill
- Max 1024 characters
