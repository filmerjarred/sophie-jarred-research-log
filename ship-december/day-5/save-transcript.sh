#!/bin/bash

# Claude Code hook to append human-readable messages to transcript
# Receives JSON via stdin with prompt field containing the current message

# Read hook input from stdin
hook_input=$(cat)

# Extract the prompt (current message) directly from hook input
prompt=$(echo "$hook_input" | jq -r '.prompt')

# Base directory
REPO_DIR="/home/claude/repos/sophie-jarred-research-log"
SHIP_DIR="$REPO_DIR/ship-december"

# Find the latest day folder
LATEST_DAY=$(ls -1d "$SHIP_DIR"/day-* 2>/dev/null | sort -V | tail -1)
if [ -z "$LATEST_DAY" ]; then
    exit 0
fi

# Load user from .env file, default to "user"
USER_NAME="user"
if [ -f "$REPO_DIR/.env" ]; then
    ENV_USER=$(grep -E "^USER=" "$REPO_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$ENV_USER" ]; then
        USER_NAME="$ENV_USER"
    fi
fi

# Define output file
OUTPUT_FILE="$LATEST_DAY/appendices/${USER_NAME}-claude-code-transcript.md"

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Get current timestamp in 12-hour format (e.g., "9:30am")
timestamp=$(date +"%-I:%M%P")

# Append the message if we have one
if [ -n "$prompt" ] && [ "$prompt" != "null" ]; then
    echo "" >> "$OUTPUT_FILE"
    echo "**[$timestamp]** $prompt" >> "$OUTPUT_FILE"
fi

# Exit successfully (don't block the prompt)
exit 0
