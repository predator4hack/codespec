import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CLIProjectContext, PackageInfo, FileStructure, ConfigFile, FileAnalysis } from '../models/featureSpec';

export class ProjectAnalyzer {
    private cache: Map<string, CLIProjectContext> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    async analyzeProject(workspacePath: string): Promise<CLIProjectContext> {
        const cacheKey = workspacePath;
        
        // Check cache first
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            const context = await this.performAnalysis(workspacePath);
            
            // Cache the result
            this.cache.set(cacheKey, context);
            this.cacheExpiry.set(cacheKey, Date.now() + ProjectAnalyzer.CACHE_DURATION);
            
            return context;
        } catch (error) {
            console.error('Project analysis failed:', error);
            throw error;
        }
    }

    private async performAnalysis(workspacePath: string): Promise<CLIProjectContext> {
        const projectType = await this.detectProjectType(workspacePath);
        const framework = await this.detectFramework(workspacePath, projectType);
        const packageManager = await this.detectPackageManager(workspacePath);
        const buildTools = await this.detectBuildTools(workspacePath);
        const testFramework = await this.detectTestFramework(workspacePath);
        const dependencies = await this.extractDependencies(workspacePath, projectType);
        const projectStructure = await this.analyzeProjectStructure(workspacePath);
        const configFiles = await this.findConfigFiles(workspacePath);

        return {
            projectType,
            framework,
            packageManager,
            buildTools,
            testFramework,
            dependencies,
            projectStructure,
            configFiles
        };
    }

    private async detectProjectType(workspacePath: string): Promise<'typescript' | 'javascript' | 'python' | 'java' | 'other'> {
        const files = await this.getDirectoryContents(workspacePath);
        
        // Check for TypeScript
        if (files.some(f => f.endsWith('tsconfig.json') || f.endsWith('.ts'))) {
            return 'typescript';
        }
        
        // Check for JavaScript
        if (files.some(f => f.endsWith('package.json') || f.endsWith('.js') || f.endsWith('.jsx'))) {
            return 'javascript';
        }
        
        // Check for Python
        if (files.some(f => f.endsWith('requirements.txt') || f.endsWith('setup.py') || f.endsWith('.py'))) {
            return 'python';
        }
        
        // Check for Java
        if (files.some(f => f.endsWith('pom.xml') || f.endsWith('build.gradle') || f.endsWith('.java'))) {
            return 'java';
        }
        
        return 'other';
    }

    private async detectFramework(workspacePath: string, projectType: string): Promise<string | undefined> {
        if (projectType === 'typescript' || projectType === 'javascript') {
            const packageJsonPath = path.join(workspacePath, 'package.json');
            
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = await this.readJsonFile(packageJsonPath);
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                if (deps.react) return 'React';
                if (deps.vue) return 'Vue';
                if (deps['@angular/core']) return 'Angular';
                if (deps.svelte) return 'Svelte';
                if (deps.next) return 'Next.js';
                if (deps.nuxt) return 'Nuxt.js';
                if (deps.express) return 'Express';
                if (deps.nestjs) return 'NestJS';
            }
        } else if (projectType === 'python') {
            const requirementsPath = path.join(workspacePath, 'requirements.txt');
            if (await this.fileExists(requirementsPath)) {
                const content = await this.readTextFile(requirementsPath);
                if (content.includes('django')) return 'Django';
                if (content.includes('flask')) return 'Flask';
                if (content.includes('fastapi')) return 'FastAPI';
            }
        }
        
        return undefined;
    }

    private async detectPackageManager(workspacePath: string): Promise<string | undefined> {
        const files = await this.getDirectoryContents(workspacePath);
        
        if (files.includes('yarn.lock')) return 'yarn';
        if (files.includes('pnpm-lock.yaml')) return 'pnpm';
        if (files.includes('package-lock.json')) return 'npm';
        if (files.includes('package.json')) return 'npm'; // default for Node projects
        
        return undefined;
    }

    private async detectBuildTools(workspacePath: string): Promise<string[]> {
        const buildTools: string[] = [];
        const files = await this.getDirectoryContents(workspacePath);
        
        if (files.includes('webpack.config.js') || files.includes('webpack.config.ts')) {
            buildTools.push('webpack');
        }
        if (files.includes('vite.config.js') || files.includes('vite.config.ts')) {
            buildTools.push('vite');
        }
        if (files.includes('rollup.config.js')) {
            buildTools.push('rollup');
        }
        if (files.includes('gulpfile.js')) {
            buildTools.push('gulp');
        }
        if (files.includes('Gruntfile.js')) {
            buildTools.push('grunt');
        }
        
        return buildTools;
    }

    private async detectTestFramework(workspacePath: string): Promise<string | undefined> {
        const packageJsonPath = path.join(workspacePath, 'package.json');
        
        if (await this.fileExists(packageJsonPath)) {
            const packageJson = await this.readJsonFile(packageJsonPath);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (deps.jest) return 'jest';
            if (deps.mocha) return 'mocha';
            if (deps.jasmine) return 'jasmine';
            if (deps.vitest) return 'vitest';
            if (deps.cypress) return 'cypress';
            if (deps.playwright) return 'playwright';
        }
        
        // Check for Python test frameworks
        const requirementsPath = path.join(workspacePath, 'requirements.txt');
        if (await this.fileExists(requirementsPath)) {
            const content = await this.readTextFile(requirementsPath);
            if (content.includes('pytest')) return 'pytest';
            if (content.includes('unittest')) return 'unittest';
        }
        
        return undefined;
    }

    private async extractDependencies(workspacePath: string, projectType: string): Promise<PackageInfo[]> {
        const dependencies: PackageInfo[] = [];
        
        if (projectType === 'typescript' || projectType === 'javascript') {
            const packageJsonPath = path.join(workspacePath, 'package.json');
            if (await this.fileExists(packageJsonPath)) {
                const packageJson = await this.readJsonFile(packageJsonPath);
                
                // Production dependencies
                if (packageJson.dependencies) {
                    for (const [name, version] of Object.entries(packageJson.dependencies)) {
                        dependencies.push({
                            name,
                            version: version as string,
                            isDevDependency: false
                        });
                    }
                }
                
                // Development dependencies
                if (packageJson.devDependencies) {
                    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
                        dependencies.push({
                            name,
                            version: version as string,
                            isDevDependency: true
                        });
                    }
                }
            }
        }
        
        return dependencies.slice(0, 20); // Limit to top 20 dependencies
    }

    private async analyzeProjectStructure(workspacePath: string): Promise<FileStructure[]> {
        const structure: FileStructure[] = [];
        
        try {
            const items = await this.getDirectoryContentsWithStats(workspacePath);
            
            for (const item of items) {
                if (this.shouldIncludeInStructure(item.name)) {
                    structure.push({
                        path: item.name,
                        type: item.isDirectory ? 'directory' : 'file',
                        size: item.isDirectory ? undefined : item.size,
                        lastModified: item.mtime
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to analyze project structure:', error);
        }
        
        return structure.slice(0, 50); // Limit to 50 items
    }

    private async findConfigFiles(workspacePath: string): Promise<ConfigFile[]> {
        const configFiles: ConfigFile[] = [];
        const configPatterns = [
            'package.json',
            'tsconfig.json',
            'webpack.config.js',
            'vite.config.js',
            '.eslintrc.js',
            '.prettierrc',
            'jest.config.js',
            'requirements.txt',
            'setup.py',
            'pom.xml',
            'build.gradle'
        ];
        
        for (const pattern of configPatterns) {
            const filePath = path.join(workspacePath, pattern);
            if (await this.fileExists(filePath)) {
                try {
                    const content = await this.readTextFile(filePath);
                    configFiles.push({
                        name: pattern,
                        path: filePath,
                        content: content.length > 2000 ? content.substring(0, 2000) + '...' : content
                    });
                } catch (error) {
                    console.warn(`Failed to read config file ${pattern}:`, error);
                }
            }
        }
        
        return configFiles;
    }

    async getProjectSummary(context: CLIProjectContext): Promise<string> {
        const parts: string[] = [];
        
        parts.push(`**Project Type:** ${context.projectType}`);
        
        if (context.framework) {
            parts.push(`**Framework:** ${context.framework}`);
        }
        
        if (context.packageManager) {
            parts.push(`**Package Manager:** ${context.packageManager}`);
        }
        
        if (context.buildTools.length > 0) {
            parts.push(`**Build Tools:** ${context.buildTools.join(', ')}`);
        }
        
        if (context.testFramework) {
            parts.push(`**Test Framework:** ${context.testFramework}`);
        }
        
        const prodDeps = context.dependencies.filter(d => !d.isDevDependency);
        if (prodDeps.length > 0) {
            const topDeps = prodDeps.slice(0, 5).map(d => d.name).join(', ');
            parts.push(`**Key Dependencies:** ${topDeps}${prodDeps.length > 5 ? ` (and ${prodDeps.length - 5} more)` : ''}`);
        }
        
        parts.push(`**Files/Directories:** ${context.projectStructure.length} items analyzed`);
        
        return parts.join('\n');
    }

    // Helper methods
    private isCacheValid(cacheKey: string): boolean {
        const expiry = this.cacheExpiry.get(cacheKey);
        return expiry !== undefined && Date.now() < expiry && this.cache.has(cacheKey);
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private async readJsonFile(filePath: string): Promise<any> {
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
    }

    private async readTextFile(filePath: string): Promise<string> {
        return fs.promises.readFile(filePath, 'utf8');
    }

    private async getDirectoryContents(dirPath: string): Promise<string[]> {
        try {
            return await fs.promises.readdir(dirPath);
        } catch {
            return [];
        }
    }

    private async getDirectoryContentsWithStats(dirPath: string): Promise<Array<{name: string, isDirectory: boolean, size: number, mtime: Date}>> {
        try {
            const items = await fs.promises.readdir(dirPath);
            const results = [];
            
            for (const item of items) {
                try {
                    const itemPath = path.join(dirPath, item);
                    const stats = await fs.promises.stat(itemPath);
                    results.push({
                        name: item,
                        isDirectory: stats.isDirectory(),
                        size: stats.size,
                        mtime: stats.mtime
                    });
                } catch {
                    // Skip items we can't stat
                }
            }
            
            return results;
        } catch {
            return [];
        }
    }

    private shouldIncludeInStructure(name: string): boolean {
        const excluded = [
            'node_modules',
            '.git',
            '.vscode',
            'dist',
            'build',
            '__pycache__',
            '.pytest_cache',
            'coverage',
            '.nyc_output'
        ];
        
        return !excluded.includes(name) && !name.startsWith('.');
    }

    async analyzeImportantFiles(files: string[]): Promise<FileAnalysis[]> {
        const analyses: FileAnalysis[] = [];
        const maxFileSize = 10 * 1024; // 10KB limit per file
        
        for (const filePath of files) {
            try {
                // Validate file path and existence
                if (!await this.fileExists(filePath)) {
                    console.warn(`Important file not found: ${filePath}`);
                    continue;
                }
                
                // Get file stats
                const stats = await fs.promises.stat(filePath);
                
                // Skip if file is too large
                if (stats.size > maxFileSize) {
                    console.warn(`Important file too large (${stats.size} bytes): ${filePath}`);
                    analyses.push({
                        path: filePath,
                        content: `[File too large: ${stats.size} bytes - content not analyzed]`,
                        size: stats.size,
                        language: this.detectFileLanguage(filePath),
                        lastModified: stats.mtime,
                        summary: 'File too large for analysis'
                    });
                    continue;
                }
                
                // Read file content
                const content = await this.readTextFile(filePath);
                
                // Create file analysis
                analyses.push({
                    path: filePath,
                    content: content,
                    size: stats.size,
                    language: this.detectFileLanguage(filePath),
                    lastModified: stats.mtime,
                    summary: this.generateFileSummary(content, filePath)
                });
                
            } catch (error) {
                console.error(`Failed to analyze important file ${filePath}:`, error);
                // Add error entry to maintain consistency
                analyses.push({
                    path: filePath,
                    content: `[Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}]`,
                    size: 0,
                    language: this.detectFileLanguage(filePath),
                    lastModified: new Date(),
                    summary: 'Error reading file'
                });
            }
        }
        
        return analyses;
    }

    private detectFileLanguage(filePath: string): string {
        const extension = path.extname(filePath).toLowerCase();
        
        const languageMap: { [key: string]: string } = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.kt': 'kotlin',
            '.swift': 'swift',
            '.vue': 'vue',
            '.svelte': 'svelte',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.txt': 'text',
            '.sh': 'shell',
            '.bat': 'batch',
            '.ps1': 'powershell'
        };
        
        return languageMap[extension] || 'text';
    }

    private generateFileSummary(content: string, filePath: string): string {
        const lines = content.split('\n');
        const totalLines = lines.length;
        const fileName = path.basename(filePath);
        
        // Basic summary information
        let summary = `${fileName} (${totalLines} lines)`;
        
        // Add language-specific insights
        const language = this.detectFileLanguage(filePath);
        
        if (language === 'typescript' || language === 'javascript') {
            const imports = lines.filter(line => line.trim().startsWith('import ')).length;
            const exports = lines.filter(line => line.trim().startsWith('export ')).length;
            const functions = lines.filter(line => 
                line.includes('function ') || 
                line.includes('=>') || 
                line.match(/^\s*\w+\s*\(.*\)\s*{/)
            ).length;
            
            if (imports > 0) summary += `, ${imports} imports`;
            if (exports > 0) summary += `, ${exports} exports`;
            if (functions > 0) summary += `, ~${functions} functions`;
        } else if (language === 'python') {
            const imports = lines.filter(line => 
                line.trim().startsWith('import ') || 
                line.trim().startsWith('from ')
            ).length;
            const functions = lines.filter(line => line.trim().startsWith('def ')).length;
            const classes = lines.filter(line => line.trim().startsWith('class ')).length;
            
            if (imports > 0) summary += `, ${imports} imports`;
            if (classes > 0) summary += `, ${classes} classes`;
            if (functions > 0) summary += `, ${functions} functions`;
        } else if (language === 'json') {
            try {
                const parsed = JSON.parse(content);
                const keys = Object.keys(parsed).length;
                summary += `, ${keys} top-level properties`;
            } catch {
                summary += ', invalid JSON';
            }
        }
        
        return summary;
    }

    public clearCache(): void {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
}