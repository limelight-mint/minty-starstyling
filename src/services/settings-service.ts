import * as vscode from 'vscode';
import { Settings } from '../interfaces/settings';

export default class SettingsService
{
    get: Settings;

    constructor() 
    {
        this.get = this.Parse();
    }

    private Parse() : Settings
    {
        const config = vscode.workspace.getConfiguration('starstyling');
        const excludeFiles = config.get<string[]>('excludeFiles', []);
        const excludeFolders = config.get<string[]>('excludeFolders', []);
        const isFormatOnSave = config.get<boolean>('isFormatOnSave', false);
        const howManyLinesToAddBeforeFunctions = config.get<number>('howManyLinesToAddBeforeFunctions', 2);
        const howManyLinesToAddBeforeConstructor = config.get<number>('howManyLinesToAddBeforeConstructor', 1);
        const howManyLinesToAddAfterImports = config.get<number>('howManyLinesToAddAfterImports', 2);
        const howManyLinesToAddBeforeClasses = config.get<number>('howManyLinesToAddBeforeClasses', 2);
        const styleKey = config.get<string>('styleKey', "ctrl+shift+s");
        const styleKeyEntireProject = config.get<string>('styleKeyEntireProject', "ctrl+shift+a");

        return {
            excludeFiles,
            excludeFolders,
            isFormatOnSave,
            howManyLinesToAddBeforeFunctions,
            howManyLinesToAddBeforeConstructor,
            howManyLinesToAddAfterImports,
            howManyLinesToAddBeforeClasses,
            styleKey,
            styleKeyEntireProject
        };
    }
}