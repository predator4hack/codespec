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

export interface CLIAgentConfig {
    name: string;
    displayName: string;
    command: string;
    versionFlag: string;
    authCheckCommand?: string;
    supportedFeatures: CLIFeature[];
}

export const SUPPORTED_AGENTS: CLIAgentConfig[] = [
    {
        name: 'claude-code',
        displayName: 'Claude Code',
        command: 'claude',
        versionFlag: '--version',
        authCheckCommand: 'auth status',
        supportedFeatures: [
            CLIFeature.QUESTIONNAIRE_GENERATION,
            CLIFeature.IMPLEMENTATION_PLANNING,
            CLIFeature.CODE_GENERATION,
            CLIFeature.FILE_ANALYSIS
        ]
    },
    {
        name: 'gemini-cli',
        displayName: 'Gemini CLI',
        command: 'gcloud',
        versionFlag: '--version',
        authCheckCommand: 'auth list',
        supportedFeatures: [
            CLIFeature.QUESTIONNAIRE_GENERATION,
            CLIFeature.IMPLEMENTATION_PLANNING,
            CLIFeature.CODE_GENERATION
        ]
    }
];