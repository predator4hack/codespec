import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CLIExecutionResult, CLIAgentInfo } from '../models/cliAgent';

export class CLIExecutionService {
    private static readonly DEFAULT_TIMEOUT = 120000; // 2 minutes
    private activeProcesses: Map<string, cp.ChildProcess> = new Map();

    async executeCommand(
        command: string,
        options: {
            cwd?: string;
            timeout?: number;
            agent?: CLIAgentInfo;
            showProgress?: boolean;
            cancellationToken?: vscode.CancellationToken;
        } = {}
    ): Promise<CLIExecutionResult> {
        const {
            cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            timeout = CLIExecutionService.DEFAULT_TIMEOUT,
            agent,
            showProgress = true,
            cancellationToken
        } = options;

        const processId = this.generateProcessId();
        
        if (showProgress) {
            return this.executeWithProgress(command, processId, {
                cwd,
                timeout,
                agent,
                cancellationToken
            });
        } else {
            return this.executeDirectly(command, processId, {
                cwd,
                timeout,
                cancellationToken
            });
        }
    }

    private async executeWithProgress(
        command: string,
        processId: string,
        options: {
            cwd?: string;
            timeout: number;
            agent?: CLIAgentInfo;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<CLIExecutionResult> {
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: this.getProgressTitle(options.agent),
                cancellable: true
            },
            async (progress, token) => {
                // Merge cancellation tokens
                const combinedToken = this.createCombinedCancellationToken(
                    token,
                    options.cancellationToken
                );

                try {
                    progress.report({ message: 'Initializing...' });
                    
                    const result = await this.executeDirectly(command, processId, {
                        cwd: options.cwd,
                        timeout: options.timeout,
                        cancellationToken: combinedToken
                    });

                    if (result.success) {
                        progress.report({ message: 'Command completed successfully' });
                    } else {
                        progress.report({ message: 'Command failed' });
                    }

                    return result;
                } catch (error) {
                    if (token.isCancellationRequested || options.cancellationToken?.isCancellationRequested) {
                        return {
                            success: false,
                            output: '',
                            error: 'Operation was cancelled by user',
                            exitCode: -1
                        };
                    }
                    throw error;
                }
            }
        );
    }

    private async executeDirectly(
        command: string,
        processId: string,
        options: {
            cwd?: string;
            timeout: number;
            cancellationToken?: vscode.CancellationToken;
        }
    ): Promise<CLIExecutionResult> {
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let isResolved = false;

            const process = cp.spawn(command, [], {
                cwd: options.cwd,
                shell: true,
                stdio: ['inherit', 'pipe', 'pipe']
            });

            this.activeProcesses.set(processId, process);

            // Handle cancellation
            const cancellationHandler = () => {
                if (!isResolved) {
                    this.killProcess(processId);
                    isResolved = true;
                    resolve({
                        success: false,
                        output: stdout,
                        error: 'Operation was cancelled',
                        exitCode: -1
                    });
                }
            };

            if (options.cancellationToken) {
                options.cancellationToken.onCancellationRequested(cancellationHandler);
            }

            // Set up timeout
            const timeoutId = setTimeout(() => {
                if (!isResolved) {
                    this.killProcess(processId);
                    isResolved = true;
                    resolve({
                        success: false,
                        output: stdout,
                        error: `Command timed out after ${options.timeout}ms`,
                        exitCode: -1
                    });
                }
            }, options.timeout);

            // Collect stdout
            process.stdout?.on('data', (data) => {
                stdout += data.toString();
            });

            // Collect stderr
            process.stderr?.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            process.on('close', (code) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(processId);
                
                if (!isResolved) {
                    isResolved = true;
                    
                    const result: CLIExecutionResult = {
                        success: code === 0,
                        output: stdout,
                        error: stderr || undefined,
                        exitCode: code || 0
                    };

                    // Check for authentication errors
                    if (this.isAuthenticationError(stderr, stdout)) {
                        result.error = this.getAuthenticationErrorMessage(stderr, stdout);
                    }

                    resolve(result);
                }
            });

