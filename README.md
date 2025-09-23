# Feature Spec Extension - VS Code Extension

A VS Code extension that enables developers to create, manage, and enhance feature specifications using AI-powered CLI agents (Claude Code and Gemini CLI).

## 🎯 Project Overview

This extension provides a seamless workflow for:

-   Creating structured feature specifications from templates
-   Generating AI-powered clarifying questions
-   Creating detailed implementation plans
-   Managing feature specs within VS Code's sidebar

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   VS Code UI    │    │  Extension Core  │    │   CLI Agents    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │  Sidebar    │ │◄───┤ │  Services    │ │◄───┤ │ Claude Code │ │
│ │  Tree View  │ │    │ │              │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
│                 │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ ┌─────────────┐ │    │ │  File System │ │    │ │ Gemini CLI  │ │
│ │  Commands   │ │◄───┤ │  Operations  │ │    │ │             │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Directory Structure

```
feature-spec-extension/
├── src/
│   ├── extension.ts                 # Main extension entry point
│   ├── providers/
│   │   ├── featureTreeProvider.ts   # Sidebar tree data provider
│   │   └── webviewProvider.ts       # Custom panels (future use)
│   ├── services/
│   │   ├── cliService.ts            # CLI agent communication
│   │   ├── templateService.ts       # Template management
│   │   ├── fileService.ts           # File operations (.features dir)
│   │   ├── projectAnalyzer.ts       # Project context analysis
│   │   └── agentManager.ts          # CLI agent detection/management
│   ├── models/
│   │   ├── featureSpec.ts           # Feature spec data structures
│   │   ├── cliAgent.ts              # CLI agent interfaces
│   │   └── projectContext.ts        # Project context models
│   ├── utils/
│   │   ├── cliDetector.ts           # CLI tool detection utilities
│   │   ├── commandBuilder.ts        # CLI command construction
│   │   ├── errorHandler.ts          # Error handling and user feedback
│   │   └── logger.ts                # Logging utilities
│   ├── templates/
│   │   └── defaultFeature.md        # Default feature spec template
│   └── constants/
│       ├── commands.ts              # Command constants
│       └── prompts.ts               # LLM prompt templates
├── resources/
│   ├── icons/                       # Extension icons
│   └── templates/                   # Additional templates
├── test/
│   ├── suite/
│   │   ├── extension.test.ts        # Extension tests
│   │   └── services/                # Service tests
│   └── runTest.ts
├── package.json                     # Extension manifest
├── tsconfig.json                    # TypeScript configuration
├── webpack.config.js                # Build configuration
├── .vscodeignore                    # VS Code packaging ignore
└── README.md
```

## 🛠️ Technology Stack

### Core Technologies

-   **Language**: TypeScript 4.9+
-   **Runtime**: Node.js 16+
-   **Framework**: VS Code Extension API
-   **Build Tool**: Webpack 5
-   **Package Manager**: npm

### Key Dependencies

```json
{
    "dependencies": {
        "glob": "^8.0.3",
        "yaml": "^2.3.4",
        "minimatch": "^5.1.0"
    },
    "devDependencies": {
        "@types/vscode": "^1.74.0",
        "@types/node": "16.x",
        "@types/glob": "^8.0.0",
        "typescript": "^4.9.4",
        "webpack": "^5.75.0",
        "webpack-cli": "^5.0.1",
        "ts-loader": "^9.4.1",
        "@vscode/test-electron": "^2.2.0"
    }
}
```

## 📋 Implementation Plan

### Phase 1: Core Infrastructure (Days 1-3)

#### 1.1 Project Setup

-   [ ] Initialize VS Code extension project
-   [ ] Configure TypeScript and Webpack
-   [ ] Set up basic package.json with required contributions
-   [ ] Create directory structure

#### 1.2 Basic Extension Activation

```typescript
// src/extension.ts
export function activate(context: vscode.ExtensionContext) {
    // Register tree data provider
    // Register commands
    // Initialize services
}
```

#### 1.3 Sidebar Integration

-   [ ] Create `FeatureTreeProvider` class
-   [ ] Register tree view in package.json
-   [ ] Implement basic tree view with dummy data
-   [ ] Add sidebar icon and view container

### Phase 2: File Management System (Days 4-6)

#### 2.1 Template Service

```typescript
// src/services/templateService.ts
export class TemplateService {
    async getDefaultTemplate(): Promise<string>;
    async createCustomTemplate(templatePath: string): Promise<void>;
    async populateTemplate(templateData: FeatureSpecData): Promise<string>;
}
```

