import * as vscode from 'vscode';
import { CLIAgentInfo, CLIFeature } from '../models/cliAgent';
import { CLIDetector } from '../utils/cliDetector';

export class AgentManager {
    private static instance: AgentManager;
    private availableAgents: CLIAgentInfo[] = [];
    private selectedAgent: CLIAgentInfo | null = null;
    private detector: CLIDetector;
    private onAgentChangedEmitter = new vscode.EventEmitter<CLIAgentInfo | null>();
    private onAgentsRefreshedEmitter = new vscode.EventEmitter<CLIAgentInfo[]>();

    public readonly onAgentChanged = this.onAgentChangedEmitter.event;
    public readonly onAgentsRefreshed = this.onAgentsRefreshedEmitter.event;

    private constructor() {
        this.detector = new CLIDetector();
    }

    public static getInstance(): AgentManager {
        if (!AgentManager.instance) {
            AgentManager.instance = new AgentManager();
        }
        return AgentManager.instance;
    }

    async initializeAgents(): Promise<void> {
        try {
            this.availableAgents = await this.detector.detectAllAvailableAgents();
            
            // Auto-select the first available and authenticated agent
            const authenticatedAgent = this.availableAgents.find(
                agent => agent.isAvailable && agent.isAuthenticated
            );
            
            if (authenticatedAgent) {
                this.selectedAgent = authenticatedAgent;
            } else {
                // Fallback to first available agent (even if not authenticated)
                const availableAgent = this.availableAgents.find(agent => agent.isAvailable);
                this.selectedAgent = availableAgent || null;
            }

            this.onAgentsRefreshedEmitter.fire(this.availableAgents);
            this.onAgentChangedEmitter.fire(this.selectedAgent);

            console.log(`Agent Manager initialized. Available agents: ${this.availableAgents.length}, Selected: ${this.selectedAgent?.displayName || 'None'}`);
        } catch (error) {
            console.error('Failed to initialize agents:', error);
            vscode.window.showErrorMessage('Failed to detect CLI agents. Please check your installation.');
        }
    }

    async refreshAgents(): Promise<void> {
        console.log('Refreshing agent detection...');
        await this.initializeAgents();
        vscode.window.showInformationMessage(
            `Refreshed agents. Found ${this.getAvailableAgentsCount()} available CLI tools.`
        );
    }

    async switchAgent(agentName: string): Promise<boolean> {
        const agent = this.availableAgents.find(a => a.name === agentName);
        
        if (!agent) {
            vscode.window.showErrorMessage(`Agent '${agentName}' not found.`);
            return false;
        }

        if (!agent.isAvailable) {
            vscode.window.showErrorMessage(
                `Agent '${agent.displayName}' is not available. Please install it first.`
            );
            return false;
        }

        if (!agent.isAuthenticated) {
            const result = await vscode.window.showWarningMessage(
                `Agent '${agent.displayName}' is not authenticated. You may need to log in first. Continue anyway?`,
                'Continue', 'Cancel'
            );
            
            if (result !== 'Continue') {
                return false;
            }
        }

        this.selectedAgent = agent;
        this.onAgentChangedEmitter.fire(this.selectedAgent);
        
        vscode.window.showInformationMessage(
            `Switched to ${agent.displayName} (${agent.version})`
        );
        
        return true;
    }

    getSelectedAgent(): CLIAgentInfo | null {
        return this.selectedAgent;
    }

    getAvailableAgents(): CLIAgentInfo[] {
        return [...this.availableAgents];
    }

    getAvailableAgentsCount(): number {
        return this.availableAgents.filter(agent => agent.isAvailable).length;
    }

    getAuthenticatedAgents(): CLIAgentInfo[] {
        return this.availableAgents.filter(agent => agent.isAvailable && agent.isAuthenticated);
    }

    hasSelectedAgent(): boolean {
        return this.selectedAgent !== null;
    }

