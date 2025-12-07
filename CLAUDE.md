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
Located at `ship-december/day-5/vscode-extension/` - provides commands for managing the research log.

**Commands:**
- `New Day` - Context menu command that duplicates the most recent day folder
- `Toggle Card Encryption` - Encrypts/decrypts the card at cursor position

**Development:**
```bash
cd ship-december/day-5/vscode-extension
npm install
npm run compile    # Compile TypeScript + copy shared lib
npm run watch      # Watch mode for both TS and lib changes
npm run publish    # Package and install the extension
```

**Shared Library:**
The extension uses `lib/cards.js` from the parent day-5 folder. This lib is shared with `index.js` and `md-to-cards.js`. During build/watch, it's copied to `out/lib/` since the extension can't reference files outside its package at runtime.

### Shared Card Library (`day-5/lib/cards.js`)

A shared library for parsing markdown into "cards" - sections separated by `- - -` with optional user/time headers.

**Used by:**
- `day-5/index.js` - Cloudflare Pages function (imports directly)
- `day-5/md-to-cards.js` - CLI tool (imports directly)
- `day-5/vscode-extension` - VS Code extension (copied to `out/lib/` at build time)

**Card Format:**
```markdown
*[ User time ]*

Card content here...

- - -

*[ AnotherUser 2.30pm ]*

Next card...
```

Headers can be `[ User time ]` or `*[ User time ]*` (with asterisks for italic rendering).

**Exports:**
- `CARD_SEPARATOR` - Regex for `\n- - -\n`
- `CARD_HEADER_REGEX` - Matches card headers
- `ENCRYPTED_MARKER` / `UNENCRYPTE_MARKER` - Encryption markers
- `parseCardHeader(line)` - Extract user/time from header
- `mdToCards(content, filePath)` - Convert markdown to card array
- `findCardAtPosition(text, cursorLine)` - Find card at line (for VS Code)

### Card Encryption

Cards can be encrypted for private content that shouldn't be publicly visible.

**Encrypted card format:**
```markdown
[ User time ]
[Encrypted]

<base64 IV>:<base64 encrypted content>
```

**Decrypted (editing) format:**
```markdown
[Unencrypte]
[ User time ]

Decrypted content here...
```

**VS Code workflow:**
1. Place cursor in a card
2. Run "Toggle Card Encryption" command
3. If no password in `.env`, prompts and saves as `ENCRYPTION_PASSWORD`
4. Encrypts content, adds `[Encrypted]` marker
5. Toggle again to decrypt (adds `[Unencrypte]` marker as reminder to re-encrypt)

**Git pre-commit hook:**
The `.git/hooks/pre-commit` hook blocks commits containing `[Unencrypte]` markers, preventing accidental commits of decrypted private content.

**Front-end decryption:**
- Encrypted cards show user + "Decrypt" button (content hidden)
- Password modal with "Save password" and "Auto-decrypt" checkboxes
- Passwords stored per-user in localStorage
- Auto-decrypt on page load for saved users

**Encryption details:**
- AES-256-CBC with PBKDF2 key derivation (100k iterations, SHA-256)
- Compatible between Node.js (VS Code) and Web Crypto API (browser)
