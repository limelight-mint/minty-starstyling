
export interface Settings
{
    excludeFolders: string[];
    excludeFiles: string[];
    howManyLinesToAddBeforeFunctions: number;
    howManyLinesToAddBeforeConstructor: number;
    howManyLinesToAddAfterImports: number;
    howManyLinesToAddBeforeClasses: number;
    isFormatOnSave: boolean;
    styleKeyEntireProject: string;
    styleKey: string;
}
