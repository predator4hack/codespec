import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CLIAgentInfo, CLIAgentConfig, SUPPORTED_AGENTS, CLIFeature } from '../models/cliAgent';

export class CLIDetector {
    private static readonly COMMAND_TIMEOUT = 5000; // 5 seconds
    private mockMode: boolean = false;

    constructor() {
        // Enable mock mode in test environments
        this.mockMode = process.env.NODE_ENV === 'test' || 
                       vscode.workspace.getConfiguration('codespec').get('enableMockMode', false);
    }

    async detectAllAvailableAgents(): Promise<CLIAgentInfo[]> {
        const agents: CLIAgentInfo[] = [];
        
        for (const config of SUPPORTED_AGENTS) {
            try {
                const agent = await this.detectAgent(config);
                agents.push(agent);
            } catch (error) {
                console.warn(`Failed to detect ${config.displayName}:`, error);
                // Add unavailable agent info
                agents.push({
                    name: config.name,
                    displayName: config.displayName,
                    command: config.command,
                    version: 'Unknown',
                    isAvailable: false,
                    isAuthenticated: false,
                    supportedFeatures: config.supportedFeatures
                });
            }
        }

        return agents;
    }

    async detectClaudeCode(): Promise<CLIAgentInfo> {
        const config = SUPPORTED_AGENTS.find(agent => agent.name === 'claude-code');
        if (!config) {
            throw new Error('Claude Code configuration not found');
        }
        return this.detectAgent(config);
    }

    async detectGeminiCLI(): Promise<CLIAgentInfo> {
        const config = SUPPORTED_AGENTS.find(agent => agent.name === 'gemini-cli');
        if (!config) {
            throw new Error('Gemini CLI configuration not found');
        }
        return this.detectAgent(config);
    }

    private async detectAgent(config: CLIAgentConfig): Promise<CLIAgentInfo> {
        if (this.mockMode) {
            return this.createMockAgent(config);
        }

        const isAvailable = await this.checkCommand(config.command, config.versionFlag);
        let version = 'Unknown';
        let isAuthenticated = false;

        if (isAvailable) {
            version = await this.getVersion(config.command, config.versionFlag);
            if (config.authCheckCommand) {
                isAuthenticated = await this.checkAuthentication(config.command, config.authCheckCommand);
            }
        }

        return {
            name: config.name,
            displayName: config.displayName,
            command: config.command,
            version,
            isAvailable,
            isAuthenticated,
            supportedFeatures: config.supportedFeatures
        };
    }

    private async checkCommand(command: string, versionFlag: string): Promise<boolean> {
        try {
            await this.executeCommand(`${command} ${versionFlag}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    private async getVersion(command: string, versionFlag: string): Promise<string> {
        try {
            const output = await this.executeCommand(`${command} ${versionFlag}`);
            return this.parseVersion(output);
        } catch (error) {
            return 'Unknown';
        }
    }

    private async checkAuthentication(command: string, authCommand: string): Promise<boolean> {
        try {
            const output = await this.executeCommand(`${command} ${authCommand}`);
            return this.parseAuthenticationStatus(command, output);
        } catch (error) {
            return false;
        }
    }

    private async executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            cp.exec(command, { timeout: CLIDetector.COMMAND_TIMEOUT }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    private parseVersion(output: string): string {
        // Extract version from various output formats
        const versionRegex = /(\d+\.\d+\.\d+)/;
        const match = output.match(versionRegex);
        return match ? match[1] : output.split('\n')[0];
    }

    private parseAuthenticationStatus(command: string, output: string): boolean {
        if (command === 'claude') {
            // Claude Code authentication check
            return !output.toLowerCase().includes('not authenticated') && 
                   !output.toLowerCase().includes('login required');
        } else if (command === 'gcloud') {
            // Gemini CLI authentication check
            return output.includes('@') && !output.toLowerCase().includes('no credentialed');
        }
        return false;
    }

    private createMockAgent(config: CLIAgentConfig): CLIAgentInfo {
        return {
            name: config.name,
            displayName: config.displayName,
            command: config.command,
            version: '1.0.0-mock',
            isAvailable: true,
            isAuthenticated: true,
            supportedFeatures: config.supportedFeatures
        };
    }

    public enableMockMode(enabled: boolean): void {
        this.mockMode = enabled;
    }

    public isMockMode(): boolean {
        return this.mockMode;
    }
}