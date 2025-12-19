import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import {
  AnalysisResult,
  TableInfo,
  ColumnInfo,
  RelationInfo,
  PageInfo,
  ButtonInfo,
  FormulaInfo,
  CellCommandInfo,
  WorkflowInfo,
  StateInfo,
  TransitionInfo,
  ConditionInfo,
  AssigneeInfo,
  CommandInfo,
  ServerCommandInfo,
  ParameterInfo,
  AnalysisSummary,
  ForguncyTableJson,
  ForguncyPageJson,
  ForguncyServerCommandJson,
  ForguncyCommand,
  ForguncyCondition,
  ForguncyAssignee,
} from './types';

type ProgressCallback = (progress: number, message: string) => void;

/**
 * Forguncy プロジェクト (.fgcp) を解析する
 */
export async function analyzeProject(
  filePath: string,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const sendProgress = onProgress || (() => {});

  // ZIPファイルを開く
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  // プロジェクト名を取得
  const projectName = path.basename(filePath, '.fgcp');

  sendProgress(15, 'テーブル定義を解析しています...');
  const tables = await analyzeTables(zip, entries);

  sendProgress(25, 'ページ定義を解析しています...');
  const pages = await analyzePages(zip, entries);

  sendProgress(35, 'ワークフローを解析しています...');
  const workflows = extractWorkflows(tables);

  sendProgress(45, 'サーバーコマンドを解析しています...');
  const serverCommands = await analyzeServerCommands(zip, entries);

  // サマリーを計算
  const summary: AnalysisSummary = {
    tableCount: tables.length,
    pageCount: pages.length,
    workflowCount: workflows.length,
    serverCommandCount: serverCommands.length,
    totalColumns: tables.reduce((sum, t) => sum + t.columns.length, 0),
    totalRelations: tables.reduce((sum, t) => sum + t.relations.length, 0),
  };

  return {
    projectName,
    tables,
    pages,
    workflows,
    serverCommands,
    summary,
  };
}

/**
 * JSON文字列からJSONオブジェクトを抽出する
 * Forguncyの特殊形式（BOM + メタデータ）に対応
 */
function extractJson(content: string): Record<string, unknown> {
  // BOMを除去
  let cleaned = content.replace(/^\uFEFF/, '');

  // 最初の { を探す
  const start = cleaned.indexOf('{');
  if (start === -1) {
    throw new Error('No JSON object found');
  }

  // バランスの取れた {} を探す
  let braceCount = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return JSON.parse(cleaned.slice(start, i + 1));
        }
      }
    }
  }

  throw new Error('Invalid JSON structure - unbalanced braces');
}

/**
 * テーブル定義を解析
 */
async function analyzeTables(
  zip: AdmZip,
  entries: AdmZip.IZipEntry[]
): Promise<TableInfo[]> {
  const tables: TableInfo[] = [];
  const tableEntries = entries.filter(
    (e) => e.entryName.startsWith('Tables/') && e.entryName.endsWith('.json')
  );

  for (const entry of tableEntries) {
    try {
      const content = zip.readAsText(entry);
      const data = extractJson(content) as ForguncyTableJson;

      const pathParts = entry.entryName.split('/');
      const folder = pathParts.length > 2 ? pathParts[1] : '';

      const columns: ColumnInfo[] = (data.Columns || []).map((col) => ({
        name: col.Name || '',
        type: extractColumnType(col.ColumnType),
        required: col.Required || false,
        unique: col.Unique || false,
        defaultValue: col.DefaultValue !== undefined ? String(col.DefaultValue) : undefined,
        description: col.Description,
      }));

      const relations: RelationInfo[] = (data.Relations || []).map((rel) => ({
        targetTable: rel.TargetTableName || '',
        sourceColumn: rel.SourceColumnName || '',
        targetColumn: rel.TargetColumnName || '',
        type: rel.RelationType || 'OneToMany',
      }));

      const table: TableInfo = {
        name: data.Name || path.basename(entry.entryName, '.json'),
        folder,
        columns,
        relations,
      };

      // ワークフローを解析
      if (data.BindingRelatedWorkflow) {
        table.workflow = parseWorkflow(data.Name || '', data.BindingRelatedWorkflow);
      }

      tables.push(table);
    } catch (error) {
      console.error(`Error parsing table ${entry.entryName}:`, error);
    }
  }

  return tables;
}

