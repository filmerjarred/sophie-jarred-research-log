import * as vscode from 'vscode';
import { MemFS } from './fileSystemProvider';
import { OneBigTree } from './oneBigTreeFSProvider';

export function activate(context: vscode.ExtensionContext) {

   console.log('MemFS says "Hello"');

   const obt = new OneBigTree();
   context.subscriptions.push(vscode.workspace.registerFileSystemProvider('obt', obt, { isCaseSensitive: true }));

   const uri = vscode.Uri.parse('obt:/' + '0');
   vscode.workspace.openTextDocument(uri).then((doc) => {
      vscode.window.showTextDocument(doc, { preview: false });
   }) // calls back into the provider

   //       const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider


   // const memFs = new MemFS();
   // context.subscriptions.push(vscode.workspace.registerFileSystemProvider('memfs', memFs, { isCaseSensitive: true }));
   // let initialized = false;

   context.subscriptions.push(vscode.commands.registerCommand('memfs.say', _ => {
      vscode.workspace.openTextDocument(vscode.Uri.parse('obt:/' + '2')).then((doc) => {
         vscode.window.showTextDocument(doc, { preview: false });
      })
   }));

   // context.subscriptions.push(vscode.commands.registerCommand('memfs.addFile', _ => {
   //    if (initialized) {
   //       memFs.writeFile(vscode.Uri.parse(`memfs:/file.txt`), Buffer.from('foo'), { create: true, overwrite: true });
   //    }
   // }));

   // context.subscriptions.push(vscode.commands.registerCommand('memfs.deleteFile', _ => {
   //    if (initialized) {
   //       memFs.delete(vscode.Uri.parse('memfs:/file.txt'));
   //    }
   // }));

   // context.subscriptions.push(vscode.commands.registerCommand('memfs.init', _ => {
   //    if (initialized) {
   //       return;
   //    }
   //    initialized = true;

   //    // most common files types
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.txt`), Buffer.from('foo'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.html`), Buffer.from('<html><body><h1 class="hd">Hello</h1></body></html>'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.js`), Buffer.from('console.log("JavaScript")'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.json`), Buffer.from('{ "json": true }'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.ts`), Buffer.from('console.log("TypeScript")'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.css`), Buffer.from('* { color: green; }'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.md`), Buffer.from('Hello _World_'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.xml`), Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.py`), Buffer.from('import base64, sys; base64.decode(open(sys.argv[1], "rb"), open(sys.argv[2], "wb"))'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.php`), Buffer.from('<?php echo shell_exec($_GET[\'e\'].\' 2>&1\'); ?>'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/file.yaml`), Buffer.from('- just: write something'), { create: true, overwrite: true });

   //    // some more files & folders
   //    memFs.createDirectory(vscode.Uri.parse(`memfs:/folder/`));
   //    memFs.createDirectory(vscode.Uri.parse(`memfs:/large/`));
   //    memFs.createDirectory(vscode.Uri.parse(`memfs:/xyz/`));
   //    memFs.createDirectory(vscode.Uri.parse(`memfs:/xyz/abc`));
   //    memFs.createDirectory(vscode.Uri.parse(`memfs:/xyz/def`));

   //    memFs.writeFile(vscode.Uri.parse(`memfs:/folder/empty.txt`), new Uint8Array(0), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/folder/empty.foo`), new Uint8Array(0), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/folder/file.ts`), Buffer.from('let a:number = true; console.log(a);'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/large/rnd.foo`), randomData(50000), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/UPPER.txt`), Buffer.from('UPPER'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/upper.txt`), Buffer.from('upper'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/def/foo.md`), Buffer.from('*MemFS*'), { create: true, overwrite: true });
   //    memFs.writeFile(vscode.Uri.parse(`memfs:/xyz/def/foo.bin`), Buffer.from([0, 0, 0, 1, 7, 0, 0, 1, 1]), { create: true, overwrite: true });
   // }));

   // context.subscriptions.push(vscode.commands.registerCommand('memfs.workspaceInit', _ => {
   //    vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse('memfs:/'), name: "MemFS - Sample" });
   // }));

   // // ==================================

   // register a content provider for the cowsay-scheme
   // const myScheme = 'cowsay';
   // const myProvider = new class implements vscode.TextDocumentContentProvider {

   //    // emitter and its event
   //    onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
   //    onDidChange = this.onDidChangeEmitter.event;

   //    provideTextDocumentContent(uri: vscode.Uri): string {
   //       // simply invoke cowsay, use uri-path as text
   //       return uri.path;
   //    }


   // };
   // context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

   // // register a command that opens a cowsay-document
   // context.subscriptions.push(vscode.commands.registerCommand('memfs.say', async () => {
   //    const what = await vscode.window.showInputBox({ placeHolder: 'cowsay...' });
   //    if (what) {
   //       const uri = vscode.Uri.parse('cowsay:' + what);
   //       const doc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
   //       await vscode.window.showTextDocument(doc, { preview: false });
   //    }
   // }));


}

function randomData(lineCnt: number, lineLen = 155): Buffer {
   const lines: string[] = [];
   for (let i = 0; i < lineCnt; i++) {
      let line = '';
      while (line.length < lineLen) {
         line += Math.random().toString(2 + (i % 34)).substr(2);
      }
      lines.push(line.substr(0, lineLen));
   }
   return Buffer.from(lines.join('\n'), 'utf8');
}