import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext): void 
{
    console.log('[✨] Starstyling extension is softly started 🌿');

    // Show welcome message on first install
    const isFirstRun = context.globalState.get('starstyling.firstRun', true);
	if (isFirstRun) 
	{
		vscode.window.showInformationMessage(
			'[✨] 🌺 Starstyling has format on save by default, edit in .vscode/settings.json',
			'Settings'
		).then(() => vscode.commands.executeCommand('workbench.action.openSettings', '@ext:minty-starstyling'));
        context.globalState.update('starstyling.firstRun', false);
    }

    // Track which documents we're currently formatting
    const currentlyFormatting = new Set<string>();

    // Register the manual format command
    const formatCommand = vscode.commands.registerCommand('minty-starstyling.format', () => 
    {
        console.log('[✨] 🌺 | Manual format triggered');
        formatCurrentDocument();
    });

    // Register the format entire project command
    const formatProjectCommand = vscode.commands.registerCommand('minty-starstyling.formatProject', () => 
    {
        console.log('[✨] 📂 | Format entire project triggered');
        formatEntireProject();
    });

    // Register format on save
    const saveListener = vscode.workspace.onDidSaveTextDocument((document) => 
    {
        console.log('[✨] 💾 | Save detected for:', document.fileName);
        const config = vscode.workspace.getConfiguration('starstyling');
        const isFormatOnSave = config.get<boolean>('isFormatOnSave', false);
        
        if (isFormatOnSave && shouldFormatDocument(document)) 
        {
            console.log('[✨] 💾 | Formatting document on save');
            formatDocument(document);
        }
    });

    // Register keybinding change listener
	const configChangeListener = vscode.workspace.onDidChangeConfiguration((event) => 
	{
		if (event.affectsConfiguration('starstyling.styleKey') || 
			event.affectsConfiguration('starstyling.styleKeyEntireProject')) 
		{
			vscode.window.showInformationMessage("[✨] Style key changed, please restart VS Code.");
			console.log('[✨] Style key changed, please restart VS Code for changes to take effect.');
		}
	});

    context.subscriptions.push(formatCommand, formatProjectCommand, saveListener, configChangeListener);

    // Expose the tracking set for the formatDocument function
    (global as any).currentlyFormatting = currentlyFormatting;
}


function shouldFormatDocument(document: vscode.TextDocument): boolean 
{
    // Check language
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript') 
    {
        return false;
    }

    // Check if file should be excluded
    if (shouldExcludeFile(document.fileName)) 
    {
        // console.log('[✨] File excluded from formatting:', document.fileName);
        return false;
    }

    return true;
}

async function formatEntireProject() : Promise<void> 
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
                        message: `[✨] 🟢 | Formatted ${formattedCount} files, skipped ${skippedCount} files 🌿` 
                    });
                } 
                catch (error) 
                {
                    console.error(`[✨] 🔴 | Error starstyling ${fileUri.fsPath}:`, error);
                }
            }
        }

        vscode.window.showInformationMessage(
            `[✨] 🟢 | Project formatting complete! Formatted ${formattedCount} files, skipped ${skippedCount} files.`
        );
    });
}

function formatCurrentDocument() : void 
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

function formatDocument(document: vscode.TextDocument) : void 
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

function shouldExcludeFile(filePath: string) : boolean 
{
    const config = vscode.workspace.getConfiguration('starstyling');
    const excludeFiles = config.get<string[]>('excludeFiles', []);
    const excludeFolders = config.get<string[]>('excludeFolders', []);

    const fileName = path.basename(filePath);
    const relativePath = vscode.workspace.asRelativePath(filePath);

    // Check file patterns
    for (const pattern of excludeFiles) 
    {
        if (fileName === pattern || fileName.match(new RegExp(pattern.replace('*', '.*')))) 
        {
            return true;
        }
    }

    // Check folder exclusions
    for (const folder of excludeFolders) 
    {
        if (relativePath.includes(folder)) 
        {
            return true;
        }
    }

    return false;
}

