# Quick Test Guide 🚀

## Step-by-Step Testing Instructions

### 1. Open VS Code in This Project
```bash
cd /Users/chandankumar/myspace/codespec
code .
```

### 2. Launch the Extension
- **Press F5** (or open Run and Debug panel and click "Run Extension")
  - **Windows/Linux**: Ctrl+Shift+D to open Run and Debug panel
  - **Mac**: Cmd+Shift+D to open Run and Debug panel
- This opens a new "Extension Development Host" window
- Wait for the new window to fully load

### 3. What You Should See

#### In the Extension Development Host Window:
1. **Sidebar**: Look for "Feature Specs" section in the Explorer (left sidebar)
2. **Tree Items**: You should see 3 dummy features:
   - 🧑 User Authentication System (expandable - click the arrow)
   - 📊 User Dashboard  
   - 🔔 Notification System

3. **Console Output**: Open Debug Console to see logs:
   - **Windows/Linux**: Ctrl+Shift+Y
   - **Mac**: Cmd+Shift+Y
   ```
   🚀 Feature Spec Extension is now active!
   📝 Creating FeatureTreeProvider...
   🌳 FeatureTreeProvider constructor called
   🌳 Registering tree view...
   ⚡ Registering commands...
   ✅ Extension activation complete!
   📋 Getting root items, found 3 features
   ```

### 4. Test Functionality

#### Test 1: Expand Tree Items
- Click the arrow next to "User Authentication System"
- You should see 2 sub-items appear:
  - 🏛️ Login Component
  - 🔗 Authentication Service
- Check Debug Console for: `👶 Getting children for User Authentication System, found 2 children`

#### Test 2: Create New Feature Command
- Click the **+** button in the Feature Specs title bar
- Enter a feature name (e.g., "my-test-feature")  
- Click OK
- You should see:
  - A success message popup
  - Debug Console logs: `🎯 Create New Feature command triggered` and `💡 User entered feature name: my-test-feature`

#### Test 3: Refresh Command
- Click the **refresh** button (🔄) in the title bar
- Check Debug Console for: `🔄 Refreshing tree view...`

### 5. Understanding the Code Flow

When you test, this is what happens:

1. **F5 pressed** → `extension.ts activate()` function runs
2. **Tree appears** → `FeatureTreeProvider` constructor creates dummy data
3. **Items shown** → `getChildren()` method returns the 3 features
4. **+ clicked** → `createNewFeature()` function runs
5. **Expand clicked** → `getChildren()` with the parent item returns sub-items

### 6. TypeScript Navigation Tips

#### Start Exploring Here:
1. **`src/extension.ts`** - Main entry point (EASIEST to understand)
2. **`src/models/featureSpec.ts`** - Simple data structures
3. **`src/providers/featureTreeProvider.ts`** - More complex tree logic

#### Use VS Code Features:
- **Go to Definition**: 
  - **Windows/Linux**: Ctrl+Click on any function/class name
  - **Mac**: Cmd+Click on any function/class name
- **Find All References**: Right-click → "Find All References"
- **Outline View**: See file structure in Explorer
- **Breadcrumbs**: Navigate easily at the top of editor

### 7. Common Issues & Solutions

#### Extension Not Loading:
- Check Debug Console for error messages
- Make sure `npm run compile` completed successfully
- Try restarting VS Code

#### Tree Not Showing:
- Look for "Feature Specs" in Explorer sidebar
- Try refreshing the Extension Development Host:
  - **Windows/Linux**: Ctrl+R
  - **Mac**: Cmd+R
- Check if there are any TypeScript errors

#### No Console Logs:
- Make sure Debug Console is open:
  - **Windows/Linux**: Ctrl+Shift+Y
  - **Mac**: Cmd+Shift+Y
- Click "Extension Host" dropdown if multiple consoles available

### 8. Next Steps for Learning

1. **Modify dummy data** in `loadDummyData()` method
2. **Add more console.log** statements to understand flow
3. **Change tree item icons** (look for `vscode.ThemeIcon`)
4. **Add new commands** in `registerCommands()`

### 9. Hot Reload Development

For continuous development:
```bash
# Terminal 1: Keep this running for auto-compilation
npm run watch

# Terminal 2: Or if you prefer manual compilation
npm run compile
```

After making changes:
- Save your TypeScript files
- Reload the Extension Development Host:
  - **Windows/Linux**: Ctrl+R
  - **Mac**: Cmd+R
- Your changes will be reflected immediately!

---

**Pro Tip**: Keep the Debug Console open while testing to see all the helpful log messages! 🎯