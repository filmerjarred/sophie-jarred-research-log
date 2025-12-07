import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * This import references the shared card parsing library from day-5/lib/cards.js
 * The file doesn't exist in src/ - it's copied to out/lib/ at build time by `npm run copylib`
 * See package.json scripts for details on how the lib is synced during build/watch
 */
// @ts-ignore - lib/cards.js is copied to out/lib/ at build time, not present in src/
import { findCardAtPosition, ENCRYPTED_MARKER, UNENCRYPTED_MARKER } from './lib/cards.js';

// Type definition for the card info returned by findCardAtPosition
interface CardInfo {
    headerLine: number;
    startLine: number;
    endLine: number;
    isEncrypted: boolean;
    hasUnencryptedMarker: boolean;
    user: string | null;
    time: string | null;
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('ship-december.newDay', async (uri: vscode.Uri) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const shipDecemberPath = path.join(workspaceRoot, 'ship-december');

        if (!fs.existsSync(shipDecemberPath)) {
            vscode.window.showErrorMessage('ship-december folder not found in workspace root');
            return;
        }

        const dayFolders = fs.readdirSync(shipDecemberPath)
            .filter(name => /^day-\d+$/.test(name))
            .sort((a, b) => {
                const numA = parseInt(a.replace('day-', ''));
                const numB = parseInt(b.replace('day-', ''));
                return numB - numA;
            });

        if (dayFolders.length === 0) {
            vscode.window.showErrorMessage('No day-X folders found in ship-december');
            return;
        }

        const mostRecentDay = dayFolders[0];
        const mostRecentNum = parseInt(mostRecentDay.replace('day-', ''));
        const newDayNum = mostRecentNum + 1;
        const newDayName = `day-${newDayNum}`;

        const sourcePath = path.join(shipDecemberPath, mostRecentDay);
        const destPath = path.join(shipDecemberPath, newDayName);

        if (fs.existsSync(destPath)) {
            vscode.window.showErrorMessage(`${newDayName} already exists`);
            return;
        }

        try {
            copyFolderSync(sourcePath, destPath);
        } catch (error) {
            // Silent fail - no notifications
        }
    });

    context.subscriptions.push(disposable);

    // Register encrypt/decrypt toggle command
    const encryptDecryptDisposable = vscode.commands.registerCommand('ship-december.toggleEncryption', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        const cursorPosition = editor.selection.active;
        const text = document.getText();

        // Find the card containing the cursor (using shared lib)
        const card: CardInfo | null = findCardAtPosition(text, cursorPosition.line);
        if (!card) {
            vscode.window.showErrorMessage('Cursor is not inside a card');
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const envPath = path.join(workspaceRoot, '.env');

        // Get or set password
        let password: string | null = getPasswordFromEnv(envPath);
        if (!password) {
            const inputPassword = await vscode.window.showInputBox({
                prompt: 'Enter encryption password (will be saved to .env)',
                password: true
            });
            if (!inputPassword) {
                return;
            }
            password = inputPassword;
            setPasswordInEnv(envPath, password);
        }

        // Toggle encryption
        const lines = text.split('\n');
        let newText: string;

        if (card.isEncrypted) {
            // Decrypt
            newText = decryptCard(lines, card, password);
        } else {
            // Encrypt
            newText = encryptCard(lines, card, password);
        }

        // Apply the edit
        const fullRange = new vscode.Range(
            new vscode.Position(0, 0),
            new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length)
        );

        await editor.edit(editBuilder => {
            editBuilder.replace(fullRange, newText);
        });
    });

    context.subscriptions.push(encryptDecryptDisposable);

    // Register new card command
    const newCardDisposable = vscode.commands.registerCommand('ship-december.newCard', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        // Prompt for user name
        const userName = await vscode.window.showInputBox({
            prompt: 'Enter your name for the card header',
            placeHolder: 'e.g., Jarred, Sophie'
        });
        if (!userName) {
            return;
        }

        // Get current time rounded to nearest 15 minutes
        const time = getRoundedTime();

        // Build the new card text
        const cardHeader = `*[ ${userName} ${time} ]*`;
        const newCardText = `\n\n- - -\n\n${cardHeader}\n\n`;

        // Insert at cursor position
        const cursorPosition = editor.selection.active;

        await editor.edit(editBuilder => {
            editBuilder.insert(cursorPosition, newCardText);
        });

        // Move cursor to the line after the header (where content goes)
        const newPosition = new vscode.Position(cursorPosition.line + 6, 0);
        editor.selection = new vscode.Selection(newPosition, newPosition);
    });

    context.subscriptions.push(newCardDisposable);
}

