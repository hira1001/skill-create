#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/skill-create"
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

# Step 3: Install skill
echo "[3/3] Installing skill to ~/.claude/skills/..."
mkdir -p "$SKILL_DIR"
cp -r "$SCRIPT_DIR/.claude/skills/skill-create/"* "$SKILL_DIR/"
echo "  ✓ Skill installed to $SKILL_DIR"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Usage:"
echo "  /skill-create              - Start skill creation wizard"
echo "  /skill-create <doc.md>     - Create skill from document"
echo "  /skill-create improve <path> - Improve existing skill"
echo ""
echo "MCP tools available: validate_skill, generate_eval_set, run_eval,"
echo "  get_loop_state, update_loop_state, install_skill"