#### 2.2 File Service

```typescript
// src/services/fileService.ts
export class FileService {
    async ensureFeaturesDirectory(): Promise<void>;
    async createFeatureFile(name: string, content: string): Promise<void>;
    async readFeatureFile(path: string): Promise<string>;
    async updateFeatureFile(path: string, content: string): Promise<void>;
    async listFeatureFiles(): Promise<string[]>;
}
```

#### 2.3 Feature Creation Workflow

-   [ ] Implement "Create New Feature" command
-   [ ] Create `.features/` directory if it doesn't exist
-   [ ] Generate feature file from template
-   [ ] Open created file in editor

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

### Phase 4: Project Context Analysis (Days 11-12)

#### 4.1 Project Analyzer

```typescript
// src/services/projectAnalyzer.ts
export class ProjectAnalyzer {
    analyzeProject(workspacePath: string): Promise<ProjectContext>;
    private detectFramework(packageJson: any): string;
    private scanProjectStructure(rootPath: string): Promise<string[]>;
    private analyzeImportantFiles(files: string[]): Promise<FileAnalysis[]>;
}
```

#### 4.2 Context Integration

-   [ ] Integrate project context into CLI commands
-   [ ] Add important files analysis to feature specs
-   [ ] Implement context caching for performance

### Phase 5: LLM Integration (Days 13-16)

#### 5.1 CLI Service Implementation

```typescript
// src/services/cliService.ts
export class CLIService {
    constructor(
        private agentManager: AgentManager,
        private projectAnalyzer: ProjectAnalyzer
    );

    async generateQuestionnaire(featureFilePath: string): Promise<string>;
    async generateImplementationPlan(featureFilePath: string): Promise<string>;
    private async executeCommand(command: string): Promise<string>;
    private async parseResponse(
        response: string,
        type: "questions" | "plan"
    ): Promise<string>;
}
```

#### 5.2 Prompt Templates

```typescript
// src/constants/prompts.ts
export const QUESTIONNAIRE_PROMPT = `
Analyze this feature specification and project context:

FEATURE SPEC:
{featureSpec}

PROJECT CONTEXT:
{projectContext}

Generate 5-8 clarifying questions to help refine this feature specification.
Format them as markdown under "## Clarifying Questions" section.
Leave space for answers after each question.

Example format:
## Clarifying Questions

1. **Question about user interaction**: How should users interact with this feature?
   
   *Answer:* 

2. **Question about data handling**: What data structures are involved?
   
   *Answer:* 
`;

export const IMPLEMENTATION_PROMPT = `
Create a detailed implementation plan for this feature:

FEATURE SPEC WITH ANSWERS:
{featureSpecWithAnswers}

PROJECT CONTEXT:
{projectContext}

Generate a step-by-step implementation plan with:
- File changes needed
- Code structure recommendations
- Testing approach
- Integration points
- Potential challenges

Format as markdown under "## Implementation Plan" section.
`;
```

### Phase 6: Command Integration (Days 17-19)

#### 6.1 Command Registration

```json
// package.json - commands contribution
"contributes": {
    "commands": [
        {
            "command": "featureSpecs.createNew",
            "title": "Create New Feature",
            "icon": "$(add)"
        },
        {
            "command": "featureSpecs.generateQuestions",
            "title": "Generate Clarifying Questions",
            "icon": "$(question)"
        },
        {
            "command": "featureSpecs.generatePlan",
            "title": "Generate Implementation Plan",
            "icon": "$(list-ordered)"
        },
        {
            "command": "featureSpecs.switchAgent",
            "title": "Switch CLI Agent",
            "icon": "$(gear)"
        },
        {
            "command": "featureSpecs.refreshTree",
            "title": "Refresh",
            "icon": "$(refresh)"
        }
    ]
}
```

#### 6.2 Command Handlers

```typescript
// src/extension.ts - command registration
export function activate(context: vscode.ExtensionContext) {
    const treeProvider = new FeatureTreeProvider();
    const cliService = new CLIService(agentManager, projectAnalyzer);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("featureSpecs.createNew", () =>
            createNewFeature()
        ),
        vscode.commands.registerCommand(
            "featureSpecs.generateQuestions",
            (item) => generateQuestions(item)
        ),
        vscode.commands.registerCommand("featureSpecs.generatePlan", (item) =>
            generatePlan(item)
        ),
        vscode.commands.registerCommand("featureSpecs.switchAgent", () =>
            switchAgent()
        )
    );
}
```

