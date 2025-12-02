#!/bin/bash

# Claude Code hook to save user message transcripts
# Receives JSON via stdin with session_id and transcript_path

# Read hook input from stdin
hook_input=$(cat)

# Extract fields using jq
session_id=$(echo "$hook_input" | jq -r '.session_id')
transcript_path=$(echo "$hook_input" | jq -r '.transcript_path')
cwd=$(echo "$hook_input" | jq -r '.cwd')

# Define output directory (adjust as needed)
OUTPUT_DIR="/home/claude/repos/sophie-jarred-research-log/hooks/transcripts"

# Create timestamped filename
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# Log the event
echo "[$timestamp] Session: $session_id" >> "$OUTPUT_DIR/events.log"

# Copy the transcript if it exists
if [ -f "$transcript_path" ]; then
    # Save with session ID and timestamp
    cp "$transcript_path" "$OUTPUT_DIR/${session_id}_${timestamp}.json"
    echo "[$timestamp] Saved transcript to ${session_id}_${timestamp}.json" >> "$OUTPUT_DIR/events.log"
fi

# Exit successfully (don't block the prompt)
exit 0