    isSelectedAgentAvailable(): boolean {
        return this.selectedAgent?.isAvailable ?? false;
    }

    isSelectedAgentAuthenticated(): boolean {
        return this.selectedAgent?.isAuthenticated ?? false;
    }

    supportsFeature(feature: CLIFeature): boolean {
        return this.selectedAgent?.supportedFeatures.includes(feature) ?? false;
    }

    getAgentStatus(): string {
        if (!this.selectedAgent) {
            return 'No agent selected';
        }

        const status = [];
        status.push(this.selectedAgent.displayName);
        
        if (!this.selectedAgent.isAvailable) {
            status.push('(Not Available)');
        } else if (!this.selectedAgent.isAuthenticated) {
            status.push('(Not Authenticated)');
        } else {
            status.push('(Ready)');
        }

        return status.join(' ');
    }

    async showAgentSelectionQuickPick(): Promise<string | undefined> {
        const items = this.availableAgents.map(agent => ({
            label: agent.displayName,
            description: this.getAgentDescription(agent),
            detail: this.getAgentDetail(agent),
            agent: agent.name
        }));

        if (items.length === 0) {
            vscode.window.showWarningMessage(
                'No CLI agents detected. Please install Claude Code or Gemini CLI first.'
            );
            return undefined;
        }

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a CLI agent',
            title: 'CLI Agent Selection'
        });

        return selected?.agent;
    }

    private getAgentDescription(agent: CLIAgentInfo): string {
        if (!agent.isAvailable) {
            return 'Not installed';
        }
        if (!agent.isAuthenticated) {
            return `v${agent.version} - Not authenticated`;
        }
        return `v${agent.version} - Ready`;
    }

    private getAgentDetail(agent: CLIAgentInfo): string {
        const features = agent.supportedFeatures.length;
        const status = agent.isAvailable ? 
            (agent.isAuthenticated ? 'authenticated' : 'needs authentication') : 
            'not installed';
        
        return `${features} features supported - ${status}`;
    }

    async showInstallationGuide(): Promise<void> {
        const unavailableAgents = this.availableAgents.filter(agent => !agent.isAvailable);
        
        if (unavailableAgents.length === 0) {
            vscode.window.showInformationMessage('All supported CLI agents are already installed!');
            return;
        }

        const installGuide = this.generateInstallationGuide(unavailableAgents);
        
        const action = await vscode.window.showInformationMessage(
            'Some CLI agents are not installed. Would you like to see installation instructions?',
            'Show Guide', 'Later'
        );

        if (action === 'Show Guide') {
            const doc = await vscode.workspace.openTextDocument({
                content: installGuide,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        }
    }

    private generateInstallationGuide(unavailableAgents: CLIAgentInfo[]): string {
        let guide = '# CLI Agent Installation Guide\n\n';
        
        for (const agent of unavailableAgents) {
            guide += `## ${agent.displayName}\n\n`;
            
            if (agent.name === 'claude-code') {
                guide += `To install Claude Code CLI:\n\n`;
                guide += `1. Visit: https://claude.ai/code\n`;
                guide += `2. Follow the installation instructions for your platform\n`;
                guide += `3. Run \`claude auth login\` to authenticate\n\n`;
            } else if (agent.name === 'gemini-cli') {
                guide += `To install Gemini CLI (Google Cloud SDK):\n\n`;
                guide += `1. Visit: https://cloud.google.com/sdk/docs/install\n`;
                guide += `2. Install the Google Cloud SDK\n`;
                guide += `3. Run \`gcloud auth login\` to authenticate\n`;
                guide += `4. Enable the AI Platform: \`gcloud services enable aiplatform.googleapis.com\`\n\n`;
            }
        }

        guide += `## Verify Installation\n\n`;
        guide += `After installation, refresh the agent detection in CodeSpec to verify the setup.\n`;

        return guide;
    }

    dispose(): void {
        this.onAgentChangedEmitter.dispose();
        this.onAgentsRefreshedEmitter.dispose();
    }
}