# VS Code Extension: Feature Spec Manager - Complete Codebase Overview

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Structure](#architecture--structure)
3. [Core Classes & Components](#core-classes--components)
4. [Application Flow](#application-flow)
5. [Key Methods & Functions](#key-methods--functions)
6. [Extension Lifecycle](#extension-lifecycle)
7. [File Operations](#file-operations)
8. [User Interface Components](#user-interface-components)

## Project Overview

**Feature Spec Manager** is a VS Code extension that helps developers create and manage AI-powered feature specifications. The extension provides:

-   A tree view in the Explorer panel showing all feature specifications
-   Commands to create new feature specs from templates
-   File watching for automatic UI updates
-   Template-based feature specification generation

**Main Purpose**: Streamline the process of creating structured feature specifications that can be used with AI CLI tools like Claude Code and Gemini CLI.

## Architecture & Structure

```
src/
├── extension.ts              # Main entry point & activation logic
├── models/
│   └── featureSpec.ts       # TypeScript interfaces & data models
├── providers/
│   └── featureTreeProvider.ts # Tree view data provider
├── services/
│   ├── fileService.ts       # File system operations
│   └── templateService.ts   # Template processing
└── templates/
    └── defaultFeature.md    # Default template for new features
```

The extension follows a **service-oriented architecture** with clear separation of concerns:

-   **Models**: Define data structures and interfaces
-   **Providers**: Handle VS Code UI integration (tree views)
-   **Services**: Encapsulate business logic (file operations, templates)
-   **Templates**: Store reusable content templates

## Core Classes & Components

### 1. Main Extension (`extension.ts`)

**Purpose**: Entry point that orchestrates the entire extension

**Key Global Variables**:

```typescript
let treeProvider: FeatureTreeProvider; // Manages the tree view
let templateService: TemplateService; // Handles templates
let fileService: FileService; // Manages file operations
```

**Core Functions**:

-   `activate(context)` - Initializes the extension
-   `registerCommands(context)` - Sets up command handlers
-   `createNewFeature()` - Creates new feature specifications
-   `deactivate()` - Cleanup when extension is disabled

### 2. FeatureSpecItem Class (`models/featureSpec.ts`)

**Purpose**: Represents a single item in the tree view

**Constructor**:

```typescript
constructor(
    public readonly id: string,              // Unique identifier
    public readonly label: string,           // Display name
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: string,   // For context menus
    public readonly resourceUri?: vscode.Uri // File path
)
```

**Key Properties**:

-   `children`: Array of child items (for hierarchical display)
-   `parent`: Reference to parent item
-   Inherits from `vscode.TreeItem` for VS Code integration

### 3. FeatureTreeProvider Class (`providers/featureTreeProvider.ts`)

**Purpose**: Provides data to the VS Code tree view and manages UI updates

**Constructor**:

```typescript
constructor(private fileService: FileService) {
    this.loadFeatureFiles();  // Load existing files
    this.watchFiles();        // Set up file system watching
}
```

**Key Properties**:

-   `_onDidChangeTreeData`: Event emitter for tree updates
-   `data: FeatureSpecItem[]`: Array of root tree items
-   `fileWatcher`: Monitors file system changes

**Core Methods**:

-   `getTreeItem(element)`: Returns tree item configuration
-   `getChildren(element)`: Returns child items for tree hierarchy
-   `refresh()`: Reloads tree data and updates UI
-   `loadFeatureFiles()`: Scans `.features` directory
-   `buildTreeStructure(files)`: Converts file paths to tree items

### 4. FileService Class (`services/fileService.ts`)

**Purpose**: Handles all file system operations for feature specifications

**Constructor**:

```typescript
constructor() {}  // No dependencies needed
```

**Key Properties**:

-   `featuresDirectoryName = '.features'`: Directory name for storing specs

**Core Methods**:

**Directory Management**:

-   `ensureFeaturesDirectory()`: Creates `.features` folder if it doesn't exist
-   `getFeaturesPath()`: Returns full path to features directory
-   `getWorkspaceRoot()`: Gets current VS Code workspace path

**File Operations**:

-   `createFeatureFile(name, content)`: Creates new feature file with validation
-   `readFeatureFile(filePath)`: Reads file content
-   `updateFeatureFile(filePath, content)`: Updates existing file
-   `deleteFeatureFile(filePath)`: Removes feature file
-   `listFeatureFiles()`: Returns array of all `.md` files in features directory

**Validation & Utilities**:

-   `validateFileName(name)`: Sanitizes and validates file names
-   `featureExists(name)`: Checks if feature already exists
-   `generateUniqueFileName(baseName)`: Creates unique names for duplicates

### 5. TemplateService Class (`services/templateService.ts`)

**Purpose**: Manages feature specification templates and variable replacement

**Constructor**:

```typescript
constructor(private context: vscode.ExtensionContext) {
    this.defaultTemplatePath = path.join(context.extensionPath, 'src', 'templates', 'defaultFeature.md');
}
```

**Key Properties**:

-   `templateCache: Map<string, string>`: Caches loaded templates
-   `defaultTemplatePath`: Path to default template file

**Core Methods**:

**Template Loading**:

-   `getDefaultTemplate()`: Loads the default template
-   `loadTemplate(templatePath)`: Loads template from file system
-   `validateTemplate(content)`: Ensures required placeholders exist

**Template Processing**:

-   `populateTemplate(templateData)`: Replaces placeholders with actual data
-   `replaceTemplateVariables(template, data)`: Performs variable substitution
-   `sanitizeInput(input)`: Prevents markdown injection attacks

**Utilities**:

-   `createCustomTemplate(templatePath)`: Creates new template file
-   `getEmbeddedTemplate()`: Fallback template if file loading fails

## Application Flow

### 1. Extension Activation Sequence

When VS Code starts or the extension is activated:

```
1. activate() function called (extension.ts:11)
   ↓
2. Initialize services (extension.ts:14-18)
   - templateService = new TemplateService(context)
   - fileService = new FileService()
   - treeProvider = new FeatureTreeProvider(fileService)
   ↓
3. FeatureTreeProvider constructor (featureTreeProvider.ts:13)
   - loadFeatureFiles() → scans .features directory
   - watchFiles() → sets up file system monitoring
   ↓
4. Register tree view (extension.ts:22-25)
   - Creates "featureSpecs" tree view in Explorer panel
   ↓
5. Register commands (extension.ts:28-29)
   - featureSpecs.createNew → createNewFeature()
   - featureSpecs.refreshTree → treeProvider.refresh()
   ↓
6. Set up cleanup handlers (extension.ts:32-36)
```

### 2. Creating a New Feature Flow

When user clicks "Create New Feature":

```
1. Command 'featureSpecs.createNew' triggered (extension.ts:44)
   ↓
2. createNewFeature() function starts (extension.ts:56)
   ↓
3. Get feature name from user (extension.ts:61)
   - getValidFeatureName() → shows input box
   - validateFileName() via FileService
   ↓
4. Check for duplicates (extension.ts:68)
   - fileService.featureExists(featureName)
   - Handle duplicate names if found
   ↓
5. Create feature with progress indicator (extension.ts:78)
   a. Create .features directory (fileService.ensureFeaturesDirectory())
   b. Generate content from template (templateService.populateTemplate())
   c. Create file (fileService.createFeatureFile())
   d. Open in editor (vscode.workspace.openTextDocument())
   e. Refresh tree view (treeProvider.refresh())
   ↓
6. Show success message
```

### 3. Tree View Update Flow

When files change in the `.features` directory:

```
1. File system event occurs (create/update/delete)
   ↓
2. FileWatcher detects change (featureTreeProvider.ts:132-145)
   ↓
3. refresh() method called (featureTreeProvider.ts:19)
   ↓
4. loadFeatureFiles() scans directory (featureTreeProvider.ts:63)
   ↓
5. buildTreeStructure() converts files to tree items (featureTreeProvider.ts:75)
   ↓
6. _onDidChangeTreeData.fire() triggers UI update (featureTreeProvider.ts:22)
   ↓
7. VS Code calls getChildren() to refresh tree (featureTreeProvider.ts:46)
```

## Key Methods & Functions

### Critical Extension Methods

**`activate(context: vscode.ExtensionContext)`** (`extension.ts:11`)

-   **Purpose**: Extension entry point, sets up all services and UI
-   **Flow**: Initialize services → Register tree view → Register commands → Setup cleanup
-   **Parameters**: VS Code extension context for resource management

**`createNewFeature()`** (`extension.ts:56`)

-   **Purpose**: Handles the complete feature creation workflow
-   **Flow**: Get name → Validate → Check duplicates → Create file → Open editor
-   **Error Handling**: Comprehensive error handling with user-friendly messages

### FileService Core Methods

**`validateFileName(name: string)`** (`fileService.ts:123`)

-   **Purpose**: Sanitizes user input and validates file names
-   **Returns**: `{valid: boolean, sanitized: string, error?: string}`
-   **Logic**:
    -   Checks length (max 100 chars)
    -   Removes invalid characters: `[<>:"/\\|?*\x00-\x1f]`
    -   Converts to kebab-case
    -   Ensures valid result

**`createFeatureFile(name: string, content: string)`** (`fileService.ts:26`)

-   **Purpose**: Creates new feature file with duplicate handling
-   **Flow**: Validate name → Check existence → Generate unique name if needed → Write file
-   **Returns**: Full file path of created file

**`listFeatureFiles()`** (`fileService.ts:74`)

-   **Purpose**: Scans `.features` directory for all `.md` files
-   **Returns**: Sorted array of full file paths
-   **Error Handling**: Returns empty array if directory doesn't exist

### TemplateService Core Methods

**`populateTemplate(templateData: FeatureSpecData)`** (`templateService.ts:27`)

-   **Purpose**: Generates feature content from template and data
-   **Flow**: Load template → Replace variables → Return populated content
-   **Fallback**: Uses embedded template if file loading fails

**`replaceTemplateVariables(template: string, data: FeatureSpecData)`** (`templateService.ts:83`)

-   **Purpose**: Performs variable substitution in template
-   **Placeholders**: `{featureName}`, `{createdDate}`, `{lastUpdated}`, `{status}`, `{cliAgent}`
-   **Security**: Sanitizes input to prevent markdown injection

### FeatureTreeProvider Core Methods

**`getChildren(element?: FeatureSpecItem)`** (`featureTreeProvider.ts:46`)

-   **Purpose**: VS Code tree view data source
-   **Logic**: If no element, return root items; otherwise return element's children
-   **Used by**: VS Code to populate and expand tree view

**`buildTreeStructure(files: string[])`** (`featureTreeProvider.ts:75`)

-   **Purpose**: Converts file paths to tree view items
-   **Process**: Extract filename → Format display name → Create FeatureSpecItem → Sort alphabetically
-   **Returns**: Array of configured tree items

## Extension Lifecycle

### Activation Events

-   **Trigger**: When VS Code loads or when `featureSpecs` view is first accessed
-   **Entry Point**: `activate()` function
-   **Configuration**: `package.json` defines activation events: `"onView:featureSpecs"`

### Service Initialization Order

1. **TemplateService** - Needs extension context for template path
2. **FileService** - No dependencies
3. **FeatureTreeProvider** - Depends on FileService

### Cleanup & Deactivation

-   **Entry Point**: `deactivate()` function (`extension.ts:168`)
-   **Automatic Cleanup**: Services registered in `context.subscriptions` are disposed automatically
-   **Manual Cleanup**: FileWatcher disposal in FeatureTreeProvider

## File Operations

### Directory Structure

```
workspace-root/
└── .features/           # Created by FileService
    ├── feature-1.md     # Generated from template
    ├── feature-2.md
    └── ...
```

### File Naming Convention

-   **Input**: User-provided name (e.g., "My Awesome Feature")
-   **Processing**: `validateFileName()` converts to kebab-case
-   **Output**: "my-awesome-feature.md"
-   **Duplicates**: Automatically numbered (e.g., "my-awesome-feature-1.md")

### Template Variables

The default template (`templates/defaultFeature.md`) uses these placeholders:

| Placeholder     | Source       | Example               |
| --------------- | ------------ | --------------------- |
| `{featureName}` | User input   | "User Authentication" |
| `{createdDate}` | Current date | "2024-01-15"          |
| `{lastUpdated}` | Current date | "2024-01-15"          |
| `{status}`      | Fixed value  | "Draft"               |
| `{cliAgent}`    | Fixed value  | "Not Set"             |

## User Interface Components

### Tree View ("Feature Specs")

-   **Location**: VS Code Explorer panel
-   **Provider**: FeatureTreeProvider
-   **Items**: Each `.md` file in `.features` directory
-   **Actions**: Click to open file in editor

### Commands

1. **"Create New Feature"** (`featureSpecs.createNew`)

    - **Icon**: Plus (+) symbol
    - **Location**: Tree view toolbar
    - **Action**: Opens input dialog and creates new feature

2. **"Refresh"** (`featureSpecs.refreshTree`)
    - **Icon**: Refresh symbol
    - **Location**: Tree view toolbar
    - **Action**: Manually refreshes tree view

### Input Dialogs

-   **Feature Name Input**:
    -   Placeholder: "my-awesome-feature"
    -   Validation: Real-time via `validateFileName()`
    -   Error Messages: Displayed inline

### Progress Indicators

-   **Location**: VS Code notification area
-   **Stages**: Directory creation → Content generation → File creation → Editor opening
-   **Duration**: Brief (1-2 seconds for typical operations)

### Error Handling

-   **File Permission Errors**: "Permission denied. Please check write permissions"
-   **No Workspace**: "Please open a workspace or folder to create feature specifications"
-   **Invalid Names**: Real-time validation feedback
-   **Template Errors**: Falls back to embedded template

This extension demonstrates modern VS Code extension development practices with TypeScript, proper error handling, user experience considerations, and clean architecture patterns.
