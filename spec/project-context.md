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

⏺ Clarifying Questions

Based on the Phase 4 specification and current codebase state, I
have these clarifying questions:

1. Context Integration Scope

The Phase 4 spec mentions "Integrate project context into CLI
commands" - should this involve:

-   Modifying existing CLI command builders to include project
    context?
-   Creating new CLI-specific commands that leverage the project
    analysis?
-   Both?
    Do whatever you think would be more appropriate

2. Important Files Analysis

For "Add important files analysis to feature specs":

-   Should this be an automatic analysis that suggests relevant
    files based on the feature description?
-   Should it integrate with the existing
    ProjectAnalyzer.analyzeProjectStructure() method?
-   How should "important" files be determined (by size,
    modification date, dependency relationships)?
    The user can provide important files while describing the task. There is a section called important files or code in the current prompt template, the calude should analyse those files

3. Context Caching Performance

The existing ProjectAnalyzer already has caching implemented. For
"Implement context caching for performance":

-   Are you looking to extend the current 5-minute cache duration? No
-   Should caching be persistent across VS Code sessions? No
-   Do you want to cache at the CLI command level as well? No

4. CLI Integration Priority

Looking at the current state, the CLIService and command
execution are partially implemented. Should Phase 4 focus on:

-   Completing the context integration first?
-   Or should we prioritize getting the CLI integration fully
    working end-to-end?
    Work on CLI Integration first and then complete context integration

5. File Analysis Scope

For the analyzeImportantFiles() method mentioned in the spec:

-   What constitutes "important" files (entry points, config files,
    frequently modified files)?
-   Should this analysis be language/framework-specific?
-   How detailed should the analysis be (content analysis vs.
    metadata only)?
    User will provide the files that they seem to be important for the current task. If it's empty, don't add any context

## Detailed Implementation Plan

### Overview
- **Priority**: CLI Integration first, then context integration
- **Caching**: Use existing ProjectAnalyzer caching (no extensions needed)
- **Important Files**: User-provided files from feature spec template
- **Scope**: Modify existing CLI command builders + integrate with feature specs

### Implementation Tasks

#### Task 1: Enhance CLI Command Integration (Priority 1)

**1.1 Update Command Builder to Include Project Context**
- **File**: `src/utils/commandBuilder.ts`
- **Action**: Modify existing methods to include project context in CLI prompts
- **Details**:
  - Add project context parameter to `buildQuestionnaireCommand()` and `buildImplementationCommand()`
  - Integrate project summary from `ProjectAnalyzer.getProjectSummary()`
  - Format context appropriately for each CLI agent (Claude Code vs Gemini CLI)

**1.2 Update CLI Service Integration**
- **File**: `src/services/cliExecutionService.ts`
- **Action**: Ensure CLI service calls include project context
- **Details**:
  - Modify service to call `ProjectAnalyzer.analyzeProject()` before executing commands
  - Pass project context to command builder
  - Handle context analysis errors gracefully

**1.3 Update Prompt Templates**
- **File**: `src/constants/prompts.ts`
- **Action**: Enhance prompts to utilize project context
- **Details**:
  - Add project context section to `QUESTIONNAIRE_PROMPT`
  - Add project context section to `IMPLEMENTATION_PROMPT`
  - Format context information clearly for AI agents

#### Task 2: Implement Important Files Analysis (Priority 2)

**2.1 Add File Analysis Method to ProjectAnalyzer**
- **File**: `src/services/projectAnalyzer.ts`
- **Action**: Implement `analyzeImportantFiles()` method
- **Details**:
  - Parse important files list from feature spec
  - Read and analyze file contents (with size limits)
  - Return structured file analysis data
  - Handle file read errors gracefully

**2.2 Update FeatureSpec Models**
- **File**: `src/models/featureSpec.ts`
- **Action**: Add file analysis interfaces
- **Details**:
  - Create `FileAnalysis` interface
  - Update `ProjectContext` to include file analysis
  - Ensure backward compatibility

**2.3 Integrate File Analysis with CLI Commands**
- **Files**: `src/utils/commandBuilder.ts`, `src/constants/prompts.ts`
- **Action**: Include important files content in CLI prompts
- **Details**:
  - Extract important files from feature spec content
  - Analyze files using new `analyzeImportantFiles()` method
  - Include file analysis in CLI prompts

#### Task 3: Complete Context Integration (Priority 3)

**3.1 Update Feature Tree Provider**
- **File**: `src/providers/featureTreeProvider.ts`
- **Action**: Show context integration status
- **Details**:
  - Display project context status in tree view
  - Show when context analysis is in progress
  - Handle context analysis failures

**3.2 Add Context Commands**
- **File**: `src/commands/cliCommands.ts`
- **Action**: Add project context specific commands
- **Details**:
  - Add "Analyze Project Context" command
  - Add "Refresh Project Context" command
  - Update existing commands to use project context

**3.3 Update Package.json**
- **File**: `package.json`
- **Action**: Register new commands and update existing ones
- **Details**:
  - Add context-related commands to contributions
  - Update command menus and keybindings
  - Add appropriate icons

### File-by-File Implementation Details

#### 1. `src/models/featureSpec.ts`
```typescript
// Add these interfaces
export interface FileAnalysis {
    path: string;
    content: string;
    size: number;
    language: string;
    lastModified: Date;
    summary?: string;
}

// Update ProjectContext interface
export interface ProjectContext {
    // ... existing fields
    importantFiles?: FileAnalysis[];
}
```

#### 2. `src/services/projectAnalyzer.ts`
```typescript
// Add new method
async analyzeImportantFiles(files: string[]): Promise<FileAnalysis[]> {
    // Implementation details:
    // - Validate file paths
    // - Read file contents (limit to 10KB per file)
    // - Detect file language
    // - Return structured analysis
}
```

#### 3. `src/utils/commandBuilder.ts`
```typescript
// Update existing methods to include context
buildQuestionnaireCommand(
    agent: CLIAgentInfo,
    filePath: string,
    context: ProjectContext,
    featureContent: string
): string {
    // Include project context and important files in prompt
}
```

#### 4. `src/constants/prompts.ts`
```typescript
// Update prompts to include context sections
export const QUESTIONNAIRE_PROMPT = `
// ... existing content

PROJECT CONTEXT:
{projectContext}

IMPORTANT FILES ANALYSIS:
{importantFilesAnalysis}

// ... rest of prompt
`;
```

### Testing Strategy

1. **Unit Tests**
   - Test `analyzeImportantFiles()` with various file types
   - Test command builder with project context
   - Test prompt template formatting

2. **Integration Tests**
   - Test full workflow: feature spec → context analysis → CLI command
   - Test error handling for missing files
   - Test context caching behavior

3. **Manual Testing**
   - Create test feature specs with important files
   - Verify CLI commands include proper context
   - Test with both Claude Code and Gemini CLI

### Implementation Order

1. **Start with models** - Update interfaces first
2. **Implement file analysis** - Core functionality for reading important files
3. **Update command builder** - Integrate context into CLI commands
4. **Update prompts** - Ensure AI agents receive proper context
5. **Update CLI service** - Orchestrate the full workflow
6. **Add commands and UI** - User-facing features
7. **Test and polish** - Comprehensive testing

### Success Criteria

- ✅ CLI commands include project context automatically
- ✅ Important files from feature specs are analyzed and included
- ✅ Existing caching mechanism works without modifications
- ✅ Error handling for missing/unreadable files
- ✅ Backward compatibility with existing feature specs
- ✅ Performance remains acceptable (< 2 seconds for context analysis)