/**
 * カラム型を抽出
 */
function extractColumnType(columnType?: string): string {
  if (!columnType) return 'Text';
  // "GrapeCity.Forguncy.Core.ColumnType.Text, ..." のような形式から型名を抽出
  const parts = columnType.split(',')[0].split('.');
  return parts[parts.length - 1] || 'Text';
}

/**
 * ワークフローを解析
 */
function parseWorkflow(tableName: string, wfData: Record<string, unknown>): WorkflowInfo {
  const states: StateInfo[] = ((wfData.States as unknown[]) || []).map((s: unknown) => {
    const state = s as { Name?: string; IsInitialState?: boolean; IsFinalState?: boolean };
    return {
      name: state.Name || '',
      isInitial: state.IsInitialState,
      isFinal: state.IsFinalState,
    };
  });

  const transitions: TransitionInfo[] = ((wfData.Transitions as unknown[]) || []).map((t: unknown) => {
    const trans = t as {
      SourceStateName?: string;
      TargetStateName?: string;
      ActionName?: string;
      Condition?: ForguncyCondition;
      Assignees?: ForguncyAssignee[];
      Commands?: ForguncyCommand[];
    };
    return {
      fromState: trans.SourceStateName || '',
      toState: trans.TargetStateName || '',
      action: trans.ActionName || '',
      conditions: parseConditions(trans.Condition),
      assignees: parseAssignees(trans.Assignees || []),
      commands: parseCommands(trans.Commands || []),
    };
  });

  return { tableName, states, transitions };
}

/**
 * 条件を解析
 */
function parseConditions(condition?: ForguncyCondition): ConditionInfo[] {
  if (!condition) return [];

  const conditions: ConditionInfo[] = [];
  const condType = condition['$type'] || '';

  if (condType.includes('ExpressionCondition')) {
    conditions.push({
      type: 'expression',
      expression: condition.Expression as string,
    });
  } else if (condType.includes('CompareCondition')) {
    conditions.push({
      type: 'compare',
      field: String(condition.LeftOperand || ''),
      operator: condition.Operator || '==',
      value: String(condition.RightOperand || ''),
    });
  }

  return conditions;
}

/**
 * 担当者を解析
 */
function parseAssignees(assignees: ForguncyAssignee[]): AssigneeInfo[] {
  return assignees.map((a) => {
    const aType = a['$type'] || '';

    if (aType.includes('UserAssignee')) {
      return { type: 'user' as const, value: a.UserName || '' };
    } else if (aType.includes('RoleAssignee')) {
      return { type: 'role' as const, value: a.RoleName || '' };
    } else if (aType.includes('FieldAssignee')) {
      return { type: 'field' as const, value: a.FieldName || '' };
    } else if (aType.includes('CreatorAssignee')) {
      return { type: 'creator' as const, value: '作成者' };
    } else if (aType.includes('PreviousAssignee')) {
      return { type: 'previousAssignee' as const, value: '前の担当者' };
    }

    return { type: 'user' as const, value: '不明' };
  });
}

/**
 * コマンドを解析（再帰的）
 */
function parseCommands(commands: ForguncyCommand[]): CommandInfo[] {
  return commands.map((cmd) => parseCommand(cmd));
}

function parseCommand(cmd: ForguncyCommand): CommandInfo {
  const cmdType = cmd['$type'] || '';
  const typeName = extractCommandTypeName(cmdType);

  const command: CommandInfo = {
    type: typeName,
    description: generateCommandDescription(cmd, typeName),
    details: {},
  };

  // 条件分岐コマンド
  if (typeName === 'ConditionCommand' || cmdType.includes('ConditionCommand')) {
    command.description = `IF ${formatCondition(cmd.Condition)}`;
    command.subCommands = [
      ...parseCommands(cmd.TrueCommands || []),
      ...(cmd.FalseCommands ? parseCommands(cmd.FalseCommands) : []),
    ];
  }

  // SQLコマンド
  if (cmdType.includes('ExecuteSqlCommand')) {
    command.details = { sql: cmd.SqlStatement };
    command.description = `SQL実行: ${(cmd.SqlStatement || '').slice(0, 100)}...`;
  }

  // テーブル操作
  if (cmdType.includes('UpdateTableDataCommand')) {
    command.details = { table: cmd.TableName, mappings: cmd.ColumnMappings };
    command.description = `テーブル更新: ${cmd.TableName}`;
  }

  // メール送信
  if (cmdType.includes('SendEmailCommand')) {
    command.details = { to: cmd.EmailTo, subject: cmd.EmailSubject };
    command.description = `メール送信: ${cmd.EmailSubject || '(件名なし)'}`;
  }

  return command;
}

