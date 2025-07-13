import * as vscode from 'vscode';
import { formatWithOOPStyle } from './formatter';
import { shouldExcludeFile, shouldFormatDocument } from './utils';

export function formatCurrentDocument() : void 
{
    const editor = vscode.window.activeTextEditor;
    if (!editor) 
    {
        return;
    }

    if (shouldFormatDocument(editor.document)) 
    {
        formatDocument(editor.document);
    }
}

export function formatDocument(document: vscode.TextDocument) : void 
{
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) 
    {
        return;
    }

    // Check if we're already formatting this document
    const currentlyFormatting = (global as any).currentlyFormatting as Set<string>;
    if (currentlyFormatting.has(document.fileName)) 
    {
        console.log('[✨] 🟡 | Already styling this document, skipping 🌿');
        return;
    }

    const text = document.getText();
    const isTypeScript = document.languageId === 'typescript';
    const formattedText = formatWithOOPStyle(text, isTypeScript);
    
    // Only format if the text actually changed
    if (text !== formattedText) 
    {
        // Mark as currently formatting
        currentlyFormatting.add(document.fileName);
        
        editor.edit(editBuilder => 
        {
            const fullRange = new vscode.Range
            (
                document.positionAt(0),
                document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, formattedText);
        }).then(() => 
        {
            // Auto-save after formatting
            return document.save();
        }).then(() => 
        {
            // Remove from currently formatting set
            currentlyFormatting.delete(document.fileName);
        }, (error) => 
        {
            // Remove from currently formatting set on error
            currentlyFormatting.delete(document.fileName);
            console.error('[✨] 🔴 | Error while styling:', error);
        });
    }
}

export async function formatEntireProject() : Promise<void> 
{
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) 
    {
        vscode.window.showWarningMessage('[✨] 🔴 | No workspace folder found.');
        return;
    }

    const progressOptions = 
	{
        location: vscode.ProgressLocation.Notification,
        title: "[✨] 📂 | Formatting entire project...",
        cancellable: false
    };

    await vscode.window.withProgress(progressOptions, async (progress) => 
    {
        let formattedCount = 0;
        let skippedCount = 0;

        // Get exclude folders from settings
        const config = vscode.workspace.getConfiguration('starstyling');
        const excludeFolders = config.get<string[]>('excludeFolders', []);
        
        // Build the exclude pattern for findFiles
        const excludePatterns = ['**/node_modules/**']; // Default exclude
        excludeFolders.forEach(folder => {
            excludePatterns.push(`**/${folder}/**`);
        });

        for (const folder of workspaceFolders) 
        {
            const jsFiles = await vscode.workspace.findFiles(
                new vscode.RelativePattern(folder, '**/*.{js,ts}'),
                `{${excludePatterns.join(',')}}`
            );

            for (const fileUri of jsFiles) 
            {
                // Check if file should be excluded (additional check for files)
                if (shouldExcludeFile(fileUri.fsPath)) 
                {
                    skippedCount++;
                    continue;
                }

                try 
                {
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    const text = document.getText();
                    const isTypeScript = document.languageId === 'typescript';
                    const formattedText = formatWithOOPStyle(text, isTypeScript);

                    if (text !== formattedText) 
                    {
                        const editor = await vscode.window.showTextDocument(document);
                        await editor.edit(editBuilder => 
                        {
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(text.length)
                            );
                            editBuilder.replace(fullRange, formattedText);
                        });
                        
                        await document.save();
                        formattedCount++;
                    }

                    progress.report(
					{ 
                        message: `[✨] 🍃 | Formatted ${formattedCount} files, skipped ${skippedCount} files 🌿` 
                    });
                } 
                catch (error) 
                {
                    console.error(`[✨] 🔴 | Error starstyling ${fileUri.fsPath}:`, error);
                }
            }
        }

        vscode.window.showInformationMessage(
            `[✨] 🍃 | Project formatting complete! Formatted ${formattedCount} files, skipped ${skippedCount} files.`
        );
    });
}