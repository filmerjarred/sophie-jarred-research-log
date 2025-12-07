/**
 * Shared card parsing logic for ship-december
 *
 * Cards are sections of markdown separated by `\n- - -\n`
 * Each card can have a user/time header in the format:
 *   [ User time ] or *[ User time ]*
 *
 * Used by:
 *   - index.js (Cloudflare function)
 *   - md-to-cards.js (CLI tool)
 *   - vscode-extension (copied to out/lib/ at build time)
 */

// Card separator - splits markdown into individual cards
export const CARD_SEPARATOR = /\n- - -\n/;

// Matches card headers: [ User time ] or *[ User time ]*
// Captures: user (required), time (optional)
// Examples: [ Jarred 10.30am ], *[ Sophie ]*, [ Jarred day-5 2.15pm ]
export const CARD_HEADER_REGEX = /^\*?\[\s*([A-Za-z]+)(?:\s+([^\]]+))?\s*\]\*?$/;

// Same as above but for matching within content (multiline)
export const CARD_HEADER_REGEX_MULTILINE = /^\*?\[\s*([A-Za-z]+)(?:\s+([^\]]+))?\s*\]\*?$/m;

// Encryption markers
export const ENCRYPTED_MARKER = '[Encrypted]';
export const UNENCRYPTED_MARKER = '[Unencrypted]';

// Regex to match markers - negative lookbehind to exclude escaped versions like \[Encrypted]
export const ENCRYPTED_MARKER_REGEX = /(?<!\\)\[Encrypted\]/;
export const UNENCRYPTED_MARKER_REGEX = /(?<!\\)\[Unencrypted\]/;

/**
 * Parse a single card header line to extract user and time
 * @param {string} line - The header line to parse
 * @returns {{ user: string, time: string | null } | null}
 */
export function parseCardHeader(line) {
   const match = line.trim().match(CARD_HEADER_REGEX);
   if (!match) return null;
   return {
      user: match[1],
      time: match[2] ? match[2].trim() : null
   };
}

/**
 * Convert markdown content to an array of cards
 * @param {string} content - The markdown content
 * @param {string} [filePath=''] - Optional file path for reference
 * @returns {Array<{
 *    title: string | null,
 *    user: string | null,
 *    time: string | null,
 *    content: string,
 *    file: string,
 *    isEncrypted: boolean,
 *    encryptedData: string | null
 * }>}
 */
export function mdToCards(content, filePath = '') {
   const sections = content.split(CARD_SEPARATOR);

   return sections.map(section => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      // Find first header (# or ## or ### etc)
      const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/m);
      const title = headerMatch ? headerMatch[1].trim() : null;

      // Find user/time pattern - supports both [ User time ] and *[ User time ]*
      const userMatch = trimmed.match(CARD_HEADER_REGEX_MULTILINE);
      const user = userMatch ? userMatch[1] : null;
      const time = userMatch && userMatch[2] ? userMatch[2].trim() : null;

      // Check if this card is encrypted (but not escaped like \[Encrypted])
      const isEncrypted = ENCRYPTED_MARKER_REGEX.test(trimmed);

      // If encrypted, extract just the encrypted data (after [Encrypted] marker)
      let encryptedData = null;
      if (isEncrypted) {
         // Use regex with negative lookbehind to skip escaped markers
         const encryptedMatch = trimmed.match(/(?<!\\)\[Encrypted\]\s*([\s\S]*?)$/i);
         if (encryptedMatch) {
            encryptedData = encryptedMatch[1].trim();
         }
      }

      return {
         title,
         user,
         time,
         content: trimmed,
         file: filePath,
         isEncrypted,
         encryptedData
      };
   }).filter(Boolean);
}

/**
 * Find the card at a given line position in the text
 * Used by VS Code extension for cursor-based operations
 * @param {string} text - The full document text
 * @param {number} cursorLine - The 0-indexed line number
 * @returns {{
 *    headerLine: number,
 *    startLine: number,
 *    endLine: number,
 *    isEncrypted: boolean,
 *    hasUnencryptedMarker: boolean,
 *    user: string | null,
 *    time: string | null
 * } | null}
 */
export function findCardAtPosition(text, cursorLine) {
   const lines = text.split('\n');

   // Find all card boundaries (- - - separators)
   const separatorIndices = [-1]; // Start with -1 to represent "before first card"
   for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '- - -') {
         separatorIndices.push(i);
      }
   }
   separatorIndices.push(lines.length); // End marker

   // Find which card section contains the cursor
   for (let i = 0; i < separatorIndices.length - 1; i++) {
      const startLine = separatorIndices[i] + 1;
      const endLine = separatorIndices[i + 1] - 1;

      if (cursorLine >= startLine && cursorLine <= endLine) {
         // Found the card section, now find the header within it
         let headerLine = -1;
         let user = null;
         let time = null;
         let isEncrypted = false;
         let hasUnencryptedMarker = false;

         for (let j = startLine; j <= endLine; j++) {
            const line = lines[j].trim();
            const fullLine = lines[j]; // Keep original for backslash check

            // Check for unencrypted marker (but not escaped like \[Unencrypted])
            if (line === UNENCRYPTED_MARKER && !fullLine.trimStart().startsWith('\\')) {
               hasUnencryptedMarker = true;
               continue;
            }

            // Check for encrypted marker (but not escaped like \[Encrypted])
            if (line === ENCRYPTED_MARKER && !fullLine.trimStart().startsWith('\\')) {
               isEncrypted = true;
               continue;
            }

            // Check for card header
            const parsed = parseCardHeader(line);
            if (parsed && headerLine === -1) {
               headerLine = j;
               user = parsed.user;
               time = parsed.time;
            }
         }

         if (headerLine === -1) {
            // No header found in this section
            return null;
         }

         return {
            headerLine,
            startLine,
            endLine,
            isEncrypted,
            hasUnencryptedMarker,
            user,
            time
         };
      }
   }

   return null;
}
