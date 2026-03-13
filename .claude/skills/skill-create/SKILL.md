---
name: skill-create
description: |
  Create, improve, and compose Claude Code skills autonomously with iterative quality improvement.
  Use when: "スキルを作りたい", "create a skill", "improve skill", "スキル改善",
  "skill suite", "スキル分解", "この作業をスキル化", "convert workflow to skill",
  "make a development agent", "スキルを作って", "create a new skill from",
  "build a skill that", "improve this skill", "optimize skill".
---

# Skill Creator

Create, improve, and compose Claude Code skills with autonomous iterative quality improvement.
Uses MCP server (`skill-creator-server`) for deterministic operations and subagents for reasoning.

## Critical Rules

1. **One job per skill**: A skill does exactly one thing. If the description needs "and" to explain it, split into a suite.
2. **No vague instructions**: Every instruction in a generated skill must be concrete and executable. Ban phrases: "handle appropriately", "make it good", "ensure quality", "process as needed". Replace with specific actions.
3. **Progressive Disclosure**: SKILL.md body stays under 300 lines. Detailed specs, examples, and schemas go in references/. Complex reasoning goes in agents/.
4. **Test before ship**: No skill is installed without passing the improvement loop. Skip only if user explicitly says "skip tests".
5. **Trigger precision**: The description must include exact "Use when:" phrases AND "Do NOT use when:" disambiguation. Generic descriptions cause false triggers.

## Mode Selection

Analyze the user's input and select the appropriate mode:

| Signal | Mode |
|--------|------|
| Existing skill path provided | **D: Improve** |
| "suite", "multiple skills", "大きな開発" | **E: Suite Design** |
| Document, procedure, spec provided | **A: Document-Driven** |
| Example output, artifact, template | **B: Artifact-Driven** |
| Video, screenshot, "observe", "record" | **C: Observation-Driven** |
| Ambiguous or minimal input | Ask user for clarification |

If the user just types `/skill-create` with no arguments, ask:
"What kind of skill do you want to create? You can provide:
- A document or procedure to convert into a skill
- An example of desired output to reverse-engineer
- A video or screenshots of a workflow to capture
- An existing skill path to improve
- A large goal to decompose into a skill suite"

---

## Mode A: Document-Driven

**Input**: Instructions, docs, procedures, specs
**Output**: Completed skill in `~/.claude/skills/`

### Steps
1. **Extract** from the input document:
   - Purpose (1 sentence: what does this skill achieve?)
   - Trigger conditions (when should it activate? when should it NOT?)
   - Steps (sequential procedure with numbered, imperative instructions)
   - Constraints and quality criteria (measurable, not subjective)
   - Input/output types with concrete examples

2. **Size check**: If the procedure needs >500 lines of instructions:
   - Switch to Mode E (Suite Design) to split into multiple skills
   - Ask user to confirm

3. **Generate draft** using template from `references/templates/single-skill.md`:
   - Write SKILL.md with frontmatter (name, description with "Use when:" AND "Do NOT use when:")
   - Write references/ files for detailed specs, examples, schemas
   - Validate with MCP: `validate_skill(skill_path)`

4. **Run autonomous improvement loop** (see below)

---

## Mode B: Artifact-Driven

**Input**: Desired output examples (code, reports, slides, configs)
**Output**: Skill that reproduces similar outputs

### Steps
1. **Analyze** the artifact:
   - Structure patterns (sections, hierarchy, ordering)
   - Style patterns (tone, formatting, naming conventions)
   - Quality characteristics (what makes this "good"? — identify specific, measurable attributes)
   - Variable vs fixed parts (what changes between instances?)
   - Implicit rules (unstated conventions the artifact follows)

2. **Reverse-engineer** the process:
   - What steps would produce this artifact?
   - What decisions were made along the way?
   - What inputs are needed?

3. **Generate draft**:
   - SKILL.md: Generation instructions with measurable quality criteria
   - references/: Artifact structure template + annotated example

4. **Reproduction test**: Use a subagent to run the skill on a new input, compare output structure with original artifact. Feed structural differences into the improvement loop.

5. **Run autonomous improvement loop**

---

## Mode C: Observation-Driven

**Input**: Video, screenshots, or live work session
**Output**: Skill that reproduces the observed workflow

### Input Methods
- **Visual input**: User provides video or screenshot series
  → Analyze each frame/step, extract the workflow
- **Live recording**: "I'll work now, record what I do"
  → Track tool usage, file operations, decision points in `.agent/session-log.md`
- **Post-hoc description**: User describes what they did
  → Interview to extract detailed steps

### Steps
1. **Record/analyze** the workflow
2. **Extract patterns**:
   - Repeated operations → parameterize these
   - Decision branches (if-then) → document as conditional steps
   - Variable parts → make these skill inputs
   - Error handling patterns → include in skill error handling section
3. **Filter**: Remove trial-and-error, keep only the final working path
4. **Generate draft** → **Run improvement loop**

