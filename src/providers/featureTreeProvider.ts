import * as vscode from 'vscode';
import * as path from 'path';
import { FeatureSpecItem, FeatureSpecFile } from '../models/featureSpec';
import { FileService } from '../services/fileService';
import { AgentManager } from '../services/agentManager';
import { CLIAgentInfo } from '../models/cliAgent';

export class FeatureTreeProvider implements vscode.TreeDataProvider<FeatureSpecItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FeatureSpecItem | undefined | null | void> = new vscode.EventEmitter<FeatureSpecItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FeatureSpecItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private data: FeatureSpecItem[] = [];
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private agentManager: AgentManager;

    constructor(private fileService: FileService) {
        console.log('🌳 FeatureTreeProvider constructor called');
        this.agentManager = AgentManager.getInstance();
        this.loadFeatureFiles();
        this.watchFiles();
        this.setupAgentEvents();
    }

    refresh(): void {
        console.log('🔄 Refreshing tree view...');
        this.loadFeatureFiles();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FeatureSpecItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.collapsibleState);
        
        treeItem.id = element.id;
        treeItem.contextValue = element.contextValue;
        treeItem.description = element.description;
        treeItem.iconPath = element.iconPath;
        treeItem.tooltip = element.tooltip;
        
        if (element.resourceUri) {
            treeItem.resourceUri = element.resourceUri;
            treeItem.command = {
                command: 'vscode.open',
                title: 'Open',
                arguments: [element.resourceUri]
            };
        }

        return treeItem;
    }

    getChildren(element?: FeatureSpecItem): Thenable<FeatureSpecItem[]> {
        if (!element) {
            // Return root items with agent status
            const rootItems = [...this.data];
            
            // Add agent status item at the top
            const agentStatusItem = this.createAgentStatusItem();
            if (agentStatusItem) {
                rootItems.unshift(agentStatusItem);
            }
            
            console.log(`📋 Getting root items, found ${rootItems.length} items (including agent status)`);
            return Promise.resolve(rootItems);
        }
        
        // Return children of the given element
        const children = element.children || [];
        console.log(`👶 Getting children for ${element.label}, found ${children.length} children`);
        return Promise.resolve(children);
    }

    getParent(element: FeatureSpecItem): Thenable<FeatureSpecItem | null> {
        return Promise.resolve(element.parent || null);
    }

    private async loadFeatureFiles(): Promise<void> {
        try {
            const files = await this.fileService.listFeatureFiles();
            this.data = this.buildTreeStructure(files);
            console.log(`📋 Loaded ${this.data.length} feature files`);
        } catch (error) {
            console.error('Failed to load feature files:', error);
            // Show empty state with helpful message
            this.data = [this.createEmptyStateItem()];
        }
    }

    private buildTreeStructure(files: string[]): FeatureSpecItem[] {
        const items: FeatureSpecItem[] = [];

        for (const filePath of files) {
            const fileName = path.basename(filePath, '.md');
            const displayName = this.formatDisplayName(fileName);
            
            const item = new FeatureSpecItem(
                fileName,
                displayName,
                vscode.TreeItemCollapsibleState.None,
                'featureSpec',
                vscode.Uri.file(filePath)
            );

            item.description = 'Feature Spec';
            item.tooltip = `${displayName} - Click to open`;
            item.iconPath = new vscode.ThemeIcon('file-text');
            
            items.push(item);
        }

        return items.sort((a, b) => a.label.localeCompare(b.label));
    }

    private formatDisplayName(fileName: string): string {
        return fileName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private createEmptyStateItem(): FeatureSpecItem {
        const item = new FeatureSpecItem(
            'empty-state',
            'No feature specifications found',
            vscode.TreeItemCollapsibleState.None,
            'emptyState'
        );
        item.description = 'Create your first feature spec';
        item.tooltip = 'Click "Create New Feature" to get started';
        item.iconPath = new vscode.ThemeIcon('info');
        return item;
    }

    private createAgentStatusItem(): FeatureSpecItem | null {
        const selectedAgent = this.agentManager.getSelectedAgent();
        const availableAgentsCount = this.agentManager.getAvailableAgentsCount();
        
        let label: string;
        let description: string;
        let iconPath: vscode.ThemeIcon;
        let contextValue: string;
        let tooltip: string;

        if (!selectedAgent) {
            label = 'No CLI Agent Selected';
            description = `${availableAgentsCount} available`;
            iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('problemsWarningIcon.foreground'));
            contextValue = 'agentStatus.noSelection';
            tooltip = 'Click to select a CLI agent for code generation';
        } else {
            label = `Agent: ${selectedAgent.displayName}`;
            
            if (!selectedAgent.isAvailable) {
                description = 'Not Available';
                iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('problemsErrorIcon.foreground'));
                contextValue = 'agentStatus.notAvailable';
                tooltip = `${selectedAgent.displayName} is not installed or not available in PATH`;
            } else if (!selectedAgent.isAuthenticated) {
                description = 'Not Authenticated';
                iconPath = new vscode.ThemeIcon('key', new vscode.ThemeColor('problemsWarningIcon.foreground'));
                contextValue = 'agentStatus.notAuthenticated';
                tooltip = `${selectedAgent.displayName} requires authentication`;
            } else {
                description = `v${selectedAgent.version} - Ready`;
                iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
                contextValue = 'agentStatus.ready';
                tooltip = `${selectedAgent.displayName} is ready for use`;
            }
        }

        const item = new FeatureSpecItem(
            'agent-status',
            label,
            vscode.TreeItemCollapsibleState.None,
            contextValue
        );

        item.description = description;
        item.iconPath = iconPath;
        item.tooltip = tooltip;

        return item;
    }

    private setupAgentEvents(): void {
        // Listen for agent changes and refresh the tree
        this.agentManager.onAgentChanged(() => {
            console.log('🤖 Agent changed, refreshing tree view...');
            this._onDidChangeTreeData.fire();
        });

        this.agentManager.onAgentsRefreshed(() => {
            console.log('🔄 Agents refreshed, updating tree view...');
            this._onDidChangeTreeData.fire();
        });
    }

    private watchFiles(): void {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return;
            }

            const workspaceRoot = workspaceFolders[0].uri.fsPath;
            const pattern = path.join(workspaceRoot, '.features', '*.md');
            
            this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
            
            this.fileWatcher.onDidCreate(() => {
                console.log('📁 Feature file created, refreshing tree...');
                this.refresh();
            });
            
            this.fileWatcher.onDidDelete(() => {
                console.log('🗑️ Feature file deleted, refreshing tree...');
                this.refresh();
            });
            
            this.fileWatcher.onDidChange(() => {
                console.log('✏️ Feature file changed, refreshing tree...');
                this.refresh();
            });
        } catch (error) {
            console.error('Failed to set up file watcher:', error);
        }
    }

    dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
    }
}