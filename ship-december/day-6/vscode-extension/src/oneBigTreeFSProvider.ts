/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class File implements vscode.FileStat {

   type: vscode.FileType;
   ctime: number;
   mtime: number;
   size: number;

   name: string;
   data?: Uint8Array;

   constructor(name: string) {
      this.type = vscode.FileType.File;
      this.ctime = Date.now();
      this.mtime = Date.now();
      this.size = 0;
      this.name = name;
   }
}

export class Directory implements vscode.FileStat {

   type: vscode.FileType;
   ctime: number;
   mtime: number;
   size: number;

   name: string;
   entries: Map<string, File | Directory>;

   constructor(name: string) {
      this.type = vscode.FileType.Directory;
      this.ctime = Date.now();
      this.mtime = Date.now();
      this.size = 0;
      this.name = name;
      this.entries = new Map();
   }
}

const encoder = new TextEncoder();

// Build content from all post.md files
function buildContent(): string {
   const repoRoot = findRepoRoot();
   if (!repoRoot) {
      return 'Could not find ship-december folder';
   }

   const shipDecemberPath = path.join(repoRoot, 'ship-december');
   const dayFolders = fs.readdirSync(shipDecemberPath)
      .filter(f => f.match(/^day-\d+$/))
      .sort((a, b) => {
         const numA = parseInt(a.replace('day-', ''));
         const numB = parseInt(b.replace('day-', ''));
         return numA - numB;
      });

   const lines: string[] = [];
   for (const dayFolder of dayFolders) {
      const dayNum = dayFolder.replace('day-', '');
      const postPath = path.join(shipDecemberPath, dayFolder, 'post.md');

      if (fs.existsSync(postPath)) {
         lines.push(`Day ${dayNum}`);
         const postContent = fs.readFileSync(postPath, 'utf-8');
         const indentedContent = postContent
            .split('\n')
            .map(line => '   ' + line)
            .join('\n');
         lines.push(indentedContent);
      }
   }

   return lines.join('\n');
}

