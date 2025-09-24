import * as path from 'path';
import { CLIAgentInfo } from '../models/cliAgent';
import { ProjectContext } from '../models/featureSpec';
import { PromptBuilder, PromptContext } from '../constants/prompts';

export class CommandBuilder {
    private static readonly MAX_COMMAND_LENGTH = 8000;

    buildQuestionnaireCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext,
        featureContent: string,
        projectSummary: string
    ): string {
        const promptContext: PromptContext = {
            projectSummary,
            featureContent
        };

        // Truncate if necessary
        const truncatedContext = PromptBuilder.truncateContext(promptContext);
        
        const template = PromptBuilder.getTemplate('questionnaire', agent.name as 'claude-code' | 'gemini-cli');
        const prompt = PromptBuilder.buildPrompt(template, truncatedContext);

        return this.buildAgentSpecificCommand(agent, filePath, prompt, 'questionnaire');
    }

    buildImplementationCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext,
        featureContent: string,
        projectSummary: string
    ): string {
        const promptContext: PromptContext = {
            projectSummary,
            featureContent
        };

        const truncatedContext = PromptBuilder.truncateContext(promptContext);
        
        const template = PromptBuilder.getTemplate('implementation', agent.name as 'claude-code' | 'gemini-cli');
        const prompt = PromptBuilder.buildPrompt(template, truncatedContext);

        return this.buildAgentSpecificCommand(agent, filePath, prompt, 'implementation');
    }

    buildCodeGenerationCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext,
        featureContent: string,
        projectSummary: string,
        implementationContext: string
    ): string {
        const promptContext: PromptContext = {
            projectSummary,
            featureContent,
            implementationContext
        };

        const truncatedContext = PromptBuilder.truncateContext(promptContext);
        
        const template = PromptBuilder.getTemplate('codegen', agent.name as 'claude-code' | 'gemini-cli');
        const prompt = PromptBuilder.buildPrompt(template, truncatedContext);

        return this.buildAgentSpecificCommand(agent, filePath, prompt, 'codegen');
    }

    buildFileAnalysisCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext,
        fileContent: string,
        projectSummary: string
    ): string {
        const promptContext: PromptContext = {
            projectSummary,
            featureContent: '', // Not needed for file analysis
            fileContent,
            filePath
        };

        const truncatedContext = PromptBuilder.truncateContext(promptContext);
        
        const template = PromptBuilder.getTemplate('analysis', agent.name as 'claude-code' | 'gemini-cli');
        const prompt = PromptBuilder.buildPrompt(template, truncatedContext);

        return this.buildAgentSpecificCommand(agent, filePath, prompt, 'analysis');
    }

    private buildAgentSpecificCommand(
        agent: CLIAgentInfo,
        filePath: string,
        prompt: string,
        operation: string
    ): string {
        switch (agent.name) {
            case 'claude-code':
                return this.buildClaudeCodeCommand(filePath, prompt, operation);
            case 'gemini-cli':
                return this.buildGeminiCLICommand(filePath, prompt, operation);
            default:
                throw new Error(`Unsupported agent: ${agent.name}`);
        }
    }

    private buildClaudeCodeCommand(filePath: string, prompt: string, operation: string): string {
        const escapedFilePath = this.escapeShellArgument(filePath);
        const escapedPrompt = this.escapeShellArgument(prompt);
        
        // Claude Code command structure
        let command = `claude code --file=${escapedFilePath}`;
        
        // Add operation-specific flags if needed
        switch (operation) {
            case 'questionnaire':
                command += ' --task="Generate requirements questions"';
                break;
            case 'implementation':
                command += ' --task="Create implementation plan"';
                break;
            case 'codegen':
                command += ' --task="Generate code"';
                break;
            case 'analysis':
                command += ' --task="Analyze file"';
                break;
        }
        
        command += ` --prompt=${escapedPrompt}`;

        // Validate command length
        if (command.length > CommandBuilder.MAX_COMMAND_LENGTH) {
            throw new Error(`Command exceeds maximum length of ${CommandBuilder.MAX_COMMAND_LENGTH} characters`);
        }

        return command;
    }

    private buildGeminiCLICommand(filePath: string, prompt: string, operation: string): string {
        const escapedFilePath = this.escapeShellArgument(filePath);
        const escapedPrompt = this.escapeShellArgument(prompt);
        
        // Gemini CLI command structure (using gcloud ai)
        let command = `gcloud ai generate`;
        command += ` --input-file=${escapedFilePath}`;
        command += ` --prompt=${escapedPrompt}`;
        
        // Add operation-specific parameters
        switch (operation) {
            case 'questionnaire':
                command += ' --model-type=text --task=requirements-analysis';
                break;
            case 'implementation':
                command += ' --model-type=text --task=planning';
                break;
            case 'codegen':
                command += ' --model-type=code --task=generation';
                break;
            case 'analysis':
                command += ' --model-type=text --task=analysis';
                break;
        }

        // Validate command length
        if (command.length > CommandBuilder.MAX_COMMAND_LENGTH) {
            throw new Error(`Command exceeds maximum length of ${CommandBuilder.MAX_COMMAND_LENGTH} characters`);
        }

        return command;
    }

    private escapeShellArgument(arg: string): string {
        // Handle different shell escaping needs
        if (process.platform === 'win32') {
            return this.escapeWindowsArgument(arg);
        } else {
            return this.escapeUnixArgument(arg);
        }
    }

    private escapeWindowsArgument(arg: string): string {
        // Windows CMD escaping
        if (!arg.includes(' ') && !arg.includes('"') && !arg.includes('\n') && !arg.includes('\r')) {
            return arg;
        }
        
        // Replace quotes and wrap in quotes
        const escaped = arg.replace(/"/g, '""');
        return `"${escaped}"`;
    }

    private escapeUnixArgument(arg: string): string {
        // Unix shell escaping
        if (!arg.includes(' ') && !arg.includes("'") && !arg.includes('"') && 
            !arg.includes('\n') && !arg.includes('\r') && !arg.includes('\\')) {
            return arg;
        }
        
        // Use single quotes for Unix
        const escaped = arg.replace(/'/g, "'\"'\"'");
        return `'${escaped}'`;
    }

    validateCommand(command: string): { isValid: boolean; message?: string } {
        if (command.length > CommandBuilder.MAX_COMMAND_LENGTH) {
            return {
                isValid: false,
                message: `Command exceeds maximum length of ${CommandBuilder.MAX_COMMAND_LENGTH} characters`
            };
        }

        // Check for potentially dangerous characters or patterns
        const dangerousPatterns = [
            /[;&|`$()]/,  // Shell injection characters
            /rm\s+-rf/,   // Dangerous delete commands
            /sudo/,       // Privilege escalation
            /curl.*\|.*sh/, // Pipe to shell execution
        ];

        for (const pattern of dangerousPatterns) {
            if (pattern.test(command)) {
                return {
                    isValid: false,
                    message: 'Command contains potentially unsafe characters or patterns'
                };
            }
        }

        return { isValid: true };
    }

    getCommandPreview(
        agent: CLIAgentInfo,
        operation: 'questionnaire' | 'implementation' | 'codegen' | 'analysis',
        filePath: string
    ): string {
        const fileName = path.basename(filePath);
        
        switch (agent.name) {
            case 'claude-code':
                return `claude code --file="${fileName}" --task="${operation}" --prompt="[Generated prompt...]"`;
            case 'gemini-cli':
                return `gcloud ai generate --input-file="${fileName}" --task="${operation}" --prompt="[Generated prompt...]"`;
            default:
                return `${agent.command} [generated command for ${operation}]`;
        }
    }

    async estimateExecutionTime(
        agent: CLIAgentInfo,
        operation: string,
        promptLength: number
    ): Promise<number> {
        // Rough estimation based on agent and operation type
        let baseTime = 10; // 10 seconds base
        
        // Add time based on operation complexity
        switch (operation) {
            case 'questionnaire':
                baseTime += 15;
                break;
            case 'implementation':
                baseTime += 25;
                break;
            case 'codegen':
                baseTime += 35;
                break;
            case 'analysis':
                baseTime += 20;
                break;
        }
        
        // Add time based on prompt length
        baseTime += Math.floor(promptLength / 1000) * 5;
        
        // Agent-specific adjustments
        if (agent.name === 'gemini-cli') {
            baseTime *= 1.2; // Gemini CLI might be slightly slower
        }
        
        return Math.min(baseTime, 120); // Cap at 2 minutes
    }
}