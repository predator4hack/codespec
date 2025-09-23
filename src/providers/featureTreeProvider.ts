import * as vscode from 'vscode';
import { FeatureSpecItem } from '../models/featureSpec';

export class FeatureTreeProvider implements vscode.TreeDataProvider<FeatureSpecItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FeatureSpecItem | undefined | null | void> = new vscode.EventEmitter<FeatureSpecItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FeatureSpecItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private data: FeatureSpecItem[] = [];

    constructor() {
        console.log('🌳 FeatureTreeProvider constructor called');
        this.loadDummyData();
    }

    refresh(): void {
        console.log('🔄 Refreshing tree view...');
        this.loadDummyData();
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
            // Return root items
            console.log(`📋 Getting root items, found ${this.data.length} features`);
            return Promise.resolve(this.data);
        }
        
        // Return children of the given element
        const children = element.children || [];
        console.log(`👶 Getting children for ${element.label}, found ${children.length} children`);
        return Promise.resolve(children);
    }

    getParent(element: FeatureSpecItem): Thenable<FeatureSpecItem | null> {
        return Promise.resolve(element.parent || null);
    }

    private loadDummyData(): void {
        // Create dummy feature specs for initial testing
        const userAuthFeature = new FeatureSpecItem(
            'user-authentication',
            'User Authentication System',
            vscode.TreeItemCollapsibleState.Expanded,
            'featureSpec'
        );
        userAuthFeature.description = 'Draft';
        userAuthFeature.tooltip = 'User Authentication System - Status: Draft';
        userAuthFeature.iconPath = new vscode.ThemeIcon('account');
        
        // Add sub-items to demonstrate tree structure
        const loginComponent = new FeatureSpecItem(
            'login-component',
            'Login Component',
            vscode.TreeItemCollapsibleState.None,
            'featureComponent'
        );
        loginComponent.description = 'Component';
        loginComponent.iconPath = new vscode.ThemeIcon('symbol-class');
        loginComponent.parent = userAuthFeature;

        const authService = new FeatureSpecItem(
            'auth-service',
            'Authentication Service',
            vscode.TreeItemCollapsibleState.None,
            'featureComponent'
        );
        authService.description = 'Service';
        authService.iconPath = new vscode.ThemeIcon('symbol-interface');
        authService.parent = userAuthFeature;

        userAuthFeature.children = [loginComponent, authService];

        // Second dummy feature
        const dashboardFeature = new FeatureSpecItem(
            'dashboard',
            'User Dashboard',
            vscode.TreeItemCollapsibleState.Collapsed,
            'featureSpec'
        );
        dashboardFeature.description = 'In Progress';
        dashboardFeature.tooltip = 'User Dashboard - Status: In Progress';
        dashboardFeature.iconPath = new vscode.ThemeIcon('dashboard');

        // Third dummy feature
        const notificationFeature = new FeatureSpecItem(
            'notifications',
            'Notification System',
            vscode.TreeItemCollapsibleState.None,
            'featureSpec'
        );
        notificationFeature.description = 'Planning';
        notificationFeature.tooltip = 'Notification System - Status: Planning';
        notificationFeature.iconPath = new vscode.ThemeIcon('bell');

        this.data = [userAuthFeature, dashboardFeature, notificationFeature];
    }
}