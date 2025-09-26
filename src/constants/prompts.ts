export const PROMPT_TEMPLATES = {
    QUESTIONNAIRE: {
        CLAUDE_CODE: `You are analyzing a software project to generate comprehensive questions for feature specification.

Project Context:
{projectSummary}

Current Feature File:
{featureContent}

Important Files Analysis:
{importantFilesAnalysis}

Generate 10-15 thoughtful questions that will help gather complete requirements for this feature. Focus on:
- Functional requirements and core behavior
- Non-functional requirements (performance, security, accessibility)
- Edge cases and error handling scenarios
- Integration points with existing systems
- User experience and interface considerations
- Data requirements and validation rules
- Testing and quality assurance needs

Format your response as a numbered list of questions. Each question should be specific, actionable, and help clarify requirements that would be essential for implementation.

Example format:
1. What specific data should be validated when a user submits the form?
2. How should the system handle concurrent users accessing the same resource?
3. What accessibility standards should this feature comply with?

Please generate questions that are relevant to this specific feature and project context.`,

        GEMINI_CLI: `Analyze this software project and generate detailed specification questions for the given feature.

Project Information:
{projectSummary}

Feature to Analyze:
{featureContent}

Important Files Analysis:
{importantFilesAnalysis}

Create 10-15 comprehensive questions that will help gather complete requirements for implementing this feature. Consider:
- Core functionality and user workflows
- Technical constraints and dependencies
- Error scenarios and edge cases
- Performance and scalability requirements
- Security and data protection needs
- User interface and experience requirements
- Integration requirements with existing systems

Provide questions as a numbered list that will help developers understand exactly what needs to be built and how it should behave.`
    },

    IMPLEMENTATION: {
        CLAUDE_CODE: `You are creating an implementation plan for a software feature based on project analysis and requirements.

Project Context:
{projectSummary}

Feature Specification:
{featureContent}

Important Files Analysis:
{importantFilesAnalysis}

Create a detailed implementation plan that includes:

## 1. Technical Approach
- Architecture and design patterns to use
- Key components and their responsibilities
- Integration points with existing code

## 2. Implementation Steps
- Ordered list of development tasks
- Dependencies between tasks
- Estimated complexity for each step

## 3. Files to Create/Modify
- Specific file paths and their purposes
- New components or modules needed
- Existing files that need updates

## 4. Key Considerations
- Potential challenges and solutions
- Performance implications
- Security considerations
- Testing strategy

## 5. Acceptance Criteria
- Testable conditions for completion
- Success metrics
- Quality gates

Structure your response to provide actionable guidance for a developer implementing this feature in the given project context.`,

        GEMINI_CLI: `Create a comprehensive implementation plan for the specified feature in this software project.

Project Details:
{projectSummary}

Feature Requirements:
{featureContent}

Important Files Analysis:
{importantFilesAnalysis}

Develop a detailed plan covering:
- Technical approach and architecture
- Step-by-step implementation tasks
- Required files and components
- Integration considerations
- Testing strategy
- Potential challenges and solutions

Provide specific, actionable guidance that a developer can follow to implement this feature successfully.`
    },

    CODE_GENERATION: {
        CLAUDE_CODE: `Generate production-ready code for the specified feature based on the project context and requirements.

Project Context:
{projectSummary}

Feature Specification:
{featureContent}

Implementation Requirements:
{implementationContext}

Generate code that:
- Follows the project's existing patterns and conventions
- Includes proper error handling and validation
- Has appropriate TypeScript types (if applicable)
- Includes relevant unit tests
- Follows security best practices
- Is well-documented with comments

Provide the code for each file that needs to be created or modified, with clear file paths and explanations of the implementation choices.`,

        GEMINI_CLI: `Generate code implementation for the feature based on the project requirements and context.

Project Information:
{projectSummary}

Feature Details:
{featureContent}

Implementation Context:
{implementationContext}

Create production-quality code that integrates well with the existing project structure, follows best practices, and includes proper error handling and documentation.`
    },

    FILE_ANALYSIS: {
        CLAUDE_CODE: `Analyze the provided file in the context of the software project to understand its role and suggest improvements.

Project Context:
{projectSummary}

File Content:
{fileContent}

File Path:
{filePath}

Provide analysis covering:
- Purpose and functionality of this file
- How it fits into the overall project architecture
- Code quality and adherence to best practices
- Potential improvements or refactoring opportunities
- Security considerations
- Performance implications
- Dependencies and coupling with other components

Include specific, actionable recommendations for enhancing this file.`,

        GEMINI_CLI: `Analyze the given file within the project context and provide insights about its functionality and potential improvements.

Project Details:
{projectSummary}

File to Analyze:
File Path: {filePath}
{fileContent}

Provide analysis of the file's purpose, quality, and suggestions for improvement within the project context.`
    }
};

