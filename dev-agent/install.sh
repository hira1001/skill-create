#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/.claude/skills"
SKILLS_DST="$HOME/.claude/skills"

echo "=== Dev Agent Installer ==="
echo ""

mkdir -p "$SKILLS_DST"

installed=0
for skill_dir in "$SKILLS_SRC"/*/; do
  skill_name="$(basename "$skill_dir")"
  mkdir -p "$SKILLS_DST/$skill_name"
  cp -r "$skill_dir"* "$SKILLS_DST/$skill_name/"
  echo "  ✓ $skill_name"
  installed=$((installed + 1))
done

echo ""
echo "=== Installation Complete ==="
echo ""
echo "$installed skills installed:"
echo ""
echo "  /dev-agent               - Autonomous multi-phase development workflow"
echo "  /dev-agent-context       - Analyze project structure and conventions"
echo "  /dev-agent-arch          - Plan implementation / analyze architecture"
echo "  /dev-agent-fix           - Apply targeted bug fixes"
echo "  /dev-agent-generate      - Generate new features and components"
echo "  /dev-agent-refactor      - Refactor code structure"
echo "  /dev-agent-review        - Review code for issues"
echo "  /dev-agent-test          - Generate comprehensive tests"
echo "  /dev-agent-validate      - Run compile, lint, and test checks"
echo "  /dev-agent-diagnose      - Investigate bugs and errors"
echo "  /dev-agent-docs          - Generate/update documentation"
echo ""
