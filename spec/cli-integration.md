### Phase 3: CLI Integration Foundation (Days 7-10)

#### 3.1 CLI Detection System

```typescript
// src/utils/cliDetector.ts
export class CLIDetector {
    async detectClaudeCode(): Promise<CLIAgentInfo>;
    async detectGeminiCLI(): Promise<CLIAgentInfo>;
    async detectAllAvailableAgents(): Promise<CLIAgentInfo[]>;
    private async checkCommand(command: string): Promise<boolean>;
    private async getVersion(command: string): Promise<string>;
}
```

#### 3.2 Agent Manager

```typescript
// src/services/agentManager.ts
export class AgentManager {
    private availableAgents: CLIAgentInfo[] = [];
    private selectedAgent: CLIAgentInfo | null = null;

    async initializeAgents(): Promise<void>;
    async switchAgent(agentName: string): Promise<void>;
    getSelectedAgent(): CLIAgentInfo | null;
    getAvailableAgents(): CLIAgentInfo[];
}
```

#### 3.3 Command Builder

```typescript
// src/utils/commandBuilder.ts
export class CommandBuilder {
    buildQuestionnaireCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext
    ): string;
    buildImplementationCommand(
        agent: CLIAgentInfo,
        filePath: string,
        context: ProjectContext
    ): string;
    private buildClaudeCodeCommand(filePath: string, prompt: string): string;
    private buildGeminiCLICommand(filePath: string, prompt: string): string;
}
```

---

## Clarification Questions

### 1. **CLI Agent Interface Definition**

-   Should I create a separate `src/models/cliAgent.ts` file to define the `CLIAgentInfo` interface?
-   What properties should `CLIAgentInfo` include? (name, command, version, isAvailable, supportedFeatures, etc.)

_Answer:_ Yes, create cliAgent.ts. Choose whichever you think might be required

### 2. **Project Context Analysis Service**

-   Do we need to implement a `ProjectAnalyzer` service as mentioned in Phase 4, or should the `CommandBuilder` use the existing `ProjectContext` interface directly?
-   Should project analysis be done once during initialization or dynamically for each command?

_Answer:_ Implement ProjectAnalyser. A hybrid analysis would work i feel. An initial analysis during intialization and can be improvised on the command. W

### 3. **CLI Command Execution**

-   Should the CLI commands be executed directly in the `CommandBuilder`, or should we create a separate `CLIService` for execution?
-   How should we handle authentication for Claude Code and Gemini CLI (API keys, login status)?

_Answer:_ Execute in CommandBuilder. I don't want any separate authentication for extenstion. Just make sure that user has logged in to claude code or gemini cli. If not, pop up with a message asking user to authenticate first

### 4. **Agent Detection Strategy**

-   What commands should we use to detect Claude Code? (`claude --version`, `claude-code --version`, or check for specific installation paths?)
-   For Gemini CLI, what's the expected command structure? (`gemini --version`, `gcloud ai --help`, etc.)

_Answer:_ Whichever is more reliable. I'd say try go with claude --version because checking the path may end up with permission headache

### 5. **Error Handling and Fallbacks**

-   If no CLI agents are detected, should we show a helpful installation guide or disable CLI features?
-   Should we support a "mock mode" for testing without actual CLI tools installed?

_Answer:_ Yeah, you can provide a message with installation guide.

-   yeah, add a support for mock mode for testing. but should only be used while testing

### 6. **Configuration and Persistence**

-   Should the selected agent be persisted in VS Code settings or workspace settings?
-   Do we need to add new configuration options to `package.json` for CLI agent preferences?

_Answer:_ - No need to change vs code settings or worksapce settings. No need to ad new config options in package.json

### 7. **Integration with Existing Commands**

-   Should we add new commands to `package.json` for CLI-related actions (e.g., "Generate Questions", "Generate Plan", "Switch Agent")?
-   How should these integrate with the existing tree view context menus?

_Answer:_ nope, no changes in package.json

### 8. **Prompt Templates and Context**

-   Should we create a `src/constants/prompts.ts` file for LLM prompt templates as shown in the README?
-   How detailed should the project context be when passed to CLI agents (full file contents, just structure, or configurable)?

