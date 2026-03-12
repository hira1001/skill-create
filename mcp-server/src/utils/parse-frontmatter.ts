/**
 * Parse YAML frontmatter from a markdown file.
 * Returns key-value pairs from the frontmatter and the body content.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, string> | null;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };

  const fm: Record<string, string> = {};
  const lines = match[1].split("\n");
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) fm[currentKey] = currentValue.trim();
      currentKey = keyMatch[1];
      currentValue = keyMatch[2].replace(/^\|$/, "");
    } else if (currentKey && line.startsWith("  ")) {
      currentValue += " " + line.trim();
    }
  }
  if (currentKey) fm[currentKey] = currentValue.trim();

  return { frontmatter: fm, body: match[2] };
}
