import * as vscode from 'vscode';

export class FeatureSpecItem extends vscode.TreeItem {
    public children?: FeatureSpecItem[];
    public parent?: FeatureSpecItem;

    constructor(
        public readonly id: string,
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly resourceUri?: vscode.Uri
    ) {
        super(label, collapsibleState);
        this.id = id;
        this.contextValue = contextValue;
        this.resourceUri = resourceUri;
    }
}

export interface FeatureSpecData {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'in-progress' | 'planning' | 'completed';
    filePath?: string;
    createdAt: Date;
    updatedAt: Date;
    cliAgent?: string;
    questionsGenerated?: boolean;
    planGenerated?: boolean;
}

export interface ProjectContext {
    framework: string;
    language: string;
    packageManager: string;
    importantFiles: string[];
    dependencies: string[];
    projectStructure: string[];
}