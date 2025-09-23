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

_Answer:_

### 3. **CLI Command Execution**

-   Should the CLI commands be executed directly in the `CommandBuilder`, or should we create a separate `CLIService` for execution?
-   How should we handle authentication for Claude Code and Gemini CLI (API keys, login status)?

_Answer:_

### 4. **Agent Detection Strategy**

-   What commands should we use to detect Claude Code? (`claude --version`, `claude-code --version`, or check for specific installation paths?)
-   For Gemini CLI, what's the expected command structure? (`gemini --version`, `gcloud ai --help`, etc.)

_Answer:_

### 5. **Error Handling and Fallbacks**

-   If no CLI agents are detected, should we show a helpful installation guide or disable CLI features?
-   Should we support a "mock mode" for testing without actual CLI tools installed?

_Answer:_

### 6. **Configuration and Persistence**

-   Should the selected agent be persisted in VS Code settings or workspace settings?
-   Do we need to add new configuration options to `package.json` for CLI agent preferences?

_Answer:_

### 7. **Integration with Existing Commands**

-   Should we add new commands to `package.json` for CLI-related actions (e.g., "Generate Questions", "Generate Plan", "Switch Agent")?
-   How should these integrate with the existing tree view context menus?

_Answer:_

### 8. **Prompt Templates and Context**

-   Should we create a `src/constants/prompts.ts` file for LLM prompt templates as shown in the README?
-   How detailed should the project context be when passed to CLI agents (full file contents, just structure, or configurable)?

_Answer:_