_Answer:_ yes, create prompts.ts

-   for now, pass fulll file contents

---

## Detailed Implementation Plan

### Overview
This implementation plan provides step-by-step guidance for implementing CLI integration with Claude Code and Gemini CLI agents. The plan is structured to enable seamless agent detection, command building, and execution within the VS Code extension.

### Phase 1: Core Models and Interfaces

#### 1.1 CLI Agent Model (`src/models/cliAgent.ts`)
**Estimated Time:** 1-2 hours

```typescript
export interface CLIAgentInfo {
    name: string;                    // 'claude-code' | 'gemini-cli'
    displayName: string;             // 'Claude Code' | 'Gemini CLI'
    command: string;                 // Base command ('claude', 'gcloud')
    version: string;                 // Detected version
    isAvailable: boolean;            // Installation status
    isAuthenticated: boolean;        // Authentication status
    supportedFeatures: CLIFeature[]; // Supported capabilities
    executablePath?: string;         // Optional path to executable
}

export enum CLIFeature {
    QUESTIONNAIRE_GENERATION = 'questionnaire',
    IMPLEMENTATION_PLANNING = 'planning',
    CODE_GENERATION = 'codegen',
    FILE_ANALYSIS = 'analysis'
}

export interface CLIExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    exitCode: number;
}
```

**Implementation Steps:**
1. Create the interface file with TypeScript definitions
2. Define comprehensive CLI agent properties
3. Include feature enumeration for capability tracking
4. Add execution result interface for command responses

#### 1.2 Project Context Model Enhancement (`src/models/projectContext.ts`)
**Estimated Time:** 2-3 hours

```typescript
export interface ProjectContext {
    // Existing properties...
    cliContext: CLIProjectContext;
}

export interface CLIProjectContext {
    projectType: 'typescript' | 'javascript' | 'python' | 'java' | 'other';
    framework?: string;              // React, Vue, Angular, etc.
    packageManager?: string;         // npm, yarn, pnpm
    buildTools: string[];           // webpack, vite, rollup
    testFramework?: string;         // jest, mocha, pytest
    dependencies: PackageInfo[];    // Key dependencies
    projectStructure: FileStructure[];
    configFiles: ConfigFile[];
}

export interface PackageInfo {
    name: string;
    version: string;
    isDevDependency: boolean;
}

export interface FileStructure {
    path: string;
    type: 'file' | 'directory';
    size?: number;
    lastModified?: Date;
}

export interface ConfigFile {
    name: string;
    path: string;
    content: string;
}
```

### Phase 2: Detection and Management Services

#### 2.1 CLI Detector Implementation (`src/utils/cliDetector.ts`)
**Estimated Time:** 4-5 hours

**Core Detection Logic:**
```typescript
export class CLIDetector {
    private static readonly CLAUDE_COMMANDS = ['claude', 'claude-code'];
    private static readonly GEMINI_COMMANDS = ['gcloud'];
    
    async detectClaudeCode(): Promise<CLIAgentInfo> {
        // Implementation strategy:
        // 1. Try 'claude --version' command
        // 2. Check for common installation paths
        // 3. Verify authentication status with 'claude auth status'
        // 4. Return CLIAgentInfo with detected capabilities
    }
    
    async detectGeminiCLI(): Promise<CLIAgentInfo> {
        // Implementation strategy:
        // 1. Try 'gcloud --version' command
        // 2. Check for AI platform components
        // 3. Verify authentication with 'gcloud auth list'
        // 4. Return CLIAgentInfo with detected capabilities
    }
}
```

**Implementation Steps:**
1. Create command execution utility using VS Code's terminal API
2. Implement version detection for each CLI tool
3. Add authentication status checking
4. Create fallback detection mechanisms
5. Add mock mode support for testing environments
6. Implement error handling for permission issues

#### 2.2 Agent Manager Service (`src/services/agentManager.ts`)
**Estimated Time:** 3-4 hours

**Key Responsibilities:**
- Maintain registry of available CLI agents
- Handle agent selection and switching
- Persist agent preferences in memory
- Provide agent capability querying

