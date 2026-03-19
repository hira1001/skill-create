# Single Skill Template

Use this template when creating a standalone skill (not part of a Suite).

```markdown
---
name: {{skill-name}}
description: |
  {{What this skill does - one sentence}}.
  Use when: {{specific trigger phrases and scenarios}}.
  {{Optional: Japanese trigger phrases}}.
---

# {{Skill Title}}

## Overview
{{1-2 sentence description of what this skill does}}

## Inputs
- {{Input 1}}: {{description}}
- {{Input 2}}: {{description}}

## Process
1. {{Step 1 - imperative language}}
2. {{Step 2}}
3. {{Step 3}}

## Output Format
{{Specify exact output format: JSON schema, markdown template, etc.}}

## Quality Criteria
- [ ] {{Criterion 1}}
- [ ] {{Criterion 2}}
- [ ] {{Criterion 3}}

## Error Handling
- If {{condition}}: {{action}}
- If {{dependency missing}}: {{fallback}}
```

## Checklist Before Finalizing
- [ ] Name is kebab-case, no reserved words
- [ ] Description < 1024 chars, includes "Use when:"
- [ ] Body < 500 lines
- [ ] Instructions use imperative language
- [ ] Output format is specified
- [ ] Quality criteria are measurable
- [ ] Error paths are defined