function findRepoRoot(): string | null {
   // Try to find ship-december folder by walking up from extension location
   let dir = __dirname;
   for (let i = 0; i < 10; i++) {
      const candidate = path.join(dir, 'ship-december');
      if (fs.existsSync(candidate)) {
         return dir;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
   }

   // Fallback: try workspace folders
   const workspaceFolders = vscode.workspace.workspaceFolders;
   if (workspaceFolders) {
      for (const folder of workspaceFolders) {
         const candidate = path.join(folder.uri.fsPath, 'ship-december');
         if (fs.existsSync(candidate)) {
            return folder.uri.fsPath;
         }
      }
   }

   return null;
}

export type Entry = File | Directory;

export class OneBigTree implements vscode.FileSystemProvider {

   root = new Directory('');

   // --- manage file metadata

   stat(uri: vscode.Uri): vscode.FileStat {
      return {
         ctime: Date.now(),
         mtime: Date.now(),
         size: 5,
         type: vscode.FileType.File
      }
   }

   readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
      const entry = this._lookupAsDirectory(uri, false);
      const result: [string, vscode.FileType][] = [];
      for (const [name, child] of entry.entries) {
         result.push([name, child.type]);
      }
      return result;
   }

   // --- manage file contents

   readFile(uri: vscode.Uri): Uint8Array {
      const content = buildContent();
      const index = parseInt(uri.path.replace('/', ''));

      const newStr = content
         .split('\n')
         .slice(index)
         .map(s => s.replace(/^   /, ''))
         .join('\n');

      return encoder.encode(newStr);
      // const data = this._lookupAsFile(uri, false).data;
      // if (data) {
      //    return data;
      // }
      // throw vscode.FileSystemError.FileNotFound();
   }

   writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
      const basename = path.posix.basename(uri.path);
      const parent = this._lookupParentDirectory(uri);
      let entry = parent.entries.get(basename);
      if (entry instanceof Directory) {
         throw vscode.FileSystemError.FileIsADirectory(uri);
      }
      if (!entry && !options.create) {
         throw vscode.FileSystemError.FileNotFound(uri);
      }
      if (entry && options.create && !options.overwrite) {
         throw vscode.FileSystemError.FileExists(uri);
      }
      if (!entry) {
         entry = new File(basename);
         parent.entries.set(basename, entry);
         this._fireSoon({ type: vscode.FileChangeType.Created, uri });
      }
      entry.mtime = Date.now();
      entry.size = content.byteLength;
      entry.data = content;

      this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
   }

   // --- manage files/folders

   rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {

      if (!options.overwrite && this._lookup(newUri, true)) {
         throw vscode.FileSystemError.FileExists(newUri);
      }

      const entry = this._lookup(oldUri, false);
      const oldParent = this._lookupParentDirectory(oldUri);

      const newParent = this._lookupParentDirectory(newUri);
      const newName = path.posix.basename(newUri.path);

      oldParent.entries.delete(entry.name);
      entry.name = newName;
      newParent.entries.set(newName, entry);

      this._fireSoon(
         { type: vscode.FileChangeType.Deleted, uri: oldUri },
         { type: vscode.FileChangeType.Created, uri: newUri }
      );
   }

   delete(uri: vscode.Uri): void {
      const dirname = uri.with({ path: path.posix.dirname(uri.path) });
      const basename = path.posix.basename(uri.path);
      const parent = this._lookupAsDirectory(dirname, false);
      if (!parent.entries.has(basename)) {
         throw vscode.FileSystemError.FileNotFound(uri);
      }
      parent.entries.delete(basename);
      parent.mtime = Date.now();
      parent.size -= 1;
      this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { uri, type: vscode.FileChangeType.Deleted });
   }

   createDirectory(uri: vscode.Uri): void {
      const basename = path.posix.basename(uri.path);
      const dirname = uri.with({ path: path.posix.dirname(uri.path) });
      const parent = this._lookupAsDirectory(dirname, false);

      const entry = new Directory(basename);
      parent.entries.set(entry.name, entry);
      parent.mtime = Date.now();
      parent.size += 1;
      this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
   }

   // --- lookup

   private _lookup(uri: vscode.Uri, silent: false): Entry;
   private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
   private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
      const parts = uri.path.split('/');
      let entry: Entry = this.root;

      for (const part of parts) {
         if (!part) {
            continue;
         }
         let child: Entry | undefined;
         if (entry instanceof Directory) {
            child = entry.entries.get(part);
         }
         if (!child) {
            if (!silent) {
               throw vscode.FileSystemError.FileNotFound(uri);
            } else {
               return undefined;
            }
         }
         entry = child;
      }
      return entry;
   }

   private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
      const entry = this._lookup(uri, silent);
      if (entry instanceof Directory) {
         return entry;
      }
      throw vscode.FileSystemError.FileNotADirectory(uri);
   }

   private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
      const entry = this._lookup(uri, silent);
      if (entry instanceof File) {
         return entry;
      }
      throw vscode.FileSystemError.FileIsADirectory(uri);
   }

   private _lookupParentDirectory(uri: vscode.Uri): Directory {
      const dirname = uri.with({ path: path.posix.dirname(uri.path) });
      return this._lookupAsDirectory(dirname, false);
   }

   // --- manage file events

   private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
   private _bufferedEvents: vscode.FileChangeEvent[] = [];
   private _fireSoonHandle?: NodeJS.Timeout;

   readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

   watch(_resource: vscode.Uri): vscode.Disposable {
      // ignore, fires for all changes...
      return new vscode.Disposable(() => { });
   }

   private _fireSoon(...events: vscode.FileChangeEvent[]): void {
      this._bufferedEvents.push(...events);

      if (this._fireSoonHandle) {
         clearTimeout(this._fireSoonHandle);
      }

      this._fireSoonHandle = setTimeout(() => {
         this._emitter.fire(this._bufferedEvents);
         this._bufferedEvents.length = 0;
      }, 5);
   }
}