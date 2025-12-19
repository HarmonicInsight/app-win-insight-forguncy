// Forguncy プロジェクト解析の型定義

export interface AnalysisOptions {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
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
  description?: string;
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
  cellCommands: CellCommandInfo[];
}

export interface ButtonInfo {
  name: string;
  cell?: string;
  commands: CommandInfo[];
}

export interface CellCommandInfo {
  cell: string;
  event: string;
  commands: CommandInfo[];
}

export interface CommandInfo {
  type: string;
  description: string;
  details?: Record<string, unknown>;
  subCommands?: CommandInfo[];
}

export interface FormulaInfo {
  cell: string;
  formula: string;
}

export interface WorkflowInfo {
  tableName: string;
  states: StateInfo[];
  transitions: TransitionInfo[];
}

export interface StateInfo {
  name: string;
  isInitial?: boolean;
  isFinal?: boolean;
}

export interface TransitionInfo {
  fromState: string;
  toState: string;
  action: string;
  conditions: ConditionInfo[];
  assignees: AssigneeInfo[];
  commands: CommandInfo[];
}

export interface ConditionInfo {
  type: string;
  field?: string;
  operator?: string;
  value?: string;
  expression?: string;
}

export interface AssigneeInfo {
  type: 'user' | 'role' | 'field' | 'creator' | 'previousAssignee';
  value: string;
}

export interface ServerCommandInfo {
  name: string;
  folder: string;
  path: string;
  commands: string[];
  rawCommands: CommandInfo[];
  parameters?: ParameterInfo[];
}

export interface ParameterInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
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
  orgImpact?: OrgImpactResult;
}

export interface ReviewIssue {
  severity: 'high' | 'medium' | 'low';
  category: ReviewCategory;
  title: string;
  description: string;
  location: string;
  code?: string;
  suggestion?: string;
  fixGuide?: string;
}

export type ReviewCategory =
  | 'security'
  | 'bug'
  | 'performance'
  | 'maintainability'
  | 'workflow'
  | 'organization';

export interface ReviewSummary {
  high: number;
  medium: number;
  low: number;
  total: number;
  byCategory: Record<ReviewCategory, number>;
}

export interface OrgImpactResult {
  hardcodedUsers: HardcodedReference[];
  hardcodedEmails: HardcodedReference[];
  roleReferences: RoleReference[];
  approvalFlows: ApprovalFlowReference[];
}

export interface HardcodedReference {
  value: string;
  location: string;
  context: string;
}

export interface RoleReference {
  roleName: string;
  location: string;
  usage: string;
}

export interface ApprovalFlowReference {
  workflow: string;
  transition: string;
  assignees: string[];
  order: number;
}

// Forguncy JSON構造の型定義（内部解析用）

export interface ForguncyTableJson {
  Name?: string;
  Columns?: ForguncyColumn[];
  Relations?: ForguncyRelation[];
  BindingRelatedWorkflow?: ForguncyWorkflow;
  [key: string]: unknown;
}

export interface ForguncyColumn {
  Name?: string;
  ColumnType?: string;
  Required?: boolean;
  Unique?: boolean;
  DefaultValue?: unknown;
  Description?: string;
  [key: string]: unknown;
}

export interface ForguncyRelation {
  TargetTableName?: string;
  SourceColumnName?: string;
  TargetColumnName?: string;
  RelationType?: string;
  [key: string]: unknown;
}

export interface ForguncyWorkflow {
  States?: ForguncyState[];
  Transitions?: ForguncyTransition[];
  [key: string]: unknown;
}

export interface ForguncyState {
  Name?: string;
  IsInitialState?: boolean;
  IsFinalState?: boolean;
  [key: string]: unknown;
}

export interface ForguncyTransition {
  SourceStateName?: string;
  TargetStateName?: string;
  ActionName?: string;
  Condition?: ForguncyCondition;
  Assignees?: ForguncyAssignee[];
  Commands?: ForguncyCommand[];
  [key: string]: unknown;
}

export interface ForguncyCondition {
  '$type'?: string;
  Expression?: string;
  LeftOperand?: unknown;
  Operator?: string;
  RightOperand?: unknown;
  [key: string]: unknown;
}

export interface ForguncyAssignee {
  '$type'?: string;
  UserName?: string;
  RoleName?: string;
  FieldName?: string;
  [key: string]: unknown;
}

export interface ForguncyCommand {
  '$type'?: string;
  Condition?: ForguncyCondition;
  TrueCommands?: ForguncyCommand[];
  FalseCommands?: ForguncyCommand[];
  SqlStatement?: string;
  TableName?: string;
  ColumnMappings?: unknown[];
  EmailTo?: string;
  EmailSubject?: string;
  EmailBody?: string;
  [key: string]: unknown;
}

export interface ForguncyPageJson {
  Name?: string;
  Cells?: Record<string, ForguncyCell>;
  [key: string]: unknown;
}

export interface ForguncyCell {
  Formula?: string;
  Commands?: ForguncyCommand[];
  ButtonText?: string;
  [key: string]: unknown;
}

export interface ForguncyServerCommandJson {
  Name?: string;
  Commands?: ForguncyCommand[];
  Parameters?: ForguncyParameter[];
  [key: string]: unknown;
}

export interface ForguncyParameter {
  Name?: string;
  Type?: string;
  Required?: boolean;
  DefaultValue?: unknown;
  [key: string]: unknown;
}