export interface PromptContext {
    projectSummary: string;
    featureContent: string;
    implementationContext?: string;
    fileContent?: string;
    filePath?: string;
    importantFilesAnalysis?: string;
}

export class PromptBuilder {
    static buildPrompt(template: string, context: PromptContext): string {
        let prompt = template;
        
        // Replace placeholders with actual values
        prompt = prompt.replace('{projectSummary}', context.projectSummary || 'No project context available');
        prompt = prompt.replace('{featureContent}', context.featureContent || 'No feature content provided');
        prompt = prompt.replace('{implementationContext}', context.implementationContext || 'No implementation context provided');
        prompt = prompt.replace('{fileContent}', context.fileContent || 'No file content provided');
        prompt = prompt.replace('{filePath}', context.filePath || 'No file path provided');
        prompt = prompt.replace('{importantFilesAnalysis}', context.importantFilesAnalysis || 'No important files specified');
        
        return prompt.trim();
    }

    static getTemplate(operation: 'questionnaire' | 'implementation' | 'codegen' | 'analysis', agent: 'claude-code' | 'gemini-cli'): string {
        const agentKey = agent.toUpperCase().replace('-', '_') as 'CLAUDE_CODE' | 'GEMINI_CLI';
        
        switch (operation) {
            case 'questionnaire':
                return PROMPT_TEMPLATES.QUESTIONNAIRE[agentKey];
            case 'implementation':
                return PROMPT_TEMPLATES.IMPLEMENTATION[agentKey];
            case 'codegen':
                return PROMPT_TEMPLATES.CODE_GENERATION[agentKey];
            case 'analysis':
                return PROMPT_TEMPLATES.FILE_ANALYSIS[agentKey];
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }

    static validatePromptLength(prompt: string, maxLength: number = 8000): { isValid: boolean; length: number; message?: string } {
        const length = prompt.length;
        
        if (length <= maxLength) {
            return { isValid: true, length };
        }
        
        return {
            isValid: false,
            length,
            message: `Prompt exceeds maximum length of ${maxLength} characters (current: ${length})`
        };
    }

    static truncateContext(context: PromptContext, maxLength: number = 6000): PromptContext {
        const truncated = { ...context };
        
        // Truncate long content to fit within limits
        if (truncated.featureContent && truncated.featureContent.length > maxLength / 3) {
            truncated.featureContent = truncated.featureContent.substring(0, maxLength / 3) + '\n\n[Content truncated for length...]';
        }
        
        if (truncated.projectSummary && truncated.projectSummary.length > maxLength / 6) {
            truncated.projectSummary = truncated.projectSummary.substring(0, maxLength / 6) + '\n\n[Summary truncated for length...]';
        }
        
        if (truncated.fileContent && truncated.fileContent.length > maxLength / 3) {
            truncated.fileContent = truncated.fileContent.substring(0, maxLength / 3) + '\n\n[File content truncated for length...]';
        }
        
        if (truncated.importantFilesAnalysis && truncated.importantFilesAnalysis.length > maxLength / 3) {
            truncated.importantFilesAnalysis = truncated.importantFilesAnalysis.substring(0, maxLength / 3) + '\n\n[Files analysis truncated for length...]';
        }
        
        return truncated;
    }
}