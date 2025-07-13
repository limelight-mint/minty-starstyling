import * as vscode from 'vscode';
import * as path from 'path';
import SettingsService from './services/settings-service';

export function shouldFormatDocument(document: vscode.TextDocument): boolean 
{
    // Check language
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript') 
    {
        return false;
    }

    // Check if file should be excluded
    if (shouldExcludeFile(document.fileName)) 
    {
        return false;
    }

    return true;
}

export function shouldExcludeFile(filePath: string) : boolean 
{
    const settings = new SettingsService();
    const excludeFiles = settings.get.excludeFiles;
    const excludeFolders = settings.get.excludeFolders;

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