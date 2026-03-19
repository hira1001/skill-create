# Skill Quality Rubric (5 Axes × 5 Levels)

Use this rubric when grading skill output quality. Score each axis 1-5.

## Axis 1: Accuracy (正確性)
Does the output match what the skill promises?

| Score | Criteria |
|-------|----------|
| 1 | Output is irrelevant or contradicts instructions |
| 2 | Partially correct but with significant errors |
| 3 | Mostly correct, minor inaccuracies |
| 4 | Correct with only trivial issues |
| 5 | Perfectly accurate, matches all specifications |

## Axis 2: Completeness (完全性)
Are all required elements present?

| Score | Criteria |
|-------|----------|
| 1 | Major required elements missing |
| 2 | Some required elements present, significant gaps |
| 3 | All required elements present, supplementary info lacking |
| 4 | Comprehensive coverage with minor omissions |
| 5 | All elements present with thorough supplementary detail |

## Axis 3: Structure Quality (構造品質)
Is the skill properly structured per conventions?

| Score | Criteria |
|-------|----------|
| 1 | Missing frontmatter or fundamentally broken structure |
| 2 | Frontmatter exists but incomplete; body disorganized |
| 3 | Valid structure; body <500 lines; basic organization |
| 4 | Good Progressive Disclosure; references/ used well |
| 5 | Exemplary structure; perfect layering; clean separation |

## Axis 4: Trigger Precision (トリガー精度)
Is the description precise enough to activate exactly when intended?

| Score | Criteria |
|-------|----------|
| 1 | No trigger info; description is a generic summary with no "Use when:" |
| 2 | Has trigger phrases but no "Do NOT use when:"; will false-trigger on adjacent topics |
| 3 | Has both clauses but phrases are generic; overlaps with similar skills |
| 4 | Clear trigger phrases in multiple languages; "Do NOT use when:" names specific alternatives |
| 5 | Specific multilingual phrases; "Do NOT use when:" redirects explicitly; no ambiguous overlap with sibling skills |

## Axis 5: Reusability (再利用性)
Does the skill produce consistent quality across different inputs?

| Score | Criteria |
|-------|----------|
| 1 | Only works for one specific input |
| 2 | Works for a narrow range of similar inputs |
| 3 | Handles common variations; fails on edge cases |
| 4 | Handles most variations including edge cases |
| 5 | Robust across all reasonable inputs; graceful degradation |

## Scoring Guidelines

### Passing Threshold
- Individual test case: average score ≥ 3.0
- Overall skill: all-axis average ≥ 4.0 AND minimum axis ≥ 3.0

### Scoring Process
1. Read all skill files: SKILL.md, references/, agents/
2. Score each axis with evidence cited from the skill text
3. Calculate average
4. Determine pass/fail
5. Suggest specific improvements for low-scoring axes

### Evidence Requirements
For each score, provide:
- Specific quotes or observations from the output
- What was expected vs what was produced
- Actionable improvement suggestion
