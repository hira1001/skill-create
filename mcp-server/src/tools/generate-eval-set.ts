import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import type { EvalSet } from "../schemas/eval-set.js";

function parseFrontmatter(content: string): {
  name: string;
  description: string;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { name: "", description: "", body: content };

  let name = "";
  let description = "";
  const lines = match[1].split("\n");
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (keyMatch) {
      if (currentKey === "name") name = currentValue.trim();
      if (currentKey === "description") description = currentValue.trim();
      currentKey = keyMatch[1];
      currentValue = keyMatch[2].replace(/^\|$/, "");
    } else if (currentKey && line.startsWith("  ")) {
      currentValue += " " + line.trim();
    }
  }
  if (currentKey === "name") name = currentValue.trim();
  if (currentKey === "description") description = currentValue.trim();

  return { name, description, body: match[2] };
}

export function generateEvalSetTemplate(
  skillPath: string,
  count: number = 10
): { eval_set_path: string; eval_set: EvalSet } {
  const skillMdPath = join(skillPath, "SKILL.md");
  const content = readFileSync(skillMdPath, "utf-8");
  const { name, description, body } = parseFrontmatter(content);

  const shouldTriggerCount = Math.ceil(count / 2);
  const shouldNotTriggerCount = count - shouldTriggerCount;

  const cases = [];

  // Generate should_trigger template cases
  for (let i = 1; i <= shouldTriggerCount; i++) {
    cases.push({
      id: `trigger-${i}`,
      prompt: `[TODO: Add a prompt that SHOULD trigger "${name}"]`,
      expected_behavior: `[TODO: Describe expected output when skill is active]`,
      evaluation_criteria: [
        "[TODO: Criterion 1 - What must be true about the output]",
        "[TODO: Criterion 2 - Quality check]",
      ],
      should_trigger: true,
      test_type: "quality" as const,
    });
  }

  // Generate should_not_trigger template cases
  for (let i = 1; i <= shouldNotTriggerCount; i++) {
    cases.push({
      id: `no-trigger-${i}`,
      prompt: `[TODO: Add a prompt that should NOT trigger "${name}"]`,
      expected_behavior: `Skill should not activate. Normal Claude response expected.`,
      evaluation_criteria: [
        `Skill "${name}" must not be invoked`,
        "Response should be a normal Claude reply",
      ],
      should_trigger: false,
      test_type: "trigger" as const,
    });
  }

  const evalSet: EvalSet = {
    skill_name: name,
    skill_path: skillPath,
    created_at: new Date().toISOString(),
    cases,
  };

  // Save to .agent/evals/
  const agentDir = join(skillPath, ".agent", "evals");
  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
  }
  const evalSetPath = join(agentDir, "eval-set.json");
  writeFileSync(evalSetPath, JSON.stringify(evalSet, null, 2));

  return { eval_set_path: evalSetPath, eval_set: evalSet };
}
