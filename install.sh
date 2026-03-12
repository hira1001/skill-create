#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_CREATE_DIR="$HOME/.claude/skills/skill-create"
SKILL_AUDIT_DIR="$HOME/.claude/skills/skill-audit"
MCP_DIR="$SCRIPT_DIR/mcp-server"

echo "=== Skill Creator Installer ==="
echo ""

# Step 1: Build MCP server
echo "[1/3] Building MCP server..."
cd "$MCP_DIR"
npm install --silent
npx tsc
echo "  ✓ MCP server built"

# Step 2: Register MCP server
echo "[2/3] Registering MCP server with Claude..."
MCP_ENTRY="$MCP_DIR/dist/index.js"
claude mcp add --scope user skill-creator-server node "$MCP_ENTRY" 2>/dev/null || {
  echo "  ⚠ MCP registration failed. You may need to register manually:"
  echo "  claude mcp add --scope user skill-creator-server node $MCP_ENTRY"
}
echo "  ✓ MCP server registered"

# Step 3: Install skills
echo "[3/3] Installing skills to ~/.claude/skills/..."
mkdir -p "$SKILL_CREATE_DIR"
cp -r "$SCRIPT_DIR/.claude/skills/skill-create/"* "$SKILL_CREATE_DIR/"
echo "  ✓ skill-create installed to $SKILL_CREATE_DIR"

mkdir -p "$SKILL_AUDIT_DIR"
cp -r "$SCRIPT_DIR/.claude/skills/skill-audit/"* "$SKILL_AUDIT_DIR/"
echo "  ✓ skill-audit installed to $SKILL_AUDIT_DIR"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Skills installed:"
echo "  /skill-create              - Create, improve, and compose skills"
echo "  /skill-audit               - Audit skill quality and structure"
echo ""
echo "Usage:"
echo "  /skill-create              - Start skill creation wizard"
echo "  /skill-create <doc.md>     - Create skill from document"
echo "  /skill-create improve <path> - Improve existing skill"
echo "  /skill-audit               - Audit all installed skills"
echo "  /skill-audit <path>        - Audit a specific skill"
echo ""
echo "MCP tools available: validate_skill, generate_eval_set, run_eval,"
echo "  get_loop_state, update_loop_state, install_skill"
