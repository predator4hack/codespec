import * as vscode from 'vscode';
import { FeatureTreeProvider } from './providers/featureTreeProvider';

let treeProvider: FeatureTreeProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Feature Spec Extension is now active!');

    // Initialize tree provider
    console.log('📝 Creating FeatureTreeProvider...');
    treeProvider = new FeatureTreeProvider();
    
    // Register tree view
    console.log('🌳 Registering tree view...');
    vscode.window.createTreeView('featureSpecs', {
        treeDataProvider: treeProvider,
        canSelectMany: false,
    });

    // Register commands
    console.log('⚡ Registering commands...');
    registerCommands(context);
    
    console.log('✅ Extension activation complete!');
}

function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        vscode.commands.registerCommand(
            'featureSpecs.createNew',
            createNewFeature
        ),
        vscode.commands.registerCommand(
            'featureSpecs.refreshTree',
            () => treeProvider.refresh()
        ),
    ];

    context.subscriptions.push(...commands);
}

async function createNewFeature() {
    console.log('🎯 Create New Feature command triggered');
    
    const featureName = await vscode.window.showInputBox({
        prompt: 'Enter feature name',
        placeHolder: 'my-awesome-feature'
    });

    if (featureName) {
        console.log(`💡 User entered feature name: ${featureName}`);
        vscode.window.showInformationMessage(`Creating feature: ${featureName}`);
        // TODO: Implement actual feature creation in later phases
        treeProvider.refresh();
    } else {
        console.log('❌ User cancelled feature creation');
    }
}

export function deactivate() {
    console.log('Feature Spec Extension is now deactivated!');
}