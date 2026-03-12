import {
  existsSync,
  mkdirSync,
  cpSync,
  readFileSync,
  readdirSync,
} from "fs";
import { join, basename } from "path";
import { homedir } from "os";

interface InstallResult {
  installed_path: string;
  files_copied: string[];
  target: string;
}

export function installSkill(
  skillPath: string,
  target: "global" | "project" = "global"
): InstallResult {
  const skillMdPath = join(skillPath, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found at ${skillMdPath}`);
  }

  // Extract skill name from frontmatter
  const content = readFileSync(skillMdPath, "utf-8");
  const nameMatch = content.match(/^name:\s*(.+)$/m);
  const skillName = nameMatch ? nameMatch[1].trim() : basename(skillPath);

  // Determine target directory
  const targetBase =
    target === "global"
      ? join(homedir(), ".claude", "skills", skillName)
      : join(process.cwd(), ".claude", "skills", skillName);

  // Create target directory
  if (!existsSync(targetBase)) {
    mkdirSync(targetBase, { recursive: true });
  }

  // Copy skill files (exclude .agent/ directory)
  const filesCopied: string[] = [];

  function copyDir(src: string, dest: string) {
    if (!existsSync(src)) return;
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".agent" || entry.name === "node_modules") continue;

      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        cpSync(srcPath, destPath);
        filesCopied.push(destPath);
      }
    }
  }

  copyDir(skillPath, targetBase);

  return {
    installed_path: targetBase,
    files_copied: filesCopied,
    target,
  };
}
