import { contextBridge, ipcRenderer } from 'electron';

export interface AnalysisOptions {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
}

export interface Settings {
  outputFolder: string;
  options: AnalysisOptions;
}

export interface ProgressInfo {
  progress: number;
  message: string;
}

export interface AnalysisResponse {
  success: boolean;
  analysisResult?: AnalysisResult;
  reviewResult?: ReviewResult;
  outputDir?: string;
  generatedFiles?: string[];
  error?: string;
}

export interface AnalysisResult {
  projectName: string;
  tables: TableInfo[];
  pages: PageInfo[];
  workflows: WorkflowInfo[];
  serverCommands: ServerCommandInfo[];
  summary: AnalysisSummary;
}

export interface TableInfo {
  name: string;
  folder: string;
  columns: ColumnInfo[];
  relations: RelationInfo[];
  workflow?: WorkflowInfo;
}

export interface ColumnInfo {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  defaultValue?: string;
}

export interface RelationInfo {
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  type: string;
}

export interface PageInfo {
  name: string;
  type: 'page' | 'masterPage';
  path: string;
  buttons: ButtonInfo[];
  formulas: FormulaInfo[];
}

export interface ButtonInfo {
  name: string;
  commands: CommandInfo[];
}

export interface CommandInfo {
  type: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface FormulaInfo {
  cell: string;
  formula: string;
}

export interface WorkflowInfo {
  tableName: string;
  states: string[];
  transitions: TransitionInfo[];
}

export interface TransitionInfo {
  fromState: string;
  toState: string;
  action: string;
  conditions: string[];
  assignees: string[];
  commands: CommandInfo[];
}

export interface ServerCommandInfo {
  name: string;
  folder: string;
  commands: string[];
  rawCommands: CommandInfo[];
}

export interface AnalysisSummary {
  tableCount: number;
  pageCount: number;
  workflowCount: number;
  serverCommandCount: number;
  totalColumns: number;
  totalRelations: number;
}

export interface ReviewResult {
  issues: ReviewIssue[];
  summary: ReviewSummary;
}

export interface ReviewIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  location: string;
  suggestion?: string;
}

export interface ReviewSummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

const electronAPI = {
  // ファイル操作
  selectFile: (): Promise<string | null> => ipcRenderer.invoke('select-file'),
  selectOutputFolder: (): Promise<string | null> => ipcRenderer.invoke('select-output-folder'),
  openFolder: (path: string): Promise<void> => ipcRenderer.invoke('open-folder', path),
  openFile: (path: string): Promise<void> => ipcRenderer.invoke('open-file', path),

  // 設定
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings): Promise<boolean> => ipcRenderer.invoke('save-settings', settings),

  // 解析
  analyzeProject: (filePath: string, options: AnalysisOptions): Promise<AnalysisResponse> =>
    ipcRenderer.invoke('analyze-project', filePath, options),

  // 進捗イベント
  onAnalysisProgress: (callback: (progress: ProgressInfo) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: ProgressInfo) => callback(data);
    ipcRenderer.on('analysis-progress', handler);
    return () => ipcRenderer.removeListener('analysis-progress', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