function extractCommandTypeName(typeString: string): string {
  if (!typeString) return 'Unknown';
  const parts = typeString.split(',')[0].split('.');
  return parts[parts.length - 1] || 'Unknown';
}

function generateCommandDescription(cmd: ForguncyCommand, typeName: string): string {
  switch (typeName) {
    case 'ExecuteSqlCommand':
      return `SQL実行`;
    case 'UpdateTableDataCommand':
      return `テーブル更新: ${cmd.TableName || ''}`;
    case 'InsertTableDataCommand':
      return `テーブル挿入: ${cmd.TableName || ''}`;
    case 'DeleteTableDataCommand':
      return `テーブル削除: ${cmd.TableName || ''}`;
    case 'SendEmailCommand':
      return `メール送信`;
    case 'ConditionCommand':
      return `条件分岐`;
    case 'LoopCommand':
      return `ループ処理`;
    case 'SetCellValueCommand':
      return `セル値設定`;
    case 'NavigateCommand':
      return `ページ遷移`;
    case 'CallServerCommandCommand':
      return `サーバーコマンド呼出`;
    default:
      return typeName;
  }
}

function formatCondition(condition?: ForguncyCondition): string {
  if (!condition) return '(条件なし)';

  if (condition.Expression) {
    return String(condition.Expression);
  }

  const left = condition.LeftOperand || '';
  const op = condition.Operator || '==';
  const right = condition.RightOperand || '';

  return `${left} ${op} ${right}`;
}

/**
 * ページ定義を解析
 */
async function analyzePages(
  zip: AdmZip,
  entries: AdmZip.IZipEntry[]
): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  // 通常ページ
  const pageEntries = entries.filter(
    (e) => e.entryName.startsWith('Pages/') && e.entryName.endsWith('.json')
  );

  for (const entry of pageEntries) {
    try {
      const content = zip.readAsText(entry);
      const data = extractJson(content) as ForguncyPageJson;

      pages.push({
        name: data.Name || path.basename(entry.entryName, '.json'),
        type: 'page',
        path: entry.entryName,
        ...extractPageElements(data),
      });
    } catch (error) {
      console.error(`Error parsing page ${entry.entryName}:`, error);
    }
  }

  // マスターページ
  const masterPageEntries = entries.filter(
    (e) => e.entryName.startsWith('MasterPages/') && e.entryName.endsWith('.json')
  );

  for (const entry of masterPageEntries) {
    try {
      const content = zip.readAsText(entry);
      const data = extractJson(content) as ForguncyPageJson;

      pages.push({
        name: data.Name || path.basename(entry.entryName, '.json'),
        type: 'masterPage',
        path: entry.entryName,
        ...extractPageElements(data),
      });
    } catch (error) {
      console.error(`Error parsing master page ${entry.entryName}:`, error);
    }
  }

  return pages;
}

/**
 * ページ内の要素（ボタン、数式など）を抽出
 */
function extractPageElements(data: ForguncyPageJson): {
  buttons: ButtonInfo[];
  formulas: FormulaInfo[];
  cellCommands: CellCommandInfo[];
} {
  const buttons: ButtonInfo[] = [];
  const formulas: FormulaInfo[] = [];
  const cellCommands: CellCommandInfo[] = [];

  const cells = data.Cells || {};

  for (const [cellAddress, cell] of Object.entries(cells)) {
    // 数式を抽出
    if (cell.Formula) {
      formulas.push({
        cell: cellAddress,
        formula: cell.Formula,
      });
    }

    // ボタンを抽出
    if (cell.ButtonText && cell.Commands) {
      buttons.push({
        name: cell.ButtonText,
        cell: cellAddress,
        commands: parseCommands(cell.Commands),
      });
    }

    // その他のセルコマンドを抽出
    if (cell.Commands && !cell.ButtonText) {
      cellCommands.push({
        cell: cellAddress,
        event: 'Click',
        commands: parseCommands(cell.Commands),
      });
    }
  }

  return { buttons, formulas, cellCommands };
}