/**
 * Get current time rounded to nearest 15 minutes, formatted as "10.30am"
 */
function getRoundedTime(): string {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Round to nearest 15 minutes
    minutes = Math.round(minutes / 15) * 15;

    // Handle rollover
    if (minutes === 60) {
        minutes = 0;
        hours += 1;
    }
    if (hours === 24) {
        hours = 0;
    }

    // Convert to 12-hour format
    const isPM = hours >= 12;
    const displayHours = hours % 12 || 12;
    const suffix = isPM ? 'pm' : 'am';

    // Format minutes with leading zero if needed
    const displayMinutes = minutes === 0 ? '' : `.${minutes.toString().padStart(2, '0')}`;

    return `${displayHours}${displayMinutes}${suffix}`;
}

function getPasswordFromEnv(envPath: string): string | null {
    if (!fs.existsSync(envPath)) {
        return null;
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^ENCRYPTION_PASSWORD=(.+)$/m);
    return match ? match[1] : null;
}

function setPasswordInEnv(envPath: string, password: string): void {
    let content = '';
    if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf-8');
        if (content.includes('ENCRYPTION_PASSWORD=')) {
            content = content.replace(/^ENCRYPTION_PASSWORD=.+$/m, `ENCRYPTION_PASSWORD=${password}`);
        } else {
            content += `\nENCRYPTION_PASSWORD=${password}`;
        }
    } else {
        content = `ENCRYPTION_PASSWORD=${password}`;
    }
    fs.writeFileSync(envPath, content);
}

function deriveKey(password: string): Buffer {
    // Use PBKDF2 for browser compatibility (Web Crypto API uses PBKDF2)
    return crypto.pbkdf2Sync(password, 'salt', 100000, 32, 'sha256');
}

function encrypt(text: string, password: string): string {
    const iv = crypto.randomBytes(16);
    const key = deriveKey(password);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

function decrypt(encryptedText: string, password: string): string {
    const [ivBase64, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivBase64, 'base64');
    const key = deriveKey(password);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encryptCard(lines: string[], card: CardInfo, password: string): string {
    const headerLine = card.hasUnencryptedMarker ? card.startLine + 1 : card.headerLine;
    const header = lines[headerLine];

    // Get content after header (excluding [Unencrypted] marker if present)
    const contentStartLine = headerLine + 1;
    const contentLines = lines.slice(contentStartLine, card.endLine + 1);
    const content = contentLines.join('\n');

    // Encrypt the content
    const encrypted = encrypt(content, password);

    // Build new card
    const beforeCard = lines.slice(0, card.startLine);
    const afterCard = lines.slice(card.endLine + 1);

    // Remove [Unencrypted] marker if present
    const newCard = [
        header,
        ENCRYPTED_MARKER,
        '',
        encrypted
    ];

    return [...beforeCard, ...newCard, ...afterCard].join('\n');
}

function decryptCard(lines: string[], card: CardInfo, password: string): string {
    const header = lines[card.headerLine];

    // Find the encrypted content (skip header and [Encrypted] marker)
    const contentStartLine = card.headerLine + 2; // Skip header and [Encrypted]
    const contentLines = lines.slice(contentStartLine, card.endLine + 1);

    // Find the actual encrypted string (skip empty lines)
    const encryptedContent = contentLines.filter(l => l.trim()).join('');

    try {
        const decrypted = decrypt(encryptedContent, password);

        // Build new card with [Unencrypted] marker
        const beforeCard = lines.slice(0, card.startLine);
        const afterCard = lines.slice(card.endLine + 1);

        const newCard = [
            UNENCRYPTED_MARKER,
            header,
            decrypted
        ];

        return [...beforeCard, ...newCard, ...afterCard].join('\n');
    } catch (error) {
        vscode.window.showErrorMessage('Failed to decrypt: wrong password?');
        return lines.join('\n');
    }
}

function copyFolderSync(source: string, destination: string): void {
    fs.mkdirSync(destination, { recursive: true });

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

export function deactivate() {}