**Implementation Steps:**
1. Create singleton pattern for agent management
2. Implement initialization routine that runs on extension activation
3. Add agent switching functionality with validation
4. Create getter methods for UI components
5. Add event emitters for agent state changes
6. Implement refresh mechanism for agent status updates

#### 2.3 Project Analyzer Service (`src/services/projectAnalyzer.ts`)
**Estimated Time:** 5-6 hours

**Analysis Capabilities:**
```typescript
export class ProjectAnalyzer {
    async analyzeProject(workspacePath: string): Promise<CLIProjectContext> {
        // 1. Detect project type from package.json, requirements.txt, etc.
        // 2. Identify framework from dependencies and file structure
        // 3. Analyze build configuration files
        // 4. Extract dependency information
        // 5. Map project structure for context
        // 6. Cache results for performance
    }
    
    async getProjectSummary(context: CLIProjectContext): Promise<string> {
        // Generate human-readable project summary for CLI prompts
    }
}
```

**Implementation Steps:**
1. Create file system analysis utilities
2. Implement package.json parsing for Node.js projects
3. Add support for Python, Java, and other project types
4. Create dependency extraction logic
5. Implement caching mechanism for performance
6. Add incremental analysis for file changes

### Phase 3: Command Building and Execution

#### 3.1 Prompt Templates (`src/constants/prompts.ts`)
**Estimated Time:** 2-3 hours

**Template Structure:**
```typescript
export const PROMPT_TEMPLATES = {
    QUESTIONNAIRE: {
        CLAUDE_CODE: `
You are analyzing a software project to generate comprehensive questions for feature specification.

Project Context:
{projectSummary}

Current Feature File:
{featureContent}

Generate 10-15 thoughtful questions that will help gather complete requirements for this feature. Focus on:
- Functional requirements
- Non-functional requirements  
- Edge cases and error handling
- Integration points
- User experience considerations
        `,
        GEMINI_CLI: `
Analyze this project and generate detailed specification questions.

Project: {projectSummary}
Feature: {featureContent}

Create comprehensive questions covering all aspects of feature development.
        `
    },
    IMPLEMENTATION: {
        // Similar structure for implementation planning
    }
};
```

**Implementation Steps:**
1. Create template constants for different CLI agents
2. Define placeholder replacement mechanism
3. Add context-aware prompt customization
4. Create template validation logic
5. Implement prompt length optimization for CLI limits

#### 3.2 Command Builder (`src/utils/commandBuilder.ts`)
**Estimated Time:** 4-5 hours

**Command Construction Logic:**
```typescript
export class CommandBuilder {
    buildQuestionnaireCommand(
        agent: CLIAgentInfo, 
        filePath: string, 
        context: ProjectContext
    ): string {
        // 1. Select appropriate prompt template
        // 2. Replace context placeholders
        // 3. Format for specific CLI agent
        // 4. Add necessary flags and options
        // 5. Escape special characters
        // 6. Validate command length
    }
    
    private buildClaudeCodeCommand(filePath: string, prompt: string): string {
        // Format: claude code --file="path" --prompt="prompt"
        // Handle file path escaping and prompt formatting
    }
    
    private buildGeminiCLICommand(filePath: string, prompt: string): string {
        // Format: gcloud ai generate --input="path" --prompt="prompt"
        // Handle Gemini CLI specific formatting
    }
}
```

**Implementation Steps:**
1. Create command template system
2. Implement agent-specific formatting logic
3. Add file path handling and escaping
4. Create prompt length validation
5. Add special character escaping
6. Implement command testing utilities

#### 3.3 CLI Execution Service (`src/services/cliExecutionService.ts`)
**Estimated Time:** 3-4 hours

**Execution Capabilities:**
- Terminal-based command execution
- Output streaming and capture
- Error handling and recovery
- Authentication failure detection
- Progress indication for long-running commands

**Implementation Steps:**
1. Create VS Code terminal integration
2. Implement command execution with output capture
3. Add authentication error detection
4. Create progress indication system
5. Implement output parsing and formatting
6. Add error recovery mechanisms

### Phase 4: UI Integration

#### 4.1 Agent Selection UI (`src/views/agentSelectionView.ts`)
**Estimated Time:** 3-4 hours