            // Handle process errors
            process.on('error', (error) => {
                clearTimeout(timeoutId);
                this.activeProcesses.delete(processId);
                
                if (!isResolved) {
                    isResolved = true;
                    resolve({
                        success: false,
                        output: stdout,
                        error: error.message,
                        exitCode: -1
                    });
                }
            });
        });
    }

    async executeCommandInTerminal(
        command: string,
        options: {
            terminalName?: string;
            showTerminal?: boolean;
            cwd?: string;
        } = {}
    ): Promise<vscode.Terminal> {
        const {
            terminalName = 'CodeSpec CLI',
            showTerminal = true,
            cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
        } = options;

        // Create or reuse terminal
        let terminal = vscode.window.terminals.find(t => t.name === terminalName);
        
        if (!terminal) {
            terminal = vscode.window.createTerminal({
                name: terminalName,
                cwd: cwd
            });
        }

        if (showTerminal) {
            terminal.show();
        }

        // Execute command
        terminal.sendText(command);

        return terminal;
    }

    killProcess(processId: string): boolean {
        const process = this.activeProcesses.get(processId);
        
        if (process) {
            try {
                process.kill('SIGTERM');
                this.activeProcesses.delete(processId);
                return true;
            } catch (error) {
                console.error('Failed to kill process:', error);
                return false;
            }
        }
        
        return false;
    }

    killAllProcesses(): void {
        for (const [processId, process] of this.activeProcesses) {
            try {
                process.kill('SIGTERM');
            } catch (error) {
                console.error(`Failed to kill process ${processId}:`, error);
            }
        }
        this.activeProcesses.clear();
    }

    getActiveProcessCount(): number {
        return this.activeProcesses.size;
    }

    private generateProcessId(): string {
        return `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getProgressTitle(agent?: CLIAgentInfo): string {
        if (agent) {
            return `Running ${agent.displayName}...`;
        }
        return 'Executing CLI Command...';
    }

    private createCombinedCancellationToken(
        token1: vscode.CancellationToken,
        token2?: vscode.CancellationToken
    ): vscode.CancellationToken {
        if (!token2) {
            return token1;
        }

        const source = new vscode.CancellationTokenSource();
        
        const cleanup = () => {
            if (!source.token.isCancellationRequested) {
                source.cancel();
            }
        };

        token1.onCancellationRequested(cleanup);
        token2.onCancellationRequested(cleanup);

        return source.token;
    }

    private isAuthenticationError(stderr: string, stdout: string): boolean {
        const authErrorPatterns = [
            /not authenticated/i,
            /login required/i,
            /authentication failed/i,
            /unauthorized/i,
            /invalid credentials/i,
            /access denied/i,
            /permission denied/i,
            /no credentialed accounts/i
        ];

        const output = (stderr + stdout).toLowerCase();
        return authErrorPatterns.some(pattern => pattern.test(output));
    }

    private getAuthenticationErrorMessage(stderr: string, stdout: string): string {
        const output = stderr + stdout;
        
        if (output.includes('claude') || output.includes('Claude')) {
            return 'Claude Code authentication required. Please run: claude auth login';
        }
        
        if (output.includes('gcloud') || output.includes('google')) {
            return 'Google Cloud authentication required. Please run: gcloud auth login';
        }
        
        return 'Authentication required. Please authenticate with the CLI tool and try again.';
    }

    async testAgentConnection(agent: CLIAgentInfo): Promise<{
        isAvailable: boolean;
        isAuthenticated: boolean;
        message: string;
    }> {
        try {
            // Test basic availability
            const versionResult = await this.executeCommand(`${agent.command} --version`, {
                timeout: 5000,
                showProgress: false
            });

            if (!versionResult.success) {
                return {
                    isAvailable: false,
                    isAuthenticated: false,
                    message: `${agent.displayName} is not installed or not available in PATH`
                };
            }

            // Test authentication if auth command is available
            if (agent.name === 'claude-code') {
                const authResult = await this.executeCommand('claude auth status', {
                    timeout: 5000,
                    showProgress: false
                });

                const isAuthenticated = authResult.success && 
                    !authResult.output.toLowerCase().includes('not authenticated');

                return {
                    isAvailable: true,
                    isAuthenticated,
                    message: isAuthenticated 
                        ? `${agent.displayName} is ready to use`
                        : `${agent.displayName} requires authentication. Run: claude auth login`
                };
            } else if (agent.name === 'gemini-cli') {
                const authResult = await this.executeCommand('gcloud auth list', {
                    timeout: 5000,
                    showProgress: false
                });

                const isAuthenticated = authResult.success && 
                    authResult.output.includes('@') && 
                    !authResult.output.toLowerCase().includes('no credentialed');

                return {
                    isAvailable: true,
                    isAuthenticated,
                    message: isAuthenticated 
                        ? `${agent.displayName} is ready to use`
                        : `${agent.displayName} requires authentication. Run: gcloud auth login`
                };
            }

            return {
                isAvailable: true,
                isAuthenticated: true,
                message: `${agent.displayName} is available`
            };

        } catch (error) {
            return {
                isAvailable: false,
                isAuthenticated: false,
                message: `Failed to test ${agent.displayName}: ${error}`
            };
        }
    }

    dispose(): void {
        this.killAllProcesses();
    }
}