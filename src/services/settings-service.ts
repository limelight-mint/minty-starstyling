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
        const howManyLinesToAdd = config.get<number>('howManyLinesToAdd', 2);
        const styleKey = config.get<string>('styleKey', "ctrl+shift+s");
        const styleKeyEntireProject = config.get<string>('styleKeyEntireProject', "ctrl+shift+a");

        return {
            excludeFiles,
            excludeFolders,
            isFormatOnSave,
            howManyLinesToAdd,
            styleKey,
            styleKeyEntireProject
        };
    }
}