/**
 * 全テーブルからワークフローを抽出
 */
function extractWorkflows(tables: TableInfo[]): WorkflowInfo[] {
  return tables
    .filter((t) => t.workflow)
    .map((t) => t.workflow!);
}

/**
 * サーバーコマンドを解析
 */
async function analyzeServerCommands(
  zip: AdmZip,
  entries: AdmZip.IZipEntry[]
): Promise<ServerCommandInfo[]> {
  const serverCommands: ServerCommandInfo[] = [];

  const cmdEntries = entries.filter(
    (e) => e.entryName.startsWith('ServerCommands/') && e.entryName.endsWith('.json')
  );

  for (const entry of cmdEntries) {
    try {
      const content = zip.readAsText(entry);
      const data = extractJson(content) as ForguncyServerCommandJson;

      const pathParts = entry.entryName.split('/');
      const folder = pathParts.length > 2 ? pathParts[1] : '';

      const rawCommands = parseCommands(data.Commands || []);
      const commands = flattenCommandsToText(data.Commands || []);

      const parameters: ParameterInfo[] = (data.Parameters || []).map((p) => ({
        name: p.Name || '',
        type: extractColumnType(p.Type),
        required: p.Required || false,
        defaultValue: p.DefaultValue !== undefined ? String(p.DefaultValue) : undefined,
      }));

      serverCommands.push({
        name: data.Name || path.basename(entry.entryName, '.json'),
        folder,
        path: entry.entryName,
        commands,
        rawCommands,
        parameters,
      });
    } catch (error) {
      console.error(`Error parsing server command ${entry.entryName}:`, error);
    }
  }

  return serverCommands;
}

/**
 * コマンドをテキスト形式にフラット化（可読性のため）
 */
function flattenCommandsToText(commands: ForguncyCommand[], depth: number = 0): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  for (const cmd of commands) {
    const cmdType = cmd['$type'] || '';
    const typeName = extractCommandTypeName(cmdType);

    if (cmdType.includes('ConditionCommand')) {
      lines.push(`${indent}IF ${formatCondition(cmd.Condition)} THEN`);
      if (cmd.TrueCommands) {
        lines.push(...flattenCommandsToText(cmd.TrueCommands, depth + 1));
      }
      if (cmd.FalseCommands && cmd.FalseCommands.length > 0) {
        lines.push(`${indent}ELSE`);
        lines.push(...flattenCommandsToText(cmd.FalseCommands, depth + 1));
      }
      lines.push(`${indent}END IF`);
    } else if (cmdType.includes('LoopCommand')) {
      lines.push(`${indent}LOOP`);
      if ((cmd as unknown as { Commands?: ForguncyCommand[] }).Commands) {
        lines.push(...flattenCommandsToText((cmd as unknown as { Commands: ForguncyCommand[] }).Commands, depth + 1));
      }
      lines.push(`${indent}END LOOP`);
    } else if (cmdType.includes('ExecuteSqlCommand')) {
      lines.push(`${indent}EXECUTE SQL:`);
      const sql = cmd.SqlStatement || '';
      sql.split('\n').forEach((line) => {
        lines.push(`${indent}  ${line}`);
      });
    } else if (cmdType.includes('UpdateTableDataCommand')) {
      lines.push(`${indent}UPDATE TABLE: ${cmd.TableName}`);
    } else if (cmdType.includes('InsertTableDataCommand')) {
      lines.push(`${indent}INSERT INTO TABLE: ${cmd.TableName}`);
    } else if (cmdType.includes('DeleteTableDataCommand')) {
      lines.push(`${indent}DELETE FROM TABLE: ${cmd.TableName}`);
    } else if (cmdType.includes('SendEmailCommand')) {
      lines.push(`${indent}SEND EMAIL TO: ${cmd.EmailTo}`);
      lines.push(`${indent}  SUBJECT: ${cmd.EmailSubject}`);
    } else if (cmdType.includes('CallServerCommandCommand')) {
      const serverCmdName = (cmd as unknown as { ServerCommandName?: string }).ServerCommandName;
      lines.push(`${indent}CALL SERVER COMMAND: ${serverCmdName || '(不明)'}`);
    } else {
      lines.push(`${indent}${typeName}`);
    }
  }

  return lines;
}
