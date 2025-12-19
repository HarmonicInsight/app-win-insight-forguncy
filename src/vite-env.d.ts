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

interface AnalysisResult {
  projectName: string;
  tables: unknown[];
  pages: unknown[];
  workflows: unknown[];
  serverCommands: unknown[];
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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
