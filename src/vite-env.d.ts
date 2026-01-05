/// <reference types="vite/client" />

interface AnalysisOptions {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
}

interface Settings {
  outputFolder: string;
  options: AnalysisOptions;
}

interface ProgressInfo {
  progress: number;
  message: string;
}

interface TableInfo {
  name: string;
  folder: string;
  columns: { name: string; type: string; required: boolean; unique: boolean; defaultValue?: string }[];
  relations: { targetTable: string; sourceColumn: string; targetColumn: string; type: string }[];
}

interface PageInfo {
  name: string;
  type: 'page' | 'masterPage';
  path: string;
  buttons: { name: string; cell?: string; commands: { type: string; description: string }[] }[];
  formulas: { cell: string; formula: string }[];
}

interface WorkflowInfo {
  tableName: string;
  states: { name: string; isInitial?: boolean; isFinal?: boolean }[];
  transitions: { fromState: string; toState: string; action: string; assignees: { type: string; value: string }[] }[];
}

interface ServerCommandInfo {
  name: string;
  folder: string;
  commands: string[];
  parameters?: { name: string; type: string; required: boolean; defaultValue?: string }[];
}

interface AnalysisResult {
  projectName: string;
  tables: TableInfo[];
  pages: PageInfo[];
  workflows: WorkflowInfo[];
  serverCommands: ServerCommandInfo[];
  summary: {
    tableCount: number;
    pageCount: number;
    workflowCount: number;
    serverCommandCount: number;
    totalColumns: number;
    totalRelations: number;
  };
}

interface ReviewResult {
  issues: unknown[];
  summary: {
    high: number;
    medium: number;
    low: number;
    total: number;
    byCategory: Record<string, number>;
  };
  orgImpact?: unknown;
}

interface AnalysisResponse {
  success: boolean;
  analysisResult?: AnalysisResult;
  reviewResult?: ReviewResult;
  outputDir?: string;
  generatedFiles?: string[];
  error?: string;
}

interface ElectronAPI {
  selectFile: () => Promise<string | null>;
  selectOutputFolder: () => Promise<string | null>;
  openFolder: (path: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<boolean>;
  analyzeProject: (filePath: string, options: AnalysisOptions) => Promise<AnalysisResponse>;
  onAnalysisProgress: (callback: (progress: ProgressInfo) => void) => () => void;
}

interface Window {
  electronAPI: ElectronAPI;
}
