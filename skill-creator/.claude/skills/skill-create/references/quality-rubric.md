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
Does the skill activate when it should and stay silent when it shouldn't?

| Score | Criteria |
|-------|----------|
| 1 | Never triggers or always triggers inappropriately |
| 2 | Triggers <30% of the time when it should |
| 3 | Triggers 50-70% correctly; some false positives/negatives |
| 4 | Triggers 80-90% correctly; rare false triggers |
| 5 | 95%+ trigger precision; excellent description quality |

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

### Grading Process
1. Read the eval case prompt and expected behavior
2. Read the actual output from the executor
3. Score each axis with evidence
4. Calculate average
5. Determine pass/fail
6. Suggest specific improvements for low-scoring axes

### Evidence Requirements
For each score, provide:
- Specific quotes or observations from the output
- What was expected vs what was produced
- Actionable improvement suggestion
