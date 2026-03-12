import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { LoopState } from "../schemas/loop-state.js";
import { INITIAL_LOOP_STATE } from "../schemas/loop-state.js";

export function getLoopState(skillPath: string): LoopState {
  const statePath = join(skillPath, ".agent", "loop-state.json");

  if (!existsSync(statePath)) {
    const skillMdPath = join(skillPath, "SKILL.md");
    let skillName = "unknown";

    if (existsSync(skillMdPath)) {
      const content = readFileSync(skillMdPath, "utf-8");
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      if (nameMatch) skillName = nameMatch[1].trim();
    }

    return {
      ...INITIAL_LOOP_STATE,
      skill_name: skillName,
      skill_path: skillPath,
      started_at: new Date().toISOString(),
    };
  }

  return JSON.parse(readFileSync(statePath, "utf-8"));
}
