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
    featureName: string;
    createdDate: string;
    lastUpdated: string;
    status: 'Draft' | 'In Progress' | 'Ready for Review' | 'Completed';
    cliAgent: 'claude-code' | 'gemini-cli' | 'Not Set';
    description?: string;
    acceptanceCriteria?: string[];
    importantFiles?: string[];
    additionalContext?: string;
    technicalConsiderations?: string;
}

export interface FeatureSpecFile {
    name: string;
    path: string;
    type: 'feature' | 'directory';
    children?: FeatureSpecFile[];
}

export interface FeatureSpecMetadata {
    created: string;
    lastUpdated: string;
    cliAgentUsed: string;
    questionsGenerated?: string;
    planGenerated?: string;
}

export interface ProjectContext {
    framework: string;
    language: string;
    packageManager: string;
    importantFiles: string[];
    dependencies: string[];
    projectStructure: string[];
}