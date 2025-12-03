import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
