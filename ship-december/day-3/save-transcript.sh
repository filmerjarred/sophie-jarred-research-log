#!/bin/bash

# Claude Code hook to append human-readable messages to transcript
# Receives JSON via stdin with prompt field containing the current message

# Read hook input from stdin
hook_input=$(cat)

# Extract the prompt (current message) directly from hook input
prompt=$(echo "$hook_input" | jq -r '.prompt')

# Define output file
OUTPUT_FILE="/home/claude/repos/sophie-jarred-research-log/ship-december/day-3/appendices/jarred-claude-code-transcript.md"

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
