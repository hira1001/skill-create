# Skill Anti-Patterns

Common mistakes when creating skills. Check your skill against this list.

## AP-1: Kitchen Sink Skill
**Problem**: One skill tries to do too many unrelated things.
**Symptom**: SKILL.md > 500 lines; description lists 5+ distinct capabilities.
**Fix**: Split into a Suite of focused skills.

## AP-2: Vague Description
**Problem**: Description doesn't specify WHEN to use the skill.
**Symptom**: Description only says what it does, not when to trigger.
**Fix**: Add explicit trigger phrases: "Use when: ..." with example user queries.

## AP-3: Keyword-Only Triggering
**Problem**: Description relies on naive keyword matching.
**Symptom**: Skill triggers on unrelated prompts containing the keyword.
**Fix**: Use semantic descriptions. Include should_not_trigger scenarios.

## AP-4: Inline Everything
**Problem**: All content in SKILL.md body, nothing in references/.
**Symptom**: Body > 500 lines; examples, schemas, templates all inline.
**Fix**: Move reference material to references/. Keep body for instructions only.

## AP-5: Ambiguous Instructions
**Problem**: Instructions use vague language ("make it good", "handle errors").
**Symptom**: Inconsistent outputs across different runs.
**Fix**: Use specific, imperative instructions with concrete criteria.

## AP-6: No Quality Criteria
**Problem**: Skill doesn't define what "success" looks like.
**Symptom**: No way to evaluate if output is correct.
**Fix**: Add explicit quality checks, expected output format, validation steps.

## AP-7: Context Assumption
**Problem**: Skill assumes specific context that may not exist.
**Symptom**: Fails when used in different projects or environments.
**Fix**: Check for required files/tools before executing. Provide fallbacks.

## AP-8: Output Format Drift
**Problem**: Output format varies between runs.
**Symptom**: Downstream consumers can't reliably parse the output.
**Fix**: Specify exact output format (JSON schema, markdown template, etc.).

## AP-9: No Error Path
**Problem**: Skill doesn't handle failures gracefully.
**Symptom**: Silent failures or cryptic errors.
**Fix**: Define what to do when dependencies are missing or operations fail.

## AP-10: Stale References
**Problem**: References files are outdated or inconsistent with SKILL.md.
**Symptom**: Skill produces output based on old specs.
**Fix**: Version-tag references. Update together with SKILL.md changes.

## AP-11: Over-Engineered Structure
**Problem**: Complex directory structures for simple skills.
**Symptom**: 10+ reference files for a skill that does one thing.
**Fix**: Start simple. Add structure only when needed.

## AP-12: Missing Test Coverage
**Problem**: Skill is never tested against realistic prompts.
**Symptom**: Works for the author's exact phrasing, fails for variations.
**Fix**: Create diverse eval set. Test with different phrasings and edge cases.
