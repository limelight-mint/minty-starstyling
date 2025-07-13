import * as vscode from 'vscode';
import { formatCurrentDocument, formatDocument, formatEntireProject } from './commands';
import { shouldFormatDocument } from './utils';

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
		).then(() => vscode.commands.executeCommand('workbench.action.openSettings', '@minty-starstyling'));
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

export function deactivate(): void {}