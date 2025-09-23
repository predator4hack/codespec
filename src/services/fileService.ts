import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileService {
    private readonly featuresDirectoryName = '.features';

    constructor() {}

    async ensureFeaturesDirectory(): Promise<void> {
        const workspaceRoot = this.getWorkspaceRoot();
        const featuresPath = this.getFeaturesPath();

        try {
            await fs.promises.access(featuresPath);
        } catch {
            // Directory doesn't exist, create it
            try {
                await fs.promises.mkdir(featuresPath, { recursive: true });
            } catch (error) {
                throw new Error(`Failed to create .features directory: ${error}`);
            }
        }
    }

    async createFeatureFile(name: string, content: string): Promise<string> {
        const validation = this.validateFileName(name);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const sanitizedName = validation.sanitized;
        const fileName = `${sanitizedName}.md`;
        const featuresPath = this.getFeaturesPath();
        const filePath = path.join(featuresPath, fileName);

        // Check if file already exists
        if (await this.featureExists(sanitizedName)) {
            const uniqueName = await this.generateUniqueFileName(sanitizedName);
            const uniqueFilePath = path.join(featuresPath, `${uniqueName}.md`);
            
            try {
                await fs.promises.writeFile(uniqueFilePath, content, 'utf8');
                return uniqueFilePath;
            } catch (error) {
                throw new Error(`Failed to create feature file: ${error}`);
            }
        }

        try {
            await fs.promises.writeFile(filePath, content, 'utf8');
            return filePath;
        } catch (error) {
            throw new Error(`Failed to create feature file: ${error}`);
        }
    }

    async readFeatureFile(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read feature file: ${error}`);
        }
    }

    async updateFeatureFile(filePath: string, content: string): Promise<void> {
        try {
            await fs.promises.writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Failed to update feature file: ${error}`);
        }
    }

    async listFeatureFiles(): Promise<string[]> {
        const featuresPath = this.getFeaturesPath();
        
        try {
            await fs.promises.access(featuresPath);
        } catch {
            // Directory doesn't exist, return empty array
            return [];
        }

        try {
            const files = await fs.promises.readdir(featuresPath, { withFileTypes: true });
            const featureFiles: string[] = [];

            for (const file of files) {
                if (file.isFile() && file.name.endsWith('.md')) {
                    featureFiles.push(path.join(featuresPath, file.name));
                }
            }

            return featureFiles.sort();
        } catch (error) {
            throw new Error(`Failed to list feature files: ${error}`);
        }
    }

    async deleteFeatureFile(filePath: string): Promise<void> {
        try {
            await fs.promises.unlink(filePath);
        } catch (error) {
            throw new Error(`Failed to delete feature file: ${error}`);
        }
    }

    async featureExists(name: string): Promise<boolean> {
        const validation = this.validateFileName(name);
        const sanitizedName = validation.sanitized;
        const fileName = `${sanitizedName}.md`;
        const featuresPath = this.getFeaturesPath();
        const filePath = path.join(featuresPath, fileName);

        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    validateFileName(name: string): { valid: boolean; sanitized: string; error?: string } {
        if (!name || name.trim().length === 0) {
            return {
                valid: false,
                sanitized: '',
                error: 'Feature name cannot be empty'
            };
        }

        const trimmed = name.trim();

        // Check length
        if (trimmed.length > 100) {
            return {
                valid: false,
                sanitized: '',
                error: 'Feature name is too long (max 100 characters)'
            };
        }

        // Check for invalid characters
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(trimmed)) {
            return {
                valid: false,
                sanitized: '',
                error: 'Feature name contains invalid characters'
            };
        }

        // Sanitize: convert to kebab-case
        const sanitized = trimmed
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric except hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

        if (sanitized.length === 0) {
            return {
                valid: false,
                sanitized: '',
                error: 'Feature name contains no valid characters'
            };
        }

        return {
            valid: true,
            sanitized: sanitized
        };
    }

    private getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace is currently open');
        }

        // Use the first workspace folder
        return workspaceFolders[0].uri.fsPath;
    }

    private getFeaturesPath(): string {
        const workspaceRoot = this.getWorkspaceRoot();
        return path.join(workspaceRoot, this.featuresDirectoryName);
    }

    private async generateUniqueFileName(baseName: string): Promise<string> {
        let counter = 1;
        let uniqueName = baseName;

        while (await this.featureExists(uniqueName)) {
            uniqueName = `${baseName}-${counter}`;
            counter++;
        }

        return uniqueName;
    }

    dispose(): void {
        // No cleanup needed for this service
    }
}