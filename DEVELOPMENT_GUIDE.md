# Development Guide: Feature Spec Extension

## 🧪 Testing the Extension

### Method 1: Using VS Code Extension Development Host (Recommended)

1. **Open the project in VS Code**:
   ```bash
   code /Users/chandankumar/myspace/codespec
   ```

2. **Press F5** or go to `Run and Debug` panel (Ctrl+Shift+D) and click "Run Extension"
   - This launches a new VS Code window called "Extension Development Host"
   - Your extension will be loaded in this new window

3. **Verify the extension works**:
   - Look for "Feature Specs" in the Explorer sidebar
   - You should see 3 dummy items: User Authentication, Dashboard, Notifications
   - Right-click to see context menus
   - Click the "+" icon to create a new feature

### Method 2: Manual Testing Steps

1. **Compile the extension**:
   ```bash
   npm run compile
   ```

2. **Start watch mode** (for automatic recompilation):
   ```bash
   npm run watch
   ```

3. **Press F5** to launch Extension Development Host

### What You Should See

When testing successfully, you'll see:
- **Sidebar Panel**: "Feature Specs" appears in Explorer
- **Tree Items**: 3 dummy features with icons and descriptions
- **Commands**: Create button (+) and Refresh button in tree title
- **Console Output**: "Feature Spec Extension is now active!" in Debug Console

## 📂 Project Structure Guide

### Core Files Overview

```
src/
├── extension.ts                    # 🚀 Main entry point - START HERE
├── providers/
│   └── featureTreeProvider.ts     # 🌳 Controls sidebar tree view
└── models/
    └── featureSpec.ts             # 📊 Data structures and types
```

### File-by-File Navigation

#### 1. `src/extension.ts` - Main Entry Point 🚀
**Purpose**: Extension lifecycle management
**Key Functions**:
- `activate()` - Called when extension starts
- `deactivate()` - Called when extension stops
- `registerCommands()` - Sets up all commands

**Start Reading Here**: This is your main entry point!

#### 2. `src/providers/featureTreeProvider.ts` - Tree View Logic 🌳
**Purpose**: Controls what appears in the sidebar
**Key Methods**:
- `getTreeItem()` - How each item appears
- `getChildren()` - What items to show
- `refresh()` - Updates the tree view

**TypeScript Concepts Used**:
- `implements vscode.TreeDataProvider<T>` - Interface implementation
- `EventEmitter` - For notifying VS Code of changes
- `Promise<T>` - Async operations

#### 3. `src/models/featureSpec.ts` - Data Models 📊
**Purpose**: Defines data structures
**Key Classes**:
- `FeatureSpecItem` - Represents items in tree
- `FeatureSpecData` - Feature specification data
- `ProjectContext` - Project information

## 🐛 Debugging Guide

### Setting Up Debugging

1. **Open Debug Panel**: Ctrl+Shift+D (Cmd+Shift+D on Mac)
2. **Set Breakpoints**: Click in the gutter next to line numbers
3. **Launch Debugger**: Press F5 or click "Run Extension"

### Common Debugging Scenarios

#### Debugging Extension Activation
```typescript
// In src/extension.ts
export function activate(context: vscode.ExtensionContext) {
    console.log('Extension activating...'); // Add this line
    // Set breakpoint here to debug activation
}
```

#### Debugging Tree View Issues
```typescript
// In src/providers/featureTreeProvider.ts
getChildren(element?: FeatureSpecItem): Thenable<FeatureSpecItem[]> {
    console.log('Getting children for:', element?.label || 'root'); // Add this
    // Set breakpoint here to debug tree loading
}
```

#### Debugging Commands
```typescript
// In src/extension.ts
async function createNewFeature() {
    console.log('Create new feature command triggered'); // Add this
    // Set breakpoint here to debug command execution
}
```

### Debug Console Tips

1. **View Debug Output**: Debug Console panel shows console.log messages
2. **Inspect Variables**: Hover over variables when paused at breakpoints
3. **Call Stack**: See which function called which in Call Stack panel

## 🔧 Development Workflow

### Daily Development Process

1. **Start VS Code** in project directory
2. **Start watch mode**: `npm run watch` (keeps rebuilding on changes)
3. **Press F5** to launch Extension Development Host
4. **Make changes** to TypeScript files
5. **Reload Extension**: Ctrl+R in Extension Development Host window
6. **Test changes** immediately

### Making Changes

1. **Edit TypeScript files** in `src/` directory
2. **Save files** - Webpack automatically recompiles (if watch mode is running)
3. **Reload extension** in Extension Development Host (Ctrl+R)
4. **Test your changes**

### Common Development Commands

```bash
# Compile once
npm run compile

# Watch for changes (auto-compile)
npm run watch

# Create production build
npm run package

# View TypeScript compilation errors
npx tsc --noEmit
```

## 📚 TypeScript Learning Path for This Project

### Start Here (Beginner)
1. **Basic Types**: Look at `src/models/featureSpec.ts`
   - `string`, `boolean`, `Date` types
   - Interface definitions
   - Optional properties with `?`

2. **Classes**: Look at `FeatureSpecItem` class
   - Constructor parameters
   - Public/private properties
   - Class inheritance (`extends`)

### Intermediate Concepts
3. **Interfaces**: Look at `vscode.TreeDataProvider<T>`
   - Method signatures
   - Generic types `<T>`
   - Implementation with `implements`

4. **Async/Await**: Look at command functions
   - `Promise<T>` return types
   - `async/await` patterns
   - `Thenable<T>` (VS Code's Promise-like type)

### Advanced Concepts
5. **Event Handling**: Look at `EventEmitter`
   - Observer pattern
   - Type-safe events
   - Event subscription

6. **Modules**: Look at import/export statements
   - ES6 module syntax
   - Default vs named exports
   - Module resolution

## 🎯 Next Steps for Learning

### Explore These Files in Order:
1. **Start**: `src/extension.ts` (simplest, main logic)
2. **Next**: `src/models/featureSpec.ts` (data structures)
3. **Then**: `src/providers/featureTreeProvider.ts` (more complex logic)

### Experiment by:
1. **Adding console.log** statements to see execution flow
2. **Changing dummy data** in `loadDummyData()` method
3. **Adding new commands** in `registerCommands()`
4. **Modifying tree item appearance** in `getTreeItem()`

### Key VS Code Extension Concepts
- **Tree Data Providers**: How sidebars work
- **Commands**: How to add functionality
- **Extension Lifecycle**: activate/deactivate
- **Event Handling**: Responding to user actions

## 🆘 Troubleshooting

### Extension Not Loading
1. Check Debug Console for errors
2. Verify `package.json` syntax
3. Ensure `npm run compile` succeeds

### Tree View Not Showing
1. Check if "Feature Specs" appears in Explorer
2. Verify tree registration in `extension.ts`
3. Check `contributes.views` in `package.json`

### Commands Not Working
1. Verify command registration in `extension.ts`
2. Check `contributes.commands` in `package.json`
3. Look for error messages in Debug Console

## 📖 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [VS Code Extension Samples](https://github.com/Microsoft/vscode-extension-samples)

Remember: Start with `src/extension.ts` and use F5 to test frequently!