### Phase 7: Error Handling & UX (Days 20-22)

#### 7.1 Error Handler

```typescript
// src/utils/errorHandler.ts
export class ErrorHandler {
    handleCLIError(error: string, agent: CLIAgentInfo): void;
    handleFileError(error: Error, operation: string): void;
    handleAuthenticationError(agent: CLIAgentInfo): void;
    private showInstallationGuide(agent: CLIAgentInfo): void;
    private showAuthenticationGuide(agent: CLIAgentInfo): void;
}
```

#### 7.2 Progress Indicators

```typescript
// Progress indication for long-running operations
async generateQuestionnaire(item: FeatureSpecItem) {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Generating clarifying questions...",
        cancellable: true
    }, async (progress, token) => {
        return cliService.generateQuestionnaire(item.filePath);
    });
}
```

### Phase 8: Testing & Polish (Days 23-25)

#### 8.1 Unit Tests

-   [ ] Service layer tests
-   [ ] Utility function tests
-   [ ] Mock CLI responses for testing
-   [ ] Error handling tests

#### 8.2 Integration Tests

-   [ ] End-to-end workflow tests
-   [ ] File system operation tests
-   [ ] CLI integration tests (with mocks)

#### 8.3 Documentation

-   [ ] Update README with usage instructions
-   [ ] Add inline code documentation
-   [ ] Create troubleshooting guide

## 📁 Key Files to Implement

### 1. Extension Entry Point

```typescript
// src/extension.ts
import * as vscode from "vscode";
import { FeatureTreeProvider } from "./providers/featureTreeProvider";
import { CLIService } from "./services/cliService";
import { AgentManager } from "./services/agentManager";
import { ProjectAnalyzer } from "./services/projectAnalyzer";

let treeProvider: FeatureTreeProvider;
let cliService: CLIService;
let agentManager: AgentManager;

export async function activate(context: vscode.ExtensionContext) {
    // Initialize services
    agentManager = new AgentManager();
    const projectAnalyzer = new ProjectAnalyzer();
    cliService = new CLIService(agentManager, projectAnalyzer);

    // Initialize CLI agents
    await agentManager.initializeAgents();

    // Register tree provider
    treeProvider = new FeatureTreeProvider();
    vscode.window.createTreeView("featureSpecs", {
        treeDataProvider: treeProvider,
        canSelectMany: false,
    });

    // Register commands
    registerCommands(context);

    console.log("Feature Spec Extension is now active!");
}

function registerCommands(context: vscode.ExtensionContext) {
    const commands = [
        vscode.commands.registerCommand(
            "featureSpecs.createNew",
            createNewFeature
        ),
        vscode.commands.registerCommand(
            "featureSpecs.generateQuestions",
            generateQuestions
        ),
        vscode.commands.registerCommand(
            "featureSpecs.generatePlan",
            generatePlan
        ),
        vscode.commands.registerCommand(
            "featureSpecs.switchAgent",
            switchAgent
        ),
        vscode.commands.registerCommand("featureSpecs.refreshTree", () =>
            treeProvider.refresh()
        ),
    ];

    context.subscriptions.push(...commands);
}

export function deactivate() {}
```

### 2. Package.json Configuration

