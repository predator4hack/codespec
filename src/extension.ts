import * as vscode from 'vscode';
import { FeatureTreeProvider } from './providers/featureTreeProvider';
import { TemplateService } from './services/templateService';
import { FileService } from './services/fileService';
import { FeatureSpecData } from './models/featureSpec';
import { AgentManager } from './services/agentManager';
import { CLICommands } from './commands/cliCommands';

let treeProvider: FeatureTreeProvider;
let templateService: TemplateService;
let fileService: FileService;
let agentManager: AgentManager;
let cliCommands: CLICommands;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Feature Spec Extension is now active!');

    // Initialize services
    console.log('🔧 Initializing services...');
    templateService = new TemplateService(context);
    fileService = new FileService();
    agentManager = AgentManager.getInstance();
    cliCommands = new CLICommands();
    treeProvider = new FeatureTreeProvider(fileService);
    
    // Register tree view
    console.log('🌳 Registering tree view...');
    vscode.window.createTreeView('featureSpecs', {
        treeDataProvider: treeProvider,
        canSelectMany: false,
    });

    // Initialize CLI agents
    console.log('🤖 Initializing CLI agents...');
    agentManager.initializeAgents().catch(error => {
        console.error('Failed to initialize CLI agents:', error);
    });

    // Register commands
    console.log('⚡ Registering commands...');
    registerCommands(context);

    // Register services for cleanup
    context.subscriptions.push(
        templateService,
        fileService,
        treeProvider,
        cliCommands
    );
    
    console.log('✅ Extension activation complete!');
}

function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        // Existing commands
        vscode.commands.registerCommand(
            'featureSpecs.createNew',
            createNewFeature
        ),
        vscode.commands.registerCommand(
            'featureSpecs.refreshTree',
            () => treeProvider.refresh()
        ),
        
        // CLI Agent commands
        vscode.commands.registerCommand(
            'codespec.generateQuestions',
            (featureUri?: vscode.Uri) => cliCommands.generateQuestions(featureUri)
        ),
        vscode.commands.registerCommand(
            'codespec.generatePlan',
            (featureUri?: vscode.Uri) => cliCommands.generatePlan(featureUri)
        ),
        vscode.commands.registerCommand(
            'codespec.switchAgent',
            () => cliCommands.switchAgent()
        ),
        vscode.commands.registerCommand(
            'codespec.refreshAgents',
            () => cliCommands.refreshAgents()
        ),
        vscode.commands.registerCommand(
            'codespec.showAgentStatus',
            () => cliCommands.showAgentStatus()
        ),
        vscode.commands.registerCommand(
            'codespec.runInTerminal',
            (featureUri?: vscode.Uri) => cliCommands.runInTerminal(featureUri)
        ),
        
        // Agent status context menu commands
        vscode.commands.registerCommand(
            'codespec.selectAgent',
            () => cliCommands.switchAgent()
        ),
        vscode.commands.registerCommand(
            'codespec.installAgents',
            () => agentManager.showInstallationGuide()
        ),
        vscode.commands.registerCommand(
            'codespec.testAgent',
            () => cliCommands.showAgentStatus()
        ),
    ];

    context.subscriptions.push(...commands);
}

async function createNewFeature() {
    console.log('🎯 Create New Feature command triggered');
    
    try {
        // Step 1: Get and validate feature name
        const featureName = await getValidFeatureName();
        if (!featureName) {
            console.log('❌ User cancelled feature creation');
            return;
        }

        // Step 2: Check for duplicates
        const exists = await fileService.featureExists(featureName);
        if (exists) {
            const action = await handleDuplicateName(featureName);
            if (!action) {
                console.log('❌ User cancelled due to duplicate name');
                return;
            }
        }

        // Step 3: Create feature with progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Creating feature specification...",
            cancellable: false
        }, async (progress) => {
            // Create .features directory
            progress.report({ increment: 25, message: "Creating directory..." });
            await fileService.ensureFeaturesDirectory();
            
            // Generate content from template
            progress.report({ increment: 25, message: "Generating content..." });
            const templateData: FeatureSpecData = {
                featureName,
                createdDate: new Date().toISOString().split('T')[0],
                lastUpdated: new Date().toISOString().split('T')[0],
                status: 'Draft',
                cliAgent: 'Not Set'
            };
            const content = await templateService.populateTemplate(templateData);
            
            // Create file
            progress.report({ increment: 25, message: "Creating file..." });
            const filePath = await fileService.createFeatureFile(featureName, content);
            
            // Open in editor
            progress.report({ increment: 25, message: "Opening editor..." });
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
            
            // Refresh tree
            treeProvider.refresh();
        });

        vscode.window.showInformationMessage(`Feature "${featureName}" created successfully!`);
        console.log(`✅ Feature "${featureName}" created successfully`);

    } catch (error) {
        console.error('Failed to create feature:', error);
        handleFeatureCreationError(error);
    }
}

async function getValidFeatureName(): Promise<string | undefined> {
    return await vscode.window.showInputBox({
        prompt: 'Enter feature name',
        placeHolder: 'my-awesome-feature',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Feature name cannot be empty';
            }
            
            const validation = fileService.validateFileName(value);
            return validation.valid ? undefined : validation.error;
        }
    });
}

async function handleDuplicateName(featureName: string): Promise<boolean> {
    const action = await vscode.window.showWarningMessage(
        `A feature named "${featureName}" already exists. What would you like to do?`,
        'Create with different name',
        'Cancel'
    );

    if (action === 'Create with different name') {
        // Let the system generate a unique name automatically
        return true;
    }

    return false;
}

function handleFeatureCreationError(error: any): void {
    let message = 'Failed to create feature specification';
    
    if (error instanceof Error) {
        if (error.message.includes('No workspace')) {
            message = 'Please open a workspace or folder to create feature specifications';
        } else if (error.message.includes('permission')) {
            message = 'Permission denied. Please check write permissions for your workspace';
        } else if (error.message.includes('ENOENT')) {
            message = 'Failed to access workspace directory. Please ensure the folder exists';
        } else {
            message = `Failed to create feature: ${error.message}`;
        }
    }

    vscode.window.showErrorMessage(message);
}

export function deactivate() {
    console.log('Feature Spec Extension is now deactivated!');
}