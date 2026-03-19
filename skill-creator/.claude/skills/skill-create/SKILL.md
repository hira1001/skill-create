---
name: skill-create
description: |
  Create, improve, and compose Claude Code skills with high quality.
  Use when: "スキルを作りたい", "create a skill", "improve skill", "スキル改善",
  "skill suite", "スキル分解", "この作業をスキル化", "convert workflow to skill",
  "make a development agent", "スキルを作って", "create a new skill from",
  "build a skill that", "improve this skill", "optimize skill".
  Do NOT use when: user wants to audit/review existing skills (use skill-audit).
---

# Skill Creator

Create, improve, and compose Claude Code skills.

## Critical Rules

1. **One job per skill**: A skill does exactly one thing. If the description needs "and" to explain it, split into a suite.
2. **No vague instructions**: Ban: "handle appropriately", "make it good", "ensure quality", "process as needed". Replace with specific, executable actions.
3. **Progressive Disclosure**: SKILL.md body ≤300 lines. Details go in references/. Complex reasoning goes in agents/.
4. **Trigger precision first**: Every skill needs "Use when:" AND "Do NOT use when:". Verify with 3 should-trigger + 3 should-not-trigger cases before shipping.
5. **Generate → Critique → Improve → Ship**: One self-critique pass, max 5 targeted fixes, then install.

## Mode Selection

| Signal | Mode |
|--------|------|
| Existing skill path | **D: Improve** |
| "suite", "multiple skills", large goal | **E: Suite Design** |
| Document, procedure, spec | **A: Document-Driven** |
| Example output, artifact | **B: Artifact-Driven** |
| Video, screenshots, observed workflow | **C: Observation-Driven** |
| Ambiguous | Ask for clarification |

If `/skill-create` with no arguments, ask:
> "What kind of skill do you want to create? Provide: a document/procedure to convert, an example output to reverse-engineer, a video/screenshots of a workflow, an existing skill path to improve, or a large goal to decompose into a suite."

---

## Mode A: Document-Driven

**Input**: Instructions, docs, procedures, specs
**Output**: Completed skill in `~/.claude/skills/`

1. **Extract** from the input:
   - Purpose (1 sentence)
   - Trigger conditions: when to activate, when NOT to
   - Steps (numbered, imperative)
   - Constraints and quality criteria (measurable, not subjective)
   - Input/output types with concrete examples

2. **Size check**: If the procedure needs >500 lines of instructions → switch to Mode E, confirm with user

3. **Draft** using `references/templates/single-skill.md`:
   - SKILL.md with frontmatter (name, description with "Use when:" AND "Do NOT use when:")
   - references/ files for detailed specs, examples, schemas

4. **Self-Critique Pass** (see below)

5. **Install**: `cp -r <skill_dir> ~/.claude/skills/<name>/`

---

## Mode B: Artifact-Driven

**Input**: Desired output examples (code, reports, configs)
**Output**: Skill that reproduces similar outputs

1. **Analyze** the artifact:
   - Structure and style patterns
   - Quality characteristics (specific and measurable)
   - Variable vs fixed parts

2. **Reverse-engineer**: What steps would produce this? What inputs are needed?

3. **Draft**: SKILL.md with generation instructions + references/ with annotated example

4. **Self-Critique Pass**

5. **Install**

---

## Mode C: Observation-Driven

**Input**: Video, screenshots, or live session
**Output**: Skill capturing the observed workflow

1. **Record/analyze** the workflow
2. **Extract**: repeated operations → parameterize; decision branches → conditional steps; filter out trial-and-error
3. **Draft** → **Self-Critique Pass** → **Install**

---

## Mode D: Improve

**Input**: Path to existing skill
**Output**: Improved skill

1. **Read** all skill files: SKILL.md, agents/, references/
2. **Self-Critique Pass** on the existing skill
3. **Apply top 5 improvements**, weakest axis first
4. Confirm with user before overwriting an installed skill

---

## Mode E: Suite Design

**Input**: Large goal
**Output**: Multiple coordinated skills + orchestrator

1. **Decompose**: Launch `skill-decomposer` agent
   - Map all required capabilities
   - Group into skills (each ≤300 lines body, 1 responsibility)
   - Design dependency graph (sequential/parallel/merge)
   - Define data contracts between skills

2. **Review** with user: skill list, dependency graph, data flow — confirm before proceeding

3. **Generate orchestrator** using `references/templates/suite-orchestrator.md`

4. **Generate member skills in parallel**: one agent per skill, each runs Mode A using `references/templates/suite-member.md`

5. **Integration check**: verify data passed between skills matches their contracts

6. **Docs**: Launch `skill-doc-generator` agent

7. **Install**: `cp -r` each skill to `~/.claude/skills/`

---

## Self-Critique Pass

Run this after every draft. One pass. Max 5 fixes total.

### Check 1: Trigger Precision (highest priority)

State explicitly:
- 3 prompts that SHOULD trigger this skill
- 3 prompts that should NOT trigger this skill

For each of the 6: does the current description handle it correctly?
→ Fix: rewrite "Use when:" / "Do NOT use when:" clauses until all 6 pass.

### Check 2: Instruction Concreteness

Scan for vague phrases (AP-5 in `references/anti-patterns.md`):
"handle appropriately", "make it good", "ensure quality", "as needed", "properly", "appropriately"
→ Fix: replace each with a specific, executable instruction that leaves no room for interpretation.

### Check 3: Failure Mode Coverage

Identify the 3 most likely ways an agent following this skill would produce a wrong result.
→ Fix: add an explicit guard, fallback, or constraint for each failure mode.

### Check 4: Structure Compliance

- Body >300 lines? → move detailed content to references/
- Any references/ file >200 lines? → split it
- Worst anti-pattern from AP-1..AP-12? → fix it

### Apply

Apply the top 5 highest-impact fixes from checks 1–4.
Priority order: trigger precision > vague instructions > failure coverage > structure.
Do NOT apply more than 5 changes — over-correction degrades quality.

### On Completion

1. Launch `skill-doc-generator` to create README.md
2. Install: `cp -r <skill_dir> ~/.claude/skills/<name>/`
3. Report: "Installed: `~/.claude/skills/{{name}}/` — trigger with `/{{name}}` or '{{top trigger phrase}}'"

---

## Quality Reference

See `references/quality-rubric.md` for full 5-axis rubric.
**Pass bar**: avg ≥ 4.0 across all axes, no axis below 3.0
**5 axes**: Accuracy, Completeness, Structure Quality, Trigger Precision, Reusability

See `references/anti-patterns.md` for AP-1..AP-12.
See `references/best-practices.md` for positive patterns to follow.
See `references/skill-structure.md` for structural requirements.