```json
{
    "name": "feature-spec-extension",
    "displayName": "Feature Spec Manager",
    "description": "AI-powered feature specification management for VS Code",
    "version": "0.1.0",
    "engines": {
        "vscode": "^1.74.0"
    },
    "categories": ["Other"],
    "activationEvents": [
        "onView:featureSpecs",
        "workspaceContains:.features/**"
    ],
    "main": "./dist/extension.js",
    "contributes": {
        "views": {
            "explorer": [
                {
                    "id": "featureSpecs",
                    "name": "Feature Specs",
                    "when": "workspaceHasFeatures || true"
                }
            ]
        },
        "commands": [
            {
                "command": "featureSpecs.createNew",
                "title": "Create New Feature",
                "icon": "$(add)"
            },
            {
                "command": "featureSpecs.generateQuestions",
                "title": "Generate Questions",
                "icon": "$(question)"
            },
            {
                "command": "featureSpecs.generatePlan",
                "title": "Generate Plan",
                "icon": "$(list-ordered)"
            },
            {
                "command": "featureSpecs.switchAgent",
                "title": "Switch Agent",
                "icon": "$(gear)"
            }
        ],
        "menus": {
            "view/title": [
                {
                    "command": "featureSpecs.createNew",
                    "when": "view == featureSpecs",
                    "group": "navigation"
                },
                {
                    "command": "featureSpecs.switchAgent",
                    "when": "view == featureSpecs",
                    "group": "navigation"
                }
            ],
            "view/item/context": [
                {
                    "command": "featureSpecs.generateQuestions",
                    "when": "view == featureSpecs && viewItem == featureSpec",
                    "group": "inline"
                },
                {
                    "command": "featureSpecs.generatePlan",
                    "when": "view == featureSpecs && viewItem == featureSpec",
                    "group": "inline"
                }
            ]
        },
        "configuration": {
            "title": "Feature Specs",
            "properties": {
                "featureSpecs.defaultAgent": {
                    "type": "string",
                    "enum": ["claude-code", "gemini-cli", "auto"],
                    "default": "auto",
                    "description": "Default CLI agent to use"
                },
                "featureSpecs.customTemplatePath": {
                    "type": "string",
                    "description": "Path to custom feature spec template"
                },
                "featureSpecs.autoDetectAgents": {
                    "type": "boolean",
                    "default": true,
                    "description": "Automatically detect available CLI agents"
                }
            }
        }
    },
    "scripts": {
        "vscode:prepublish": "npm run package",
        "compile": "webpack",
        "watch": "webpack --watch",
        "package": "webpack --mode production --devtool hidden-source-map",
        "test": "node ./out/test/runTest.js"
    }
}
```

### 3. Default Feature Template

```markdown
# Feature Specification: [Feature Name]

**Created:** [Date]  
**Last Updated:** [Date]  
**Status:** Draft  
**CLI Agent:** Not Set

## Description

[Provide a clear, concise description of the feature. What problem does it solve? Who is the target user?]

## Acceptance Criteria

-   [ ] [Define what success looks like for this feature]
-   [ ] [Include measurable outcomes where possible]
-   [ ] [Consider edge cases and error scenarios]

## Important Files to Analyze

<!-- List files that are relevant to this feature implementation -->

-   `src/components/example.tsx` - [Brief description of why this file is important]
-   `src/utils/helper.ts` - [Context about this file's relevance]

## Additional Context

[Any additional information, constraints, dependencies, or requirements]

## Technical Considerations

[Any technical constraints, performance requirements, or architectural decisions]

---

<!-- DO NOT EDIT BELOW THIS LINE - Content will be generated by AI -->

## Clarifying Questions

<!-- Questions will be generated and appended here -->

## Implementation Plan

<!-- Implementation plan will be generated and appended here -->

## Metadata

-   **Created:** [timestamp]
-   **Last Updated:** [timestamp]
-   **CLI Agent Used:** [claude-code/gemini-cli]
-   **Questions Generated:** [timestamp]
-   **Plan Generated:** [timestamp]
```

## 🚀 Getting Started for AI Agents

### Prerequisites Check

1. **Verify VS Code Extension Development Setup**:

    ```bash
    node --version  # Should be 16+
    npm --version   # Should be 8+
    code --version  # VS Code should be installed
    ```

2. **Install Required Tools**:
    ```bash
    npm install -g yo generator-code  # VS Code extension generator (optional)
    ```

### Implementation Order

1. **Start with Phase 1**: Set up the basic extension structure
2. **Focus on File Management**: Get basic file operations working
3. **Add CLI Detection**: Implement agent detection without actual CLI calls
4. **Integrate CLI Services**: Add real CLI integration
5. **Polish and Test**: Add error handling and testing

### Key Implementation Notes

-   **Use VS Code Extension API extensively**: Most functionality should leverage built-in VS Code APIs
-   **Handle CLI tool absence gracefully**: Always check if tools are installed before using
-   **Implement proper error handling**: Users should get clear feedback on what went wrong
-   **Keep UI responsive**: Use progress indicators for long-running operations
-   **Follow VS Code UX patterns**: Use standard icons, colors, and interaction patterns

### Testing Strategy

-   **Manual Testing**: Create a test workspace with sample feature specs
-   **CLI Mocking**: Mock CLI responses for consistent testing
-   **Error Scenarios**: Test with missing CLI tools, authentication failures, etc.

### Deployment

-   Package using `vsce package`
-   Test in clean VS Code environment
-   Consider publishing to VS Code Marketplace

This implementation plan provides a complete roadmap for building the Feature Spec Extension efficiently, with clear phases, specific files to implement, and detailed architectural guidance.
