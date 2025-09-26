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
    cliContext?: CLIProjectContext;
    analyzedFiles?: FileAnalysis[];
}

export interface CLIProjectContext {
    projectType: 'typescript' | 'javascript' | 'python' | 'java' | 'other';
    framework?: string;              // React, Vue, Angular, etc.
    packageManager?: string;         // npm, yarn, pnpm
    buildTools: string[];           // webpack, vite, rollup
    testFramework?: string;         // jest, mocha, pytest
    dependencies: PackageInfo[];    // Key dependencies
    projectStructure: FileStructure[];
    configFiles: ConfigFile[];
}

export interface PackageInfo {
    name: string;
    version: string;
    isDevDependency: boolean;
}

export interface FileStructure {
    path: string;
    type: 'file' | 'directory';
    size?: number;
    lastModified?: Date;
}

export interface ConfigFile {
    name: string;
    path: string;
    content: string;
}

export interface FileAnalysis {
    path: string;
    content: string;
    size: number;
    language: string;
    lastModified: Date;
    summary?: string;
}