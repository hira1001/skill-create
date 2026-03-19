import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { parseFrontmatter } from "../utils/parse-frontmatter.js";

interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    body_lines: number;
    has_frontmatter: boolean;
    has_references: boolean;
    has_agents: boolean;
    reference_files: number;
    agent_files: number;
  };
}

export function validateSkill(skillPath: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const stats = {
    body_lines: 0,
    has_frontmatter: false,
    has_references: false,
    has_agents: false,
    reference_files: 0,
    agent_files: 0,
  };

  const skillMdPath = join(skillPath, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    errors.push({
      field: "SKILL.md",
      message: "SKILL.md file not found",
      severity: "error",
    });
    return { valid: false, errors, warnings, stats };
  }

  const content = readFileSync(skillMdPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(content);

  // Frontmatter checks
  if (!frontmatter) {
    errors.push({
      field: "frontmatter",
      message: "YAML frontmatter is required (---\\n...\\n---)",
      severity: "error",
    });
  } else {
    stats.has_frontmatter = true;

    if (!frontmatter.name) {
      errors.push({
        field: "frontmatter.name",
        message: "name field is required",
        severity: "error",
      });
    } else {
      const name = frontmatter.name;
      if (name !== name.toLowerCase()) {
        errors.push({
          field: "frontmatter.name",
          message: `name must be lowercase: "${name}"`,
          severity: "error",
        });
      }
      if (!/^[a-z][a-z0-9-]*$/.test(name)) {
        errors.push({
          field: "frontmatter.name",
          message: `name must be kebab-case (letters, numbers, hyphens): "${name}"`,
          severity: "error",
        });
      }
      if (name.includes("claude") || name.includes("anthropic")) {
        errors.push({
          field: "frontmatter.name",
          message: `name must not contain reserved words (claude, anthropic): "${name}"`,
          severity: "error",
        });
      }
    }

    if (!frontmatter.description) {
      errors.push({
        field: "frontmatter.description",
        message: "description field is required",
        severity: "error",
      });
    } else {
      const desc = frontmatter.description;
      if (desc.length > 1024) {
        errors.push({
          field: "frontmatter.description",
          message: `description exceeds 1024 characters (${desc.length})`,
          severity: "error",
        });
      }
      if (desc.length < 20) {
        warnings.push({
          field: "frontmatter.description",
          message:
            "description is very short; include both what and when to trigger",
          severity: "warning",
        });
      }
    }
  }

  // Body checks
  const bodyLines = body.split("\n");
  stats.body_lines = bodyLines.length;

  if (bodyLines.length > 500) {
    warnings.push({
      field: "body",
      message: `body has ${bodyLines.length} lines (recommended <500). Consider moving content to references/`,
      severity: "warning",
    });
  }

  if (bodyLines.length < 10) {
    warnings.push({
      field: "body",
      message: "body is very short; skill may lack sufficient instructions",
      severity: "warning",
    });
  }

  // References directory check
  const refsDir = join(skillPath, "references");
  if (existsSync(refsDir)) {
    stats.has_references = true;
    try {
      const refFiles = readdirSync(refsDir, { recursive: true });
      stats.reference_files = refFiles.filter((f) => {
        const fPath = join(refsDir, f.toString());
        return existsSync(fPath) && statSync(fPath).isFile();
      }).length;
    } catch {
      // ignore read errors
    }
  }

  // Agents directory check
  const agentsDir = join(skillPath, "agents");
  if (existsSync(agentsDir)) {
    stats.has_agents = true;
    try {
      const agentFiles = readdirSync(agentsDir).filter((f) =>
        f.endsWith(".md")
      );
      stats.agent_files = agentFiles.length;

      for (const agentFile of agentFiles) {
        const agentContent = readFileSync(
          join(agentsDir, agentFile),
          "utf-8"
        );
        const { frontmatter: agentFm } = parseFrontmatter(agentContent);
        if (!agentFm) {
          warnings.push({
            field: `agents/${agentFile}`,
            message: "agent file missing YAML frontmatter",
            severity: "warning",
          });
        }
      }
    } catch {
      // ignore read errors
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings, stats };
}