**UI Components:**
- Agent status indicator in tree view
- Agent switching command palette
- Authentication status display
- Installation guide for missing agents

**Implementation Steps:**
1. Add agent status to feature tree provider
2. Create command palette entries for agent switching
3. Implement status bar item for current agent
4. Add context menu options for agent management
5. Create installation guide webview

#### 4.2 Command Integration (`src/commands/cliCommands.ts`)
**Estimated Time:** 2-3 hours

**New Commands:**
- `codespec.generateQuestions`: Generate questionnaire using selected agent
- `codespec.generatePlan`: Generate implementation plan
- `codespec.switchAgent`: Switch between available agents
- `codespec.refreshAgents`: Refresh agent detection

**Implementation Steps:**
1. Create command implementations
2. Add context menu integration
3. Implement keyboard shortcuts
4. Add command validation and error handling
5. Create progress indication for CLI operations

### Phase 5: Testing and Quality Assurance

#### 5.1 Unit Testing (`test/unit/`)
**Estimated Time:** 6-8 hours

**Test Coverage:**
- CLI detection utilities
- Command building logic
- Project analysis functions
- Agent management services
- Mock mode functionality

**Implementation Steps:**
1. Create test fixtures for different project types
2. Implement CLI command mocking
3. Add agent detection test cases
4. Create command building test suite
5. Implement project analysis tests
6. Add error handling test scenarios

#### 5.2 Integration Testing (`test/integration/`)
**Estimated Time:** 4-5 hours

**Integration Scenarios:**
- End-to-end CLI command execution
- Agent switching workflows
- Project analysis accuracy
- Error recovery mechanisms

**Implementation Steps:**
1. Create test workspace environments
2. Implement CLI tool mocking for CI/CD
3. Add end-to-end workflow testing
4. Create performance benchmarks
5. Implement error scenario testing

### Phase 6: Documentation and Deployment

#### 6.1 Documentation Updates
**Estimated Time:** 2-3 hours

**Documentation Areas:**
- README.md CLI integration section
- Developer guide for CLI commands
- Troubleshooting guide for CLI issues
- Configuration documentation

#### 6.2 Error Handling and User Guidance
**Estimated Time:** 2-3 hours

**Error Scenarios:**
- CLI tool not installed
- Authentication failures
- Command execution errors
- Network connectivity issues
- Permission problems

**Implementation Steps:**
1. Create user-friendly error messages
2. Implement installation guidance
3. Add troubleshooting tips
4. Create recovery workflows
5. Implement logging for debugging

### Implementation Timeline

**Total Estimated Time:** 40-50 hours (5-6 working days)

**Day 1:** Core models and interfaces (Phase 1)
**Day 2:** Detection and management services (Phase 2)
**Day 3:** Command building and execution (Phase 3)
**Day 4:** UI integration (Phase 4)
**Day 5:** Testing and quality assurance (Phase 5)
**Day 6:** Documentation and deployment (Phase 6)

### Success Criteria

1. **Functional Requirements:**
   - Automatic detection of Claude Code and Gemini CLI
   - Seamless agent switching
   - Context-aware command generation
   - Successful CLI command execution
   - Error handling and recovery

2. **Performance Requirements:**
   - Agent detection completes within 5 seconds
   - Command generation within 2 seconds
   - Project analysis caching for improved performance

3. **User Experience Requirements:**
   - Clear agent status indication
   - Intuitive agent switching interface
   - Helpful error messages and guidance
   - Consistent behavior across different project types

4. **Quality Requirements:**
   - 90%+ test coverage for CLI integration components
   - All integration tests passing
   - No breaking changes to existing functionality
   - Comprehensive error handling

### Risk Mitigation

1. **CLI Tool Availability:** Implement graceful degradation when tools aren't available
2. **Authentication Issues:** Provide clear guidance for CLI tool authentication
3. **Platform Differences:** Test on Windows, macOS, and Linux environments
4. **Performance Impact:** Implement caching and lazy loading strategies
5. **Breaking Changes:** Maintain backward compatibility with existing features

This implementation plan provides a comprehensive roadmap for integrating CLI agents into the CodeSpec extension, ensuring robust functionality while maintaining code quality and user experience standards.
