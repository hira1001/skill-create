---
name: skill-audit
description: |
  Audit and assess the quality of Claude Code skills.
  Use when: "スキルを監査", "audit skill", "check skill quality",
  "スキルの品質チェック", "review my skills", "skill health check",
  "audit all skills", "全スキルを監査", "スキル品質レポート".
  Validates structure, evaluates quality, detects anti-patterns, and generates an audit report.
---

# Skill Quality Auditor

Audit one or all Claude Code skills for quality, structure, and best practices compliance.
Uses MCP server (`skill-creator-server`) for structural validation and subagents for deep analysis.

## Input Detection

| Input | Action |
|-------|--------|
| Specific skill path | Audit that single skill |
| "all" or "全部" or no path | Scan `~/.claude/skills/` and `.claude/skills/` for all skills |
| Skill name (not path) | Find in `~/.claude/skills/<name>/` or `.claude/skills/<name>/` |

---

## Audit Process

### Phase 1: Discovery
- If auditing all: scan `~/.claude/skills/` and `.claude/skills/` for SKILL.md files
- List all found skills with their names and paths
- Report: "Found N skills to audit"

### Phase 2: Structural Validation (per skill)
Use MCP: `validate_skill(skill_path)` for each skill.

Check:
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] `name` is kebab-case, no reserved words
- [ ] `description` exists, <1024 chars, includes trigger info
- [ ] Body is <500 lines
- [ ] references/ files are appropriately sized (<200 lines each)
- [ ] agents/ have valid frontmatter
- [ ] No orphaned files (files not referenced by SKILL.md)

### Phase 3: Anti-Pattern Detection (per skill)
Check against anti-patterns (from skill-create's `references/anti-patterns.md`):

- **AP-1 Kitchen Sink**: Body >300 lines AND description lists 3+ capabilities
- **AP-2 Vague Description**: Description lacks "Use when:" or trigger phrases
- **AP-3 Keyword Triggering**: Description relies on single keywords without context
- **AP-4 Inline Everything**: Body >400 lines AND no references/ directory
- **AP-5 Ambiguous Instructions**: Uses vague language ("make it good", "handle appropriately")
- **AP-6 No Quality Criteria**: No explicit success criteria or output format
- **AP-7 Context Assumption**: References specific files/tools without checking existence
- **AP-8 Output Format Drift**: No output format specification
- **AP-9 No Error Path**: No error handling instructions
- **AP-10 Stale References**: references/ files contradict SKILL.md
- **AP-11 Over-Engineered**: >5 reference files for a simple skill
- **AP-12 Missing Tests**: No eval set in .agent/evals/

### Phase 4: Quality Scoring (per skill)
Launch `skill-audit-scorer` agent to evaluate 5 axes:

1. **Accuracy potential**: How likely is this skill to produce accurate output?
   - Clear, specific instructions → high score
   - Vague, ambiguous instructions → low score

2. **Completeness**: Does the skill cover all necessary steps?
   - Comprehensive workflow → high
   - Missing steps or edge cases → low

3. **Structure Quality**: Progressive Disclosure, file organization
   - Well-separated layers → high
   - Everything inline → low

4. **Trigger Precision**: Description quality for auto-invocation
   - Specific trigger phrases + "Use when:" → high
   - Generic description → low

5. **Reusability**: Will this work for different inputs/contexts?
   - Parameterized, no hard-coded assumptions → high
   - Hard-coded to specific project → low

### Phase 5: Generate Audit Report

Output a structured report:

```
# Skill Audit Report
Generated: {{timestamp}}
Skills audited: {{count}}

## Summary
| Skill | Score | Status | Top Issue |
|-------|-------|--------|-----------|
| {{name}} | {{avg}}/5 | {{PASS/WARN/FAIL}} | {{issue}} |

## Status Criteria
- PASS: avg ≥ 4.0, no axis below 3.0, no critical anti-patterns
- WARN: avg ≥ 3.0 but has warnings or anti-patterns
- FAIL: avg < 3.0 or has critical structural errors

## Detailed Results

### {{skill-name}}
**Path**: {{path}}
**Score**: {{avg}}/5.0

**Structural Validation**: {{PASS/FAIL}}
{{list of errors/warnings}}

**Anti-Patterns Detected**: {{count}}
{{list with severity}}

**Quality Scores**:
| Axis | Score | Notes |
|------|-------|-------|
| Accuracy | {{score}} | {{notes}} |
| Completeness | {{score}} | {{notes}} |
| Structure | {{score}} | {{notes}} |
| Trigger | {{score}} | {{notes}} |
| Reusability | {{score}} | {{notes}} |

**Recommended Actions** (priority order):
1. {{highest priority fix}}
2. {{next fix}}
3. {{next fix}}
```

### Phase 6: Improvement Suggestions
For each WARN/FAIL skill, suggest:
- Specific fixes for each detected issue
- Whether to use `/skill-create improve <path>` for automated improvement
- Whether to decompose into a Suite if too complex

---

## Quick Audit Mode

If the user says "quick audit" or "簡易監査":
- Skip Phase 4 (quality scoring by agent)
- Only run structural validation + anti-pattern detection
- Faster, lower token cost

## Continuous Audit

If the user says "set up continuous audit" or "継続監査":
- Generate a shell script that runs `validate_skill` on all skills
- Can be added as a git pre-commit hook or scheduled task
- Output: audit-hook.sh script
