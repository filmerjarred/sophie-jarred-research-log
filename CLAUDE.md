# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a research log for "Ship December" - a daily shipping project where Sophie and Jarred document their progress building things with AI. The site is a static blog with markdown posts compiled to HTML.

## Commands

```bash
# Build all days
npm run build

# Development server with watch mode (HTTPS on port 3000)
npm run dev

# Build a specific day (from its directory)
node build.js
```

## Architecture

### Build System
- Root `build.js` discovers and runs `build.js` in each `ship-december/day-*` folder
- Root `watch.js` runs the dev server and watches for changes, auto-rebuilding
- Each day has its own `build.js` that converts `post.md` → `index.html` using `marked`
- Day 1 uses a simpler template; Day 3+ uses a more complex template with sidebar navigation

### Directory Structure
```
ship-december/
  day-1/          # Simple markdown-to-HTML build
  day-2/          # Added AI voice assistant experiments
  day-3/          # Added sidebar, appendices system, VS Code extension
  day-4/          # Current day
```

### Day Template (day-3+)
Each day folder contains:
- `post.md` - Main content in markdown
- `build.js` - Compiles post.md to index.html with sidebar
- `appendices/` - Optional folder for supplementary materials (shown in sidebar)
- `sophie-margin.md` - Sophie's margin notes

### Key Features
- Sidebar navigation auto-discovers all days and their appendices
- Appendices are displayed in a modal when clicked
- Mobile-responsive with swipe-to-expand sidebar
- Claude Code hook saves transcripts to appendices (configured in `.claude/settings.json`)

### VS Code Extension
Located at `ship-december/day-3/vscode-extension/` - adds a "New Day" context menu command that duplicates the most recent day folder.