---

## Mode D: Improve

**Input**: Path to existing skill
**Output**: Improved skill

### Steps
1. **Read** all skill files: SKILL.md, agents/, references/, scripts/

2. **Validate structure**: MCP `validate_skill(skill_path)`

3. **Evaluate quality**: Score the skill against `references/quality-rubric.md`:
   - Accuracy, Completeness, Structure Quality, Trigger Precision, Reusability
   - For each axis, cite specific evidence from the skill (not just a number)

4. **Diagnose issues** against `references/anti-patterns.md`:
   - Check each of the 12 anti-patterns (AP-1 through AP-12)
   - For each detected anti-pattern, note the specific location and text

5. **Generate improvement plan**: Focus on weakest axis first, max 5 changes per iteration
   - Each change must be specific: "Replace lines 42-45 with X" not "improve the instructions"

6. **Apply improvements** → **Run improvement loop** to verify quality increased

---

## Mode E: Suite Design

**Input**: Large goal (e.g., "development agent", "CI/CD automation")
**Output**: Multiple coordinated skills + orchestrator

### Steps
1. **Decompose goal**: Launch `skill-decomposer` agent
   - Map all required capabilities
   - Group into skills (each <300 lines body, 1 responsibility)
   - Design dependency graph (sequential/parallel/merge)
   - Define data contracts between skills (JSON schemas with required fields)

2. **Review decomposition** with user:
   - Show skill list, dependency graph, data flow
   - Ask for feedback before proceeding

3. **Generate orchestrator** using `references/templates/suite-orchestrator.md`

4. **Generate member skills in parallel**:
   - Use Agent Teams: one agent per skill, all running Mode A
   - Independent skills run in parallel
   - Dependent skills wait for their prerequisites

5. **Integration test**: Run the orchestrator end-to-end
   - Verify data passes correctly between skills
   - Check all member skills produce expected output

6. **Run improvement loop** on each skill + orchestrator

7. **Generate documentation**: Launch `skill-doc-generator` agent
   - Suite overview with dependency diagram
   - Individual skill docs with trigger examples

8. **Install**: MCP `install_skill()` for each skill to `~/.claude/skills/`

---

## Autonomous Improvement Loop

Applied after every mode's draft generation. This is the core differentiator.

### Phase 1: Generate Test Cases
- Design 5 should_trigger + 5 should_not_trigger test prompts
- For each should_trigger case: define expected behavior and specific evaluation criteria
- For code-generation skills: include execution test cases with expected output
- Save via MCP: `generate_eval_set(skill_path, 10)`
- Fill in ALL placeholders in the generated template with actual test content — no [TODO] markers left

### Phase 2: Execute Tests
- MCP: `run_eval(skill_path, eval_set_path, parallel=3)`
- Spawns `claude -p` subprocesses in parallel
- Captures trigger detection + full output

### Phase 3: Grade Outputs
- Launch `skill-grader` agent for each test result (parallel via Agent Teams)
- Grader scores 5 axes using `references/quality-rubric.md`
- Each score must include specific evidence justifying the rating
- Collect all grading results

### Phase 4: Analyze & Improve
- Launch `skill-analyzer` agent with all grading results
- Analyzer identifies patterns across failures
- Generates prioritized improvements (max 5 per iteration)
- Each improvement must be a concrete edit, not a general suggestion
- Apply improvements to SKILL.md and references/

### Phase 5: Convergence Check
- MCP: `update_loop_state(skill_path, scores)`
- Continue if:
  - Average score < 4.0 OR min axis < 3.0
  - AND improvement detected in last iteration (at least one axis score increased)
  - AND iteration count < 5
- Stop if:
  - Quality threshold met (avg >= 4.0, min >= 3.0) → **Success**
  - No improvement for 2 consecutive iterations → **Converged**
  - Max 5 iterations reached → **Timeout**

### On Convergence Without Quality
If the loop stops but quality is below threshold:
1. First: Try decomposition via `skill-decomposer` (split the skill)
2. If decomposition also fails: Escalate to user with specific issues:
   "The following quality issues could not be resolved automatically:
   - [issue list with current scores and what was tried]
   Please adjust the requirements or provide more detailed instructions."

### On Success
1. Launch `skill-doc-generator` to create README.md
2. MCP: `install_skill(skill_path, "global")` to copy to `~/.claude/skills/`
3. Report: "Skill installed. Trigger with: /{{name}} or say '{{trigger phrase}}'"

---

## Quality Reference (Quick)

See `references/quality-rubric.md` for full rubric. Quick thresholds:
- **Pass**: avg >= 4.0 across 5 axes, no axis below 3.0
- **5 axes**: Accuracy, Completeness, Structure, Trigger Precision, Reusability

See `references/anti-patterns.md` for common mistakes to avoid.
See `references/best-practices.md` for positive patterns to follow.
See `references/skill-structure.md` for structural requirements.
