#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FGCPパーサーモジュール

Forguncyプロジェクトファイル（FGCP）を解析し、
テーブル、ページ、ワークフロー、サーバーコマンドの情報を抽出する。
"""

import json
import traceback
import zipfile
from pathlib import Path
from typing import Callable, Dict, List, Optional

from core.logging_setup import logger
from core.models import (
    AnalysisResult, AnalysisSummary, AssigneeInfo, ButtonInfo, CellCommandInfo,
    ColumnInfo, CommandInfo, ConditionInfo, DiffResult, FormulaInfo, PageInfo,
    ParameterInfo, RelationInfo, ServerCommandInfo, StateInfo, TableInfo,
    TransitionInfo, WorkflowInfo
)
from licensing.verify import FEATURE_LIMITS


# =============================================================================
# JSON抽出
# =============================================================================
def extract_json(content: str) -> dict:
    """Forguncy特殊形式のJSONを抽出"""
    cleaned = content.lstrip('\ufeff')
    start = cleaned.find('{')
    if start == -1:
        raise ValueError("No JSON object found")

    brace_count = 0
    in_string = False
    escape = False

    for i in range(start, len(cleaned)):
        char = cleaned[i]
        if escape:
            escape = False
            continue
        if char == '\\' and in_string:
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    return json.loads(cleaned[start:i+1])

    raise ValueError("Invalid JSON structure")


# =============================================================================
# 型抽出ユーティリティ
# =============================================================================
def extract_column_type(column_type: Optional[str]) -> str:
    """カラム型を抽出"""
    if not column_type:
        return "Text"
    parts = column_type.split(',')[0].split('.')
    return parts[-1] if parts else "Text"


def extract_command_type_name(type_string: str) -> str:
    """コマンド型名を抽出"""
    if not type_string:
        return "Unknown"
    parts = type_string.split(',')[0].split('.')
    return parts[-1] if parts else "Unknown"


def infer_parameter_type(validation_info: Optional[dict]) -> str:
    """パラメータ型を推定"""
    if not validation_info:
        return 'Text'
    number_type = validation_info.get('NumberType')
    return {4: 'DateTime', 1: 'Integer', 2: 'Decimal'}.get(number_type, 'Text')


# =============================================================================
# 条件・担当者パース
# =============================================================================
def format_condition(condition: Optional[dict]) -> str:
    """条件をフォーマット"""
    if not condition:
        return "(条件なし)"
    if condition.get('Expression'):
        return str(condition['Expression'])
    left = condition.get('LeftOperand', '')
    op = condition.get('Operator', '==')
    right = condition.get('RightOperand', '')
    return f"{left} {op} {right}"


def parse_conditions(condition: Optional[dict]) -> List[ConditionInfo]:
    """条件をパース"""
    if not condition:
        return []
    conditions = []
    cond_type = condition.get('$type', '')
    if 'ExpressionCondition' in cond_type:
        conditions.append(ConditionInfo(type='expression', expression=condition.get('Expression')))
    elif 'CompareCondition' in cond_type:
        conditions.append(ConditionInfo(
            type='compare',
            field=str(condition.get('LeftOperand', '')),
            operator=condition.get('Operator', '=='),
            value=str(condition.get('RightOperand', ''))
        ))
    return conditions


def parse_assignees(assignees: list) -> List[AssigneeInfo]:
    """担当者をパース"""
    result = []
    for a in assignees:
        a_type = a.get('$type', '')
        if 'UserAssignee' in a_type:
            result.append(AssigneeInfo(type='user', value=a.get('UserName', '')))
        elif 'RoleAssignee' in a_type:
            result.append(AssigneeInfo(type='role', value=a.get('RoleName', '')))
        elif 'FieldAssignee' in a_type:
            result.append(AssigneeInfo(type='field', value=a.get('FieldName', '')))
        elif 'CreatorAssignee' in a_type:
            result.append(AssigneeInfo(type='creator', value='作成者'))
        elif 'PreviousAssignee' in a_type:
            result.append(AssigneeInfo(type='previousAssignee', value='前の担当者'))
        else:
            result.append(AssigneeInfo(type='user', value='不明'))
    return result


# =============================================================================
# コマンドパース
# =============================================================================
def generate_command_description(cmd: dict, type_name: str) -> str:
    """コマンド説明を生成"""
    descriptions = {
        'ExecuteSqlCommand': 'SQL実行',
        'UpdateTableDataCommand': f"テーブル更新: {cmd.get('TableName', '')}",
        'InsertTableDataCommand': f"テーブル挿入: {cmd.get('TableName', '')}",
        'DeleteTableDataCommand': f"テーブル削除: {cmd.get('TableName', '')}",
        'SendEmailCommand': 'メール送信',
        'ConditionCommand': '条件分岐',
        'LoopCommand': 'ループ処理',
        'SetCellValueCommand': 'セル値設定',
        'NavigateCommand': 'ページ遷移',
        'CallServerCommandCommand': 'サーバーコマンド呼出',
    }
    return descriptions.get(type_name, type_name)


def parse_command(cmd: dict) -> CommandInfo:
    """コマンドをパース"""
    cmd_type = cmd.get('$type', '')
    type_name = extract_command_type_name(cmd_type)
    command = CommandInfo(type=type_name, description=generate_command_description(cmd, type_name), details={})

    if type_name == 'ConditionCommand' or 'ConditionCommand' in cmd_type:
        command.description = f"IF {format_condition(cmd.get('Condition'))}"
        command.sub_commands = parse_commands(cmd.get('TrueCommands', [])) + parse_commands(cmd.get('FalseCommands', []))

    if 'ExecuteSqlCommand' in cmd_type:
        sql = cmd.get('SqlStatement', '')
        command.details = {'sql': sql}
        command.description = f"SQL実行: {sql[:100]}..."

    if 'UpdateTableDataCommand' in cmd_type:
        command.details = {'table': cmd.get('TableName'), 'mappings': cmd.get('ColumnMappings')}
        command.description = f"テーブル更新: {cmd.get('TableName')}"

    if 'SendEmailCommand' in cmd_type:
        command.details = {'to': cmd.get('EmailTo'), 'subject': cmd.get('EmailSubject')}
        command.description = f"メール送信: {cmd.get('EmailSubject', '(件名なし)')}"

    return command


def parse_commands(commands: list) -> List[CommandInfo]:
    """コマンドリストをパース"""
    return [parse_command(cmd) for cmd in commands]


def flatten_commands_to_text(commands: list, depth: int = 0) -> List[str]:
    """コマンドをテキスト形式にフラット化"""
    lines = []
    indent = '  ' * depth
    for cmd in commands:
        cmd_type = cmd.get('$type', '')
        type_name = extract_command_type_name(cmd_type)
        if 'ConditionCommand' in cmd_type:
            lines.append(f"{indent}IF {format_condition(cmd.get('Condition'))} THEN")
            if cmd.get('TrueCommands'):
                lines.extend(flatten_commands_to_text(cmd['TrueCommands'], depth + 1))
            if cmd.get('FalseCommands'):
                lines.append(f"{indent}ELSE")
                lines.extend(flatten_commands_to_text(cmd['FalseCommands'], depth + 1))
            lines.append(f"{indent}END IF")
        elif 'LoopCommand' in cmd_type:
            lines.append(f"{indent}LOOP")
            if cmd.get('Commands'):
                lines.extend(flatten_commands_to_text(cmd['Commands'], depth + 1))
            lines.append(f"{indent}END LOOP")
        elif 'ExecuteSqlCommand' in cmd_type:
            lines.append(f"{indent}EXECUTE SQL:")
            for line in cmd.get('SqlStatement', '').split('\n'):
                lines.append(f"{indent}  {line}")
        elif 'UpdateTableDataCommand' in cmd_type:
            lines.append(f"{indent}UPDATE TABLE: {cmd.get('TableName')}")
        elif 'InsertTableDataCommand' in cmd_type:
            lines.append(f"{indent}INSERT INTO TABLE: {cmd.get('TableName')}")
        elif 'DeleteTableDataCommand' in cmd_type:
            lines.append(f"{indent}DELETE FROM TABLE: {cmd.get('TableName')}")
        elif 'SendEmailCommand' in cmd_type:
            lines.append(f"{indent}SEND EMAIL TO: {cmd.get('EmailTo')}")
            lines.append(f"{indent}  SUBJECT: {cmd.get('EmailSubject')}")
        elif 'CallServerCommandCommand' in cmd_type:
            lines.append(f"{indent}CALL SERVER COMMAND: {cmd.get('ServerCommandName', '(不明)')}")
        else:
            lines.append(f"{indent}{type_name}")
    return lines


# =============================================================================
# ワークフローパース
# =============================================================================
def parse_workflow(table_name: str, wf_data: dict) -> WorkflowInfo:
    """ワークフローをパース"""
    states = [StateInfo(
        name=s.get('Name', ''),
        is_initial=s.get('IsInitialState', False),
        is_final=s.get('IsFinalState', False)
    ) for s in wf_data.get('States', [])]

    transitions = [TransitionInfo(
        from_state=t.get('SourceStateName', ''),
        to_state=t.get('TargetStateName', ''),
        action=t.get('ActionName', ''),
        conditions=parse_conditions(t.get('Condition')),
        assignees=parse_assignees(t.get('Assignees', [])),
        commands=parse_commands(t.get('Commands', []))
    ) for t in wf_data.get('Transitions', [])]

    return WorkflowInfo(table_name=table_name, states=states, transitions=transitions)


# =============================================================================
# ページ要素抽出
# =============================================================================
def extract_page_elements(data: dict) -> dict:
    """ページからボタン、数式、セルコマンドを抽出"""
    buttons, formulas, cell_commands = [], [], []
    attach_infos = data.get('AttachInfos', {})

    for cell_address, cell_data in attach_infos.items():
        cell_type = cell_data.get('CellType', {})
        if cell_data.get('Formula'):
            formulas.append(FormulaInfo(cell=cell_address, formula=str(cell_data['Formula'])))

        if cell_type:
            type_str = cell_type.get('$type', '')
            if 'MenuCellType' in type_str or 'ForguncyMenuCellType' in type_str:
                extract_menu_items(cell_type.get('Items', []), buttons, cell_address)
            if 'ButtonCellType' in type_str:
                text = cell_type.get('Text') or cell_type.get('Content') or 'ボタン'
                command_list = cell_type.get('CommandList', [])
                if command_list:
                    buttons.append(ButtonInfo(name=text, cell=cell_address, commands=parse_commands(command_list)))
            command_list = cell_type.get('CommandList', [])
            if command_list and 'ButtonCellType' not in type_str:
                cell_commands.append(CellCommandInfo(cell=cell_address, event='Click', commands=parse_commands(command_list)))

    return {'buttons': buttons, 'formulas': formulas, 'cell_commands': cell_commands}


def extract_menu_items(items: list, buttons: list, base_cell: str):
    """メニューアイテムを抽出"""
    for item in items:
        if item.get('CommandList'):
            buttons.append(ButtonInfo(
                name=f"メニュー: {item.get('Text', '(名称なし)')}",
                cell=base_cell,
                commands=parse_commands(item['CommandList'])
            ))
        if item.get('SubItems'):
            extract_menu_items(item['SubItems'], buttons, base_cell)


# =============================================================================
# メイン解析関数
# =============================================================================
def analyze_project(
    file_path: str,
    progress_callback: Optional[Callable[[int, str], None]] = None,
    limits: Optional[Dict] = None
) -> AnalysisResult:
    """
    Forguncyプロジェクトを解析

    Args:
        file_path: FGCPファイルパス
        progress_callback: 進捗コールバック (pct, msg)
        limits: 機能制限設定

    Returns:
        AnalysisResult: 解析結果

    Raises:
        zipfile.BadZipFile: 不正なZIPファイル
        Exception: その他のエラー
    """
    def send_progress(pct, msg):
        if progress_callback:
            progress_callback(pct, msg)

    logger.info(f"解析開始: {file_path}")
    project_name = Path(file_path).stem
    limits = limits or FEATURE_LIMITS['FREE']

    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            entries = zf.namelist()
            logger.debug(f"ZIPエントリ数: {len(entries)}")

            send_progress(15, 'テーブル定義を解析しています...')
            max_tables = limits.get('max_tables', 5)
            tables = analyze_tables(zf, entries, 999999 if max_tables == float('inf') else int(max_tables))
            logger.info(f"テーブル解析完了: {len(tables)}件")

            send_progress(25, 'ページ定義を解析しています...')
            max_pages = limits.get('max_pages', 10)
            pages = analyze_pages(zf, entries, 999999 if max_pages == float('inf') else int(max_pages))
            logger.info(f"ページ解析完了: {len(pages)}件")

            send_progress(35, 'ワークフローを解析しています...')
            max_wf = limits.get('max_workflows', 1)
            max_wf = 999999 if max_wf == float('inf') else int(max_wf)
            workflows = [t.workflow for t in tables if t.workflow][:max_wf]
            logger.info(f"ワークフロー解析完了: {len(workflows)}件")

            send_progress(45, 'サーバーコマンドを解析しています...')
            max_cmds = limits.get('max_server_commands', 3)
            server_commands = analyze_server_commands(zf, entries, 999999 if max_cmds == float('inf') else int(max_cmds))
            logger.info(f"サーバーコマンド解析完了: {len(server_commands)}件")

        summary = AnalysisSummary(
            table_count=len(tables),
            page_count=len(pages),
            workflow_count=len(workflows),
            server_command_count=len(server_commands),
            total_columns=sum(len(t.columns) for t in tables),
            total_relations=sum(len(t.relations) for t in tables)
        )

        logger.info(f"解析完了: テーブル={summary.table_count}, ページ={summary.page_count}, "
                    f"ワークフロー={summary.workflow_count}, サーバーコマンド={summary.server_command_count}")

        return AnalysisResult(
            project_name=project_name,
            tables=tables,
            pages=pages,
            workflows=workflows,
            server_commands=server_commands,
            summary=summary
        )

    except zipfile.BadZipFile as e:
        logger.error(f"不正なZIPファイル: {e}")
        raise
    except Exception as e:
        logger.error(f"解析エラー: {e}\n{traceback.format_exc()}")
        raise


def analyze_tables(zf: zipfile.ZipFile, entries: list, max_count: int = 999) -> List[TableInfo]:
    """テーブルを解析"""
    tables = []
    table_entries = [e for e in entries if e.startswith('Tables/') and e.endswith('.json')][:max_count]

    for entry in table_entries:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            path_parts = entry.split('/')
            folder = path_parts[1] if len(path_parts) > 2 else ''

            columns = [ColumnInfo(
                name=col.get('Name', ''),
                type=extract_column_type(col.get('ColumnType')),
                required=col.get('Required', False),
                unique=col.get('Unique', False),
                default_value=str(col['DefaultValue']) if col.get('DefaultValue') is not None else None,
                description=col.get('Description')
            ) for col in data.get('Columns', [])]

            relations = [RelationInfo(
                target_table=rel.get('TargetTableName', ''),
                source_column=rel.get('SourceColumnName', ''),
                target_column=rel.get('TargetColumnName', ''),
                relation_type=rel.get('RelationType', 'OneToMany')
            ) for rel in data.get('Relations', [])]

            primary_key = data.get('PrimaryKey', [])
            if isinstance(primary_key, str):
                primary_key = [primary_key]

            table = TableInfo(
                name=data.get('Name', Path(entry).stem),
                folder=folder,
                columns=columns,
                relations=relations,
                primary_key=primary_key
            )

            if data.get('BindingRelatedWorkflow'):
                table.workflow = parse_workflow(table.name, data['BindingRelatedWorkflow'])

            tables.append(table)
        except Exception as e:
            logger.warning(f"テーブル解析スキップ {entry}: {e}")

    return tables


def analyze_pages(zf: zipfile.ZipFile, entries: list, max_count: int = 999) -> List[PageInfo]:
    """ページを解析"""
    pages = []
    parse_errors = []

    for entry in [e for e in entries if e.startswith('Pages/') and e.endswith('.json')][:max_count]:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            elements = extract_page_elements(data)
            path_parts = entry.split('/')
            folder = '/'.join(path_parts[1:-1]) if len(path_parts) > 2 else ''
            pages.append(PageInfo(
                name=data.get('Name', Path(entry).stem),
                page_type='page',
                path=entry,
                folder=folder,
                **elements
            ))
        except Exception as e:
            parse_errors.append(f"Page {entry}: {e}")

    for entry in [e for e in entries if e.startswith('MasterPages/') and e.endswith('.json')]:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            elements = extract_page_elements(data)
            pages.append(PageInfo(
                name=data.get('Name', Path(entry).stem),
                page_type='masterPage',
                path=entry,
                folder='MasterPages',
                **elements
            ))
        except Exception as e:
            parse_errors.append(f"MasterPage {entry}: {e}")

    if parse_errors:
        for err in parse_errors[:5]:
            logger.warning(err)
        if len(parse_errors) > 5:
            logger.warning(f"... 他 {len(parse_errors) - 5} 件のエラー")

    return pages


def analyze_server_commands(zf: zipfile.ZipFile, entries: list, max_count: int = 999) -> List[ServerCommandInfo]:
    """サーバーコマンドを解析"""
    server_commands = []
    cmd_entries = [e for e in entries if e.startswith('ServerCommands/') and e.endswith('.json')][:max_count]

    for entry in cmd_entries:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            path_parts = entry.split('/')
            folder = path_parts[1] if len(path_parts) > 2 else ''

            raw_commands = parse_commands(data.get('Commands', []))
            commands = flatten_commands_to_text(data.get('Commands', []))

            parameters = []
            triggers = data.get('Triggers', [])
            if triggers:
                for p in triggers[0].get('Parameters', []):
                    parameters.append(ParameterInfo(
                        name=p.get('Name', ''),
                        type=infer_parameter_type(p.get('DataValidationInfo')),
                        required=True
                    ))

            if not parameters and data.get('Parameters'):
                for p in data['Parameters']:
                    parameters.append(ParameterInfo(
                        name=p.get('Name', ''),
                        type=extract_column_type(p.get('Type')),
                        required=p.get('Required', False),
                        default_value=str(p['DefaultValue']) if p.get('DefaultValue') is not None else None
                    ))

            server_commands.append(ServerCommandInfo(
                name=data.get('Name', Path(entry).stem),
                folder=folder,
                path=entry,
                commands=commands,
                raw_commands=raw_commands,
                parameters=parameters
            ))
        except Exception as e:
            logger.warning(f"サーバーコマンド解析スキップ {entry}: {e}")

    return server_commands


# =============================================================================
# 差分比較
# =============================================================================
def compare_projects(old_analysis: AnalysisResult, new_analysis: AnalysisResult) -> DiffResult:
    """2つのプロジェクトを比較（詳細な差分情報付き）"""
    diff = DiffResult()

    # テーブル比較
    old_tables = {t.name: t for t in old_analysis.tables}
    new_tables = {t.name: t for t in new_analysis.tables}

    diff.added_tables = [t for name, t in new_tables.items() if name not in old_tables]
    diff.removed_tables = [t for name, t in old_tables.items() if name not in new_tables]

    for name in set(old_tables.keys()) & set(new_tables.keys()):
        old_t, new_t = old_tables[name], new_tables[name]
        old_cols = {c.name: c for c in old_t.columns}
        new_cols = {c.name: c for c in new_t.columns}

        # 詳細なカラム変更を検出
        added_cols = [c for c in new_t.columns if c.name not in old_cols]
        removed_cols = [c for c in old_t.columns if c.name not in new_cols]
        modified_cols = []
        for col_name in set(old_cols.keys()) & set(new_cols.keys()):
            old_c, new_c = old_cols[col_name], new_cols[col_name]
            changes = []
            if old_c.type != new_c.type:
                changes.append(f"型: {old_c.type} → {new_c.type}")
            if old_c.required != new_c.required:
                changes.append(f"必須: {old_c.required} → {new_c.required}")
            if old_c.default_value != new_c.default_value:
                changes.append(f"デフォルト: {old_c.default_value} → {new_c.default_value}")
            if changes:
                modified_cols.append({'name': col_name, 'changes': changes})

        if added_cols or removed_cols or modified_cols:
            diff.modified_tables.append({
                'name': name,
                'old': old_t,
                'new': new_t,
                'added_columns': added_cols,
                'removed_columns': removed_cols,
                'modified_columns': modified_cols,
            })

    # ページ比較（詳細）
    old_pages = {p.name: p for p in old_analysis.pages}
    new_pages = {p.name: p for p in new_analysis.pages}

    diff.added_pages = [p for name, p in new_pages.items() if name not in old_pages]
    diff.removed_pages = [p for name, p in old_pages.items() if name not in new_pages]

    # ページ変更の詳細検出
    diff.modified_pages = []
    for name in set(old_pages.keys()) & set(new_pages.keys()):
        old_p, new_p = old_pages[name], new_pages[name]
        changes = []

        # ボタン変更
        old_btns = {b.name or f"btn_{i}": b for i, b in enumerate(old_p.buttons)}
        new_btns = {b.name or f"btn_{i}": b for i, b in enumerate(new_p.buttons)}
        added_btns = [b for n, b in new_btns.items() if n not in old_btns]
        removed_btns = [b for n, b in old_btns.items() if n not in new_btns]

        # 数式変更
        old_formulas = set(f.formula for f in old_p.formulas)
        new_formulas = set(f.formula for f in new_p.formulas)
        added_formulas = new_formulas - old_formulas
        removed_formulas = old_formulas - new_formulas

        if added_btns or removed_btns or added_formulas or removed_formulas:
            diff.modified_pages.append({
                'name': name,
                'old': old_p,
                'new': new_p,
                'added_buttons': added_btns,
                'removed_buttons': removed_btns,
                'added_formulas': list(added_formulas),
                'removed_formulas': list(removed_formulas),
            })

    # サーバーコマンド比較（詳細）
    old_cmds = {c.name: c for c in old_analysis.server_commands}
    new_cmds = {c.name: c for c in new_analysis.server_commands}

    diff.added_server_commands = [c for name, c in new_cmds.items() if name not in old_cmds]
    diff.removed_server_commands = [c for name, c in old_cmds.items() if name not in new_cmds]

    for name in set(old_cmds.keys()) & set(new_cmds.keys()):
        old_c, new_c = old_cmds[name], new_cmds[name]

        # パラメータ変更
        old_params = {p.name: p for p in old_c.parameters}
        new_params = {p.name: p for p in new_c.parameters}
        added_params = [p for n, p in new_params.items() if n not in old_params]
        removed_params = [p for n, p in old_params.items() if n not in new_params]

        # コマンド内容変更
        old_cmd_set = set(c.description if hasattr(c, 'description') else str(c) for c in old_c.commands)
        new_cmd_set = set(c.description if hasattr(c, 'description') else str(c) for c in new_c.commands)

        if added_params or removed_params or old_cmd_set != new_cmd_set:
            diff.modified_server_commands.append({
                'name': name,
                'old': old_c,
                'new': new_c,
                'added_parameters': added_params,
                'removed_parameters': removed_params,
                'commands_changed': old_cmd_set != new_cmd_set,
            })

    return diff