function formatWithOOPStyle(text: string, isTypeScript: boolean = false) : string 
{
    // 1. Preprocess: put every { and } on their own line, but respect string contexts
    let preprocessed: string[] = [];
    for (let rawLine of text.split('\n')) 
	{
        let line = rawLine.trim();

        // Handle "}else{" and similar patterns
        line = line.replace(/}\s*else\s*{/g, '}\nelse\n{');
        line = line.replace(/}\s*else/g, '}\nelse');
        line = line.replace(/else\s*{/g, 'else\n{');

        // TypeScript enhancement: Add spaces around colon in return types if not already present
        // Only apply to TypeScript files
        if (isTypeScript) 
		{
            // Simpler regex that catches ):TypeName patterns
            line = line.replace(/\)\s*:\s*([A-Za-z_$][A-Za-z0-9_$<>]*)/g, ') : $1');
        }

        // Process the line character by character to respect string contexts
        let result = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let inBacktick = false;
        let i = 0;
        
        while (i < line.length) 
		{
            const char = line[i];
            const nextChar = line[i + 1];
            
            // Track string contexts
            if (char === "'" && !inDoubleQuote && !inBacktick) 
			{
				inSingleQuote = !inSingleQuote;
			}

            if (char === '"' && !inSingleQuote && !inBacktick) 
			{
				inDoubleQuote = !inDoubleQuote;
			}

            if (char === '`' && !inSingleQuote && !inDoubleQuote) 
			{
				inBacktick = !inBacktick;
			}
            
            // Only process braces if not inside any string
            if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
                // Handle opening brace
                if (char === '{' && nextChar !== '{') 
				{
                    result += '\n{\n';
                    i++;
                    continue;
                }
                // Handle closing brace with semicolon
                if (char === '}' && nextChar === ';') 
				{
                    result += '\n};\n';
                    i += 2;
                    continue;
                }
                // Handle closing brace without semicolon
                if (char === '}' && nextChar !== '}') 
				{
                    result += '\n}\n';
                    i++;
                    continue;
                }
            }
            
            result += char;
            i++;
        }

        // Remove empty lines from multiple \n
        for (let l of result.split('\n')) {
            if (l.trim() !== '') 
			{ 
				preprocessed.push(l.trim()); 
			}
        }
    }

    // 2. Indentation logic
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 4;
    let lastWasFunctionOrExport = false;

    for (let i = 0; i < preprocessed.length; i++) 
    {
        const trimmedLine = preprocessed[i];

        // Check if this is a function, export, or method declaration
        const isFunctionOrExport = trimmedLine.startsWith('function') || 
                                   trimmedLine.startsWith('export') ||
                                   (trimmedLine.startsWith('const') && trimmedLine.includes('function')) ||
                                   (trimmedLine.startsWith('let') && trimmedLine.includes('function')) ||
                                   (trimmedLine.startsWith('var') && trimmedLine.includes('function')) ||
                                   // Add method detection - looks like MethodName()
                                   (trimmedLine.match(/^[A-Za-z_$][A-Za-z0-9_$]*\s*\(\)\s*$/) !== null && !trimmedLine.includes('function'));

        // Add 2 new lines before function/export/method if not the first item
        if (isFunctionOrExport && formattedLines.length > 0 && !lastWasFunctionOrExport) 
        {
            formattedLines.push('');
            formattedLines.push('');
        }

        // Handle closing braces - reduce indent before adding
        if (trimmedLine === '}' || trimmedLine === '};') 
        {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // Add current line with proper indentation
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + trimmedLine);

        // Handle opening braces - increase indent after adding
        if (trimmedLine === '{') 
        {
            indentLevel++;
        }

        lastWasFunctionOrExport = isFunctionOrExport;
    }

    return formattedLines.join('\n');
}


export function deactivate(): void {}