---
name: skill-audit
description: |
  Audit and assess the quality of Claude Code skills.
  Use when: "スキルを監査", "audit skill", "check skill quality",
  "スキルの品質チェック", "review my skills", "skill health check",
  "audit all skills", "全スキルを監査", "スキル品質レポート".
  Validates structure, evaluates quality, detects anti-patterns, and generates an audit report.
  Do NOT use when: user wants to create a new skill, improve an existing skill, or fix skill
  instructions (use skill-create or `/skill-create improve <path>` instead).
---

# Skill Quality Auditor

Audit one or all Claude Code skills for quality, structure, and best practices compliance.

## Critical Rules

1. **Evidence-based scoring**: Every score must cite specific text from the skill. "Accuracy: 3/5" alone is invalid. "Accuracy: 3/5 — instructions say 'handle appropriately' on line 42 without defining what 'appropriate' means" is valid.
2. **Consistent criteria**: Apply the same rubric to every skill. Do not adjust expectations based on skill complexity.
3. **Actionable output**: Every finding must include a specific fix suggestion. "Needs improvement" is not actionable. "Replace 'handle errors' on line 15 with 'if error is network timeout, retry once; if auth error, report to user'" is.
4. **No false confidence**: If a file cannot be read or found, note the gap explicitly in the report rather than skipping it silently.

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
Check:
- [ ] SKILL.md exists with valid YAML frontmatter
- [ ] `name` is kebab-case, no reserved words
- [ ] `description` exists, <1024 chars, includes "Use when:" trigger info
- [ ] Body is <500 lines
- [ ] references/ files are appropriately sized (<200 lines each)
- [ ] agents/ have valid frontmatter (if agents/ exists)
- [ ] No orphaned files (files in references/ or agents/ not referenced by SKILL.md)

### Phase 3: Anti-Pattern Detection (per skill)

Load detection rules from (in order of preference):
1. `references/anti-patterns-detection.md` in this skill (canonical source)
2. skill-create's `references/anti-patterns.md` (if available at `~/.claude/skills/skill-create/references/anti-patterns.md` or `.claude/skills/skill-create/references/anti-patterns.md`)
3. If neither is found, proceed with structural validation only and note the gap

See `references/anti-patterns-detection.md` for the full AP table, severity classification, and detection notes.

For each detected anti-pattern, cite the specific line(s) and text that triggered detection.

### Phase 4: Quality Scoring (per skill)
Launch `skill-audit-scorer` agent to evaluate 5 axes.

If the scorer agent returns malformed JSON or no output: manually evaluate each axis
using the 1-5 definitions below, cite specific text from the skill as evidence,
then apply PASS/WARN/FAIL thresholds.

1. **Accuracy potential** (1-5): How likely is this skill to produce correct output?
   - 5: Every instruction is unambiguous with concrete examples
   - 3: Most instructions clear but some subjective judgment required
   - 1: Instructions are vague; output quality depends on luck

2. **Completeness** (1-5): Does the skill cover all necessary steps?
   - 5: All steps, edge cases, and error paths covered
   - 3: Happy path covered, some edge cases missing
   - 1: Major workflow steps missing

3. **Structure Quality** (1-5): Progressive Disclosure, file organization
   - 5: Clean separation (SKILL.md <300 lines, details in references/)
   - 3: Reasonable organization but some bloat
   - 1: Everything in one file, >500 lines

4. **Trigger Precision** (1-5): Description quality for auto-invocation
   - 5: Specific "Use when:" + "Do NOT use when:" + multilingual triggers
   - 3: Has trigger phrases but missing disambiguation
   - 1: Generic description, will false-trigger on many inputs

5. **Reusability** (1-5): Will this work for different inputs/contexts?
   - 5: Parameterized, handles multiple languages/frameworks/contexts
   - 3: Works for common cases, breaks on unusual inputs
   - 1: Hard-coded to a specific project or technology

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
- PASS: avg >= 4.0, no axis below 3.0, no critical anti-patterns (AP-1, AP-5, AP-6)
- WARN: avg >= 3.0 but has warnings or non-critical anti-patterns
- FAIL: avg < 3.0 or has critical structural errors or critical anti-patterns

## Detailed Results

### {{skill-name}}
**Path**: {{path}}
**Score**: {{avg}}/5.0

**Structural Validation**: {{PASS/FAIL}}
{{list of specific errors/warnings with line numbers}}

**Anti-Patterns Detected**: {{count}}
{{list with ID, severity, and cited evidence}}

**Quality Scores**:
| Axis | Score | Evidence |
|------|-------|----------|
| Accuracy | {{score}} | {{specific observation from skill text}} |
| Completeness | {{score}} | {{specific observation}} |
| Structure | {{score}} | {{specific observation}} |
| Trigger | {{score}} | {{specific observation}} |
| Reusability | {{score}} | {{specific observation}} |

**Recommended Actions** (priority order):
1. {{highest priority fix with specific instruction}}
2. {{next fix}}
3. {{next fix}}
```

### Phase 6: Improvement Suggestions
For each WARN/FAIL skill, suggest:
- Specific fixes for each detected issue (with line numbers and replacement text)
- Whether to use `/skill-create improve <path>` for automated improvement
- Whether to decompose into a Suite if too complex (AP-1 detected)

---

## Quick Audit Mode

If the user says "quick audit" or "簡易監査":
- Skip Phase 4 (quality scoring by agent)
- Only run structural validation + anti-pattern detection
- Faster, lower token cost

## Continuous Audit

If the user says "set up continuous audit" or "継続監査":
- Generate the following shell script (audit-hook.sh):

  ```bash
  #!/bin/bash
  SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
  for skill_dir in "$SKILLS_DIR"/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    echo "=== Auditing: $(basename "$skill_dir") ==="
    claude -p "audit skill $skill_dir"
  done
  ```

- Can be added as a git pre-commit hook or scheduled task
- Output: audit-hook.sh script
