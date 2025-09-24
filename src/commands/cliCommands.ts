import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AgentManager } from '../services/agentManager';
import { ProjectAnalyzer } from '../services/projectAnalyzer';
import { CLIExecutionService } from '../services/cliExecutionService';
import { CommandBuilder } from '../utils/commandBuilder';
import { CLIFeature } from '../models/cliAgent';
import { ProjectContext } from '../models/featureSpec';

export class CLICommands {
    private agentManager: AgentManager;
    private projectAnalyzer: ProjectAnalyzer;
    private executionService: CLIExecutionService;
    private commandBuilder: CommandBuilder;

    constructor() {
        this.agentManager = AgentManager.getInstance();
        this.projectAnalyzer = new ProjectAnalyzer();
        this.executionService = new CLIExecutionService();
        this.commandBuilder = new CommandBuilder();
    }

    async generateQuestions(featureUri?: vscode.Uri): Promise<void> {
        try {
            const filePath = await this.resolveFeatureFile(featureUri);
            if (!filePath) return;

            if (!this.agentManager.supportsFeature(CLIFeature.QUESTIONNAIRE_GENERATION)) {
                vscode.window.showErrorMessage(
                    'The selected CLI agent does not support questionnaire generation.'
                );
                return;
            }

            const agent = this.agentManager.getSelectedAgent();
            if (!agent) {
                const selected = await this.agentManager.showAgentSelectionQuickPick();
                if (selected) {
                    await this.agentManager.switchAgent(selected);
                } else {
                    return;
                }
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating Questions',
                    cancellable: true
                },
                async (progress, token) => {
                    progress.report({ message: 'Analyzing project...' });
                    
                    const context = await this.getProjectContext();
                    const featureContent = await this.readFeatureFile(filePath);
                    const projectSummary = await this.projectAnalyzer.getProjectSummary(context.cliContext!);
                    
                    progress.report({ message: 'Building command...' });
                    
                    const command = this.commandBuilder.buildQuestionnaireCommand(
                        agent!,
                        filePath,
                        context,
                        featureContent,
                        projectSummary
                    );

                    progress.report({ message: 'Executing CLI command...' });
                    
                    const result = await this.executionService.executeCommand(command, {
                        agent: agent!,
                        cancellationToken: token
                    });

                    if (result.success) {
                        await this.handleSuccessfulGeneration(filePath, result.output, 'questions');
                        vscode.window.showInformationMessage('Questions generated successfully!');
                    } else {
                        await this.handleExecutionError(result, agent!);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate questions: ${error}`);
        }
    }

    async generatePlan(featureUri?: vscode.Uri): Promise<void> {
        try {
            const filePath = await this.resolveFeatureFile(featureUri);
            if (!filePath) return;

            if (!this.agentManager.supportsFeature(CLIFeature.IMPLEMENTATION_PLANNING)) {
                vscode.window.showErrorMessage(
                    'The selected CLI agent does not support implementation planning.'
                );
                return;
            }

            const agent = this.agentManager.getSelectedAgent();
            if (!agent) {
                const selected = await this.agentManager.showAgentSelectionQuickPick();
                if (selected) {
                    await this.agentManager.switchAgent(selected);
                } else {
                    return;
                }
            }

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: 'Generating Implementation Plan',
                    cancellable: true
                },
                async (progress, token) => {
                    progress.report({ message: 'Analyzing project...' });
                    
                    const context = await this.getProjectContext();
                    const featureContent = await this.readFeatureFile(filePath);
                    const projectSummary = await this.projectAnalyzer.getProjectSummary(context.cliContext!);
                    
                    progress.report({ message: 'Building command...' });
                    
                    const command = this.commandBuilder.buildImplementationCommand(
                        agent!,
                        filePath,
                        context,
                        featureContent,
                        projectSummary
                    );

                    progress.report({ message: 'Executing CLI command...' });
                    
                    const result = await this.executionService.executeCommand(command, {
                        agent: agent!,
                        cancellationToken: token
                    });

                    if (result.success) {
                        await this.handleSuccessfulGeneration(filePath, result.output, 'plan');
                        vscode.window.showInformationMessage('Implementation plan generated successfully!');
                    } else {
                        await this.handleExecutionError(result, agent!);
                    }
                }
            );
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate plan: ${error}`);
        }
    }

    async switchAgent(): Promise<void> {
        try {
            const selectedAgent = await this.agentManager.showAgentSelectionQuickPick();
            
            if (selectedAgent) {
                const success = await this.agentManager.switchAgent(selectedAgent);
                if (!success) {
                    const installAction = await vscode.window.showErrorMessage(
                        'Failed to switch agent. Would you like to see installation instructions?',
                        'Show Instructions', 'Cancel'
                    );
                    
                    if (installAction === 'Show Instructions') {
                        await this.agentManager.showInstallationGuide();
                    }
                }
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to switch agent: ${error}`);
        }
    }

    async refreshAgents(): Promise<void> {
        try {
            await this.agentManager.refreshAgents();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh agents: ${error}`);
        }
    }

    async showAgentStatus(): Promise<void> {
        const agent = this.agentManager.getSelectedAgent();
        
        if (!agent) {
            vscode.window.showInformationMessage(
                'No CLI agent selected. Use "Switch Agent" to select one.'
            );
            return;
        }

        const testResult = await this.executionService.testAgentConnection(agent);
        
        const statusItems: vscode.QuickPickItem[] = [
            {
                label: '$(info) Agent Information',
                description: `${agent.displayName} v${agent.version}`,
                detail: testResult.message
            },
            {
                label: '$(check) Available',
                description: testResult.isAvailable ? 'Yes' : 'No',
            },
            {
                label: '$(key) Authenticated',
                description: testResult.isAuthenticated ? 'Yes' : 'No',
            },
            {
                label: '$(tools) Supported Features',
                description: `${agent.supportedFeatures.length} features`,
                detail: agent.supportedFeatures.join(', ')
            }
        ];

        await vscode.window.showQuickPick(statusItems, {
            title: `${agent.displayName} Status`,
            placeHolder: 'Agent status information'
        });
    }

    async runInTerminal(featureUri?: vscode.Uri): Promise<void> {
        try {
            const filePath = await this.resolveFeatureFile(featureUri);
            if (!filePath) return;

            const agent = this.agentManager.getSelectedAgent();
            if (!agent) {
                vscode.window.showErrorMessage('No CLI agent selected. Please select an agent first.');
                return;
            }

            // Show operation selection
            const operations = [
                { label: 'Generate Questions', value: 'questionnaire' },
                { label: 'Generate Plan', value: 'implementation' },
                { label: 'Generate Code', value: 'codegen' },
                { label: 'Analyze File', value: 'analysis' }
            ].filter(op => agent.supportedFeatures.includes(op.value as CLIFeature));

            const selectedOp = await vscode.window.showQuickPick(operations, {
                title: 'Select Operation',
                placeHolder: 'Choose what to generate'
            });

            if (!selectedOp) return;

            const context = await this.getProjectContext();
            const featureContent = await this.readFeatureFile(filePath);
            const projectSummary = await this.projectAnalyzer.getProjectSummary(context.cliContext!);

            let command: string;
            
            switch (selectedOp.value) {
                case 'questionnaire':
                    command = this.commandBuilder.buildQuestionnaireCommand(
                        agent, filePath, context, featureContent, projectSummary
                    );
                    break;
                case 'implementation':
                    command = this.commandBuilder.buildImplementationCommand(
                        agent, filePath, context, featureContent, projectSummary
                    );
                    break;
                case 'codegen':
                    command = this.commandBuilder.buildCodeGenerationCommand(
                        agent, filePath, context, featureContent, projectSummary, ''
                    );
                    break;
                case 'analysis':
                    command = this.commandBuilder.buildFileAnalysisCommand(
                        agent, filePath, context, featureContent, projectSummary
                    );
                    break;
                default:
                    return;
            }

            await this.executionService.executeCommandInTerminal(command, {
                terminalName: `CodeSpec - ${agent.displayName}`,
                showTerminal: true
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to run in terminal: ${error}`);
        }
    }

    // Helper methods

    private async resolveFeatureFile(featureUri?: vscode.Uri): Promise<string | undefined> {
        if (featureUri) {
            return featureUri.fsPath;
        }

        // Try to get active editor
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName.endsWith('.md')) {
            return activeEditor.document.fileName;
        }

        // Show file picker
        const fileUri = await vscode.window.showOpenDialog({
            title: 'Select Feature File',
            filters: {
                'Markdown Files': ['md'],
                'All Files': ['*']
            },
            canSelectMany: false
        });

        return fileUri?.[0]?.fsPath;
    }

    private async readFeatureFile(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read feature file: ${error}`);
        }
    }

    private async getProjectContext(): Promise<ProjectContext> {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspacePath) {
            throw new Error('No workspace folder found');
        }

        const cliContext = await this.projectAnalyzer.analyzeProject(workspacePath);

        // Create basic project context (you may need to enhance this based on existing implementation)
        return {
            framework: cliContext.framework || 'Unknown',
            language: cliContext.projectType,
            packageManager: cliContext.packageManager || 'Unknown',
            importantFiles: [],
            dependencies: cliContext.dependencies.map(d => d.name),
            projectStructure: cliContext.projectStructure.map(f => f.path),
            cliContext
        };
    }

    private async handleSuccessfulGeneration(
        filePath: string,
        output: string,
        type: 'questions' | 'plan'
    ): Promise<void> {
        // Create output file
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, path.extname(filePath));
        const outputFileName = `${basename}-${type}.md`;
        const outputPath = path.join(dir, outputFileName);

        try {
            const content = this.formatOutput(output, type);
            await fs.promises.writeFile(outputPath, content, 'utf8');

            // Open the generated file
            const doc = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(doc);

        } catch (error) {
            // Fallback: show in new document
            const doc = await vscode.workspace.openTextDocument({
                content: this.formatOutput(output, type),
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        }
    }

    private formatOutput(output: string, type: 'questions' | 'plan'): string {
        const timestamp = new Date().toISOString();
        const title = type === 'questions' ? 'Generated Questions' : 'Implementation Plan';
        
        return `# ${title}

*Generated on: ${timestamp}*

${output}

---
*Generated using CodeSpec CLI Integration*
`;
    }

    private async handleExecutionError(result: any, agent: any): Promise<void> {
        let errorMessage = `Command failed: ${result.error || 'Unknown error'}`;
        
        if (result.error?.includes('authentication') || result.error?.includes('login')) {
            const action = await vscode.window.showErrorMessage(
                `${agent.displayName} authentication required. Please authenticate and try again.`,
                'Show Instructions', 'Retry'
            );
            
            if (action === 'Show Instructions') {
                await this.showAuthenticationInstructions(agent);
            }
        } else {
            vscode.window.showErrorMessage(errorMessage);
        }
    }

    private async showAuthenticationInstructions(agent: any): Promise<void> {
        let instructions = '';
        
        if (agent.name === 'claude-code') {
            instructions = `# Claude Code Authentication

To authenticate with Claude Code:

1. Run: \`claude auth login\`
2. Follow the prompts to log in
3. Verify authentication: \`claude auth status\`

After authentication, try the CodeSpec operation again.`;
        } else if (agent.name === 'gemini-cli') {
            instructions = `# Gemini CLI Authentication

To authenticate with Google Cloud CLI:

1. Run: \`gcloud auth login\`
2. Follow the browser authentication flow
3. Verify authentication: \`gcloud auth list\`
4. Ensure AI Platform is enabled: \`gcloud services enable aiplatform.googleapis.com\`

After authentication, try the CodeSpec operation again.`;
        }

        const doc = await vscode.workspace.openTextDocument({
            content: instructions,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }

    dispose(): void {
        this.executionService.dispose();
    }
}