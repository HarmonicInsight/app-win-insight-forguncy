#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forguncy Insight - Forguncyプロジェクト解析・仕様書自動生成ツール
Python版 - シンプルな単一ファイル実装
"""

import json
import os
import re
import zipfile
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from tkinter import Tk, Frame, Label, Button, Entry, StringVar, filedialog, messagebox, ttk
from typing import Any, Optional

# python-docx
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn


# =============================================================================
# データクラス定義
# =============================================================================

@dataclass
class ColumnInfo:
    name: str
    type: str
    required: bool = False
    unique: bool = False
    default_value: Optional[str] = None
    description: Optional[str] = None


@dataclass
class RelationInfo:
    target_table: str
    source_column: str
    target_column: str
    relation_type: str = "OneToMany"


@dataclass
class CommandInfo:
    type: str
    description: str
    details: dict = field(default_factory=dict)
    sub_commands: list = field(default_factory=list)


@dataclass
class StateInfo:
    name: str
    is_initial: bool = False
    is_final: bool = False


@dataclass
class AssigneeInfo:
    type: str  # user, role, field, creator, previousAssignee
    value: str


@dataclass
class ConditionInfo:
    type: str
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[str] = None
    expression: Optional[str] = None


@dataclass
class TransitionInfo:
    from_state: str
    to_state: str
    action: str
    conditions: list = field(default_factory=list)
    assignees: list = field(default_factory=list)
    commands: list = field(default_factory=list)


@dataclass
class WorkflowInfo:
    table_name: str
    states: list = field(default_factory=list)
    transitions: list = field(default_factory=list)


@dataclass
class TableInfo:
    name: str
    folder: str = ""
    columns: list = field(default_factory=list)
    relations: list = field(default_factory=list)
    workflow: Optional[WorkflowInfo] = None


@dataclass
class FormulaInfo:
    cell: str
    formula: str


@dataclass
class ButtonInfo:
    name: str
    cell: str = ""
    commands: list = field(default_factory=list)


@dataclass
class CellCommandInfo:
    cell: str
    event: str
    commands: list = field(default_factory=list)


@dataclass
class PageInfo:
    name: str
    page_type: str  # page or masterPage
    path: str
    buttons: list = field(default_factory=list)
    formulas: list = field(default_factory=list)
    cell_commands: list = field(default_factory=list)


@dataclass
class ParameterInfo:
    name: str
    type: str
    required: bool = False
    default_value: Optional[str] = None


@dataclass
class ServerCommandInfo:
    name: str
    folder: str = ""
    path: str = ""
    commands: list = field(default_factory=list)  # テキスト形式
    raw_commands: list = field(default_factory=list)  # CommandInfo形式
    parameters: list = field(default_factory=list)


@dataclass
class AnalysisSummary:
    table_count: int = 0
    page_count: int = 0
    workflow_count: int = 0
    server_command_count: int = 0
    total_columns: int = 0
    total_relations: int = 0


@dataclass
class AnalysisResult:
    project_name: str
    tables: list = field(default_factory=list)
    pages: list = field(default_factory=list)
    workflows: list = field(default_factory=list)
    server_commands: list = field(default_factory=list)
    summary: AnalysisSummary = field(default_factory=AnalysisSummary)


# =============================================================================
# 解析ロジック
# =============================================================================

def extract_json(content: str) -> dict:
    """Forguncy特殊形式のJSONを抽出"""
    # BOM除去
    cleaned = content.lstrip('\ufeff')

    # 最初の { を探す
    start = cleaned.find('{')
    if start == -1:
        raise ValueError("No JSON object found")

    # バランスの取れた {} を探す
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


def parse_conditions(condition: Optional[dict]) -> list:
    """条件を解析"""
    if not condition:
        return []

    conditions = []
    cond_type = condition.get('$type', '')

    if 'ExpressionCondition' in cond_type:
        conditions.append(ConditionInfo(
            type='expression',
            expression=condition.get('Expression')
        ))
    elif 'CompareCondition' in cond_type:
        conditions.append(ConditionInfo(
            type='compare',
            field=str(condition.get('LeftOperand', '')),
            operator=condition.get('Operator', '=='),
            value=str(condition.get('RightOperand', ''))
        ))

    return conditions


def parse_assignees(assignees: list) -> list:
    """担当者を解析"""
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


def generate_command_description(cmd: dict, type_name: str) -> str:
    """コマンドの説明を生成"""
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
    """コマンドを解析"""
    cmd_type = cmd.get('$type', '')
    type_name = extract_command_type_name(cmd_type)

    command = CommandInfo(
        type=type_name,
        description=generate_command_description(cmd, type_name),
        details={}
    )

    # 条件分岐コマンド
    if type_name == 'ConditionCommand' or 'ConditionCommand' in cmd_type:
        command.description = f"IF {format_condition(cmd.get('Condition'))}"
        command.sub_commands = (
            parse_commands(cmd.get('TrueCommands', [])) +
            parse_commands(cmd.get('FalseCommands', []))
        )

    # SQLコマンド
    if 'ExecuteSqlCommand' in cmd_type:
        sql = cmd.get('SqlStatement', '')
        command.details = {'sql': sql}
        command.description = f"SQL実行: {sql[:100]}..."

    # テーブル操作
    if 'UpdateTableDataCommand' in cmd_type:
        command.details = {'table': cmd.get('TableName'), 'mappings': cmd.get('ColumnMappings')}
        command.description = f"テーブル更新: {cmd.get('TableName')}"

    # メール送信
    if 'SendEmailCommand' in cmd_type:
        command.details = {'to': cmd.get('EmailTo'), 'subject': cmd.get('EmailSubject')}
        command.description = f"メール送信: {cmd.get('EmailSubject', '(件名なし)')}"

    return command


def parse_commands(commands: list) -> list:
    """コマンドリストを解析"""
    return [parse_command(cmd) for cmd in commands]


def parse_workflow(table_name: str, wf_data: dict) -> WorkflowInfo:
    """ワークフローを解析"""
    states = []
    for s in wf_data.get('States', []):
        states.append(StateInfo(
            name=s.get('Name', ''),
            is_initial=s.get('IsInitialState', False),
            is_final=s.get('IsFinalState', False)
        ))

    transitions = []
    for t in wf_data.get('Transitions', []):
        transitions.append(TransitionInfo(
            from_state=t.get('SourceStateName', ''),
            to_state=t.get('TargetStateName', ''),
            action=t.get('ActionName', ''),
            conditions=parse_conditions(t.get('Condition')),
            assignees=parse_assignees(t.get('Assignees', [])),
            commands=parse_commands(t.get('Commands', []))
        ))

    return WorkflowInfo(table_name=table_name, states=states, transitions=transitions)


def flatten_commands_to_text(commands: list, depth: int = 0) -> list:
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
            sql = cmd.get('SqlStatement', '')
            for line in sql.split('\n'):
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


def infer_parameter_type(validation_info: Optional[dict]) -> str:
    """DataValidationInfoからパラメータ型を推測"""
    if not validation_info:
        return 'Text'

    number_type = validation_info.get('NumberType')
    type_map = {4: 'DateTime', 1: 'Integer', 2: 'Decimal'}
    return type_map.get(number_type, 'Text')


def analyze_project(file_path: str, progress_callback=None) -> AnalysisResult:
    """Forguncyプロジェクトを解析"""
    def send_progress(pct, msg):
        if progress_callback:
            progress_callback(pct, msg)

    project_name = Path(file_path).stem

    with zipfile.ZipFile(file_path, 'r') as zf:
        entries = zf.namelist()

        send_progress(15, 'テーブル定義を解析しています...')
        tables = analyze_tables(zf, entries)

        send_progress(25, 'ページ定義を解析しています...')
        pages = analyze_pages(zf, entries)

        send_progress(35, 'ワークフローを解析しています...')
        workflows = [t.workflow for t in tables if t.workflow]

        send_progress(45, 'サーバーコマンドを解析しています...')
        server_commands = analyze_server_commands(zf, entries)

    summary = AnalysisSummary(
        table_count=len(tables),
        page_count=len(pages),
        workflow_count=len(workflows),
        server_command_count=len(server_commands),
        total_columns=sum(len(t.columns) for t in tables),
        total_relations=sum(len(t.relations) for t in tables)
    )

    return AnalysisResult(
        project_name=project_name,
        tables=tables,
        pages=pages,
        workflows=workflows,
        server_commands=server_commands,
        summary=summary
    )


def analyze_tables(zf: zipfile.ZipFile, entries: list) -> list:
    """テーブル定義を解析"""
    tables = []
    table_entries = [e for e in entries if e.startswith('Tables/') and e.endswith('.json')]

    for entry in table_entries:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)

            path_parts = entry.split('/')
            folder = path_parts[1] if len(path_parts) > 2 else ''

            columns = []
            for col in data.get('Columns', []):
                columns.append(ColumnInfo(
                    name=col.get('Name', ''),
                    type=extract_column_type(col.get('ColumnType')),
                    required=col.get('Required', False),
                    unique=col.get('Unique', False),
                    default_value=str(col['DefaultValue']) if col.get('DefaultValue') is not None else None,
                    description=col.get('Description')
                ))

            relations = []
            for rel in data.get('Relations', []):
                relations.append(RelationInfo(
                    target_table=rel.get('TargetTableName', ''),
                    source_column=rel.get('SourceColumnName', ''),
                    target_column=rel.get('TargetColumnName', ''),
                    relation_type=rel.get('RelationType', 'OneToMany')
                ))

            table = TableInfo(
                name=data.get('Name', Path(entry).stem),
                folder=folder,
                columns=columns,
                relations=relations
            )

            # ワークフロー解析
            if data.get('BindingRelatedWorkflow'):
                table.workflow = parse_workflow(table.name, data['BindingRelatedWorkflow'])

            tables.append(table)
        except Exception as e:
            print(f"Error parsing table {entry}: {e}")

    return tables


def analyze_pages(zf: zipfile.ZipFile, entries: list) -> list:
    """ページ定義を解析"""
    pages = []

    # 通常ページ
    for entry in [e for e in entries if e.startswith('Pages/') and e.endswith('.json')]:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            elements = extract_page_elements(data)

            pages.append(PageInfo(
                name=data.get('Name', Path(entry).stem),
                page_type='page',
                path=entry,
                **elements
            ))
        except Exception as e:
            print(f"Error parsing page {entry}: {e}")

    # マスターページ
    for entry in [e for e in entries if e.startswith('MasterPages/') and e.endswith('.json')]:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)
            elements = extract_page_elements(data)

            pages.append(PageInfo(
                name=data.get('Name', Path(entry).stem),
                page_type='masterPage',
                path=entry,
                **elements
            ))
        except Exception as e:
            print(f"Error parsing master page {entry}: {e}")

    return pages


def extract_page_elements(data: dict) -> dict:
    """ページ内の要素を抽出"""
    buttons = []
    formulas = []
    cell_commands = []

    attach_infos = data.get('AttachInfos', {})

    for cell_address, cell_data in attach_infos.items():
        cell_type = cell_data.get('CellType', {})

        # 数式抽出
        if cell_data.get('Formula'):
            formulas.append(FormulaInfo(cell=cell_address, formula=str(cell_data['Formula'])))

        if cell_type:
            type_str = cell_type.get('$type', '')

            # メニュー項目
            if 'MenuCellType' in type_str or 'ForguncyMenuCellType' in type_str:
                items = cell_type.get('Items', [])
                extract_menu_items(items, buttons, cell_address)

            # ボタンセルタイプ
            if 'ButtonCellType' in type_str:
                text = cell_type.get('Text') or cell_type.get('Content') or 'ボタン'
                command_list = cell_type.get('CommandList', [])
                if command_list:
                    buttons.append(ButtonInfo(
                        name=text,
                        cell=cell_address,
                        commands=parse_commands(command_list)
                    ))

            # その他のセルコマンド
            command_list = cell_type.get('CommandList', [])
            if command_list and 'ButtonCellType' not in type_str:
                cell_commands.append(CellCommandInfo(
                    cell=cell_address,
                    event='Click',
                    commands=parse_commands(command_list)
                ))

    return {'buttons': buttons, 'formulas': formulas, 'cell_commands': cell_commands}


def extract_menu_items(items: list, buttons: list, base_cell: str):
    """メニュー項目からコマンドを抽出"""
    for item in items:
        if item.get('CommandList'):
            buttons.append(ButtonInfo(
                name=f"メニュー: {item.get('Text', '(名称なし)')}",
                cell=base_cell,
                commands=parse_commands(item['CommandList'])
            ))

        if item.get('SubItems'):
            extract_menu_items(item['SubItems'], buttons, base_cell)


def analyze_server_commands(zf: zipfile.ZipFile, entries: list) -> list:
    """サーバーコマンドを解析"""
    server_commands = []
    cmd_entries = [e for e in entries if e.startswith('ServerCommands/') and e.endswith('.json')]

    for entry in cmd_entries:
        try:
            content = zf.read(entry).decode('utf-8')
            data = extract_json(content)

            path_parts = entry.split('/')
            folder = path_parts[1] if len(path_parts) > 2 else ''

            raw_commands = parse_commands(data.get('Commands', []))
            commands = flatten_commands_to_text(data.get('Commands', []))

            # パラメータ取得
            parameters = []
            triggers = data.get('Triggers', [])
            if triggers:
                trigger_params = triggers[0].get('Parameters', [])
                for p in trigger_params:
                    parameters.append(ParameterInfo(
                        name=p.get('Name', ''),
                        type=infer_parameter_type(p.get('DataValidationInfo')),
                        required=True
                    ))

            # 旧形式
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
            print(f"Error parsing server command {entry}: {e}")

    return server_commands


# =============================================================================
# Word文書生成
# =============================================================================

def generate_spec_document(analysis: AnalysisResult, output_dir: str) -> str:
    """仕様書ドキュメントを生成"""
    os.makedirs(output_dir, exist_ok=True)

    doc = Document()

    # フォント設定
    style = doc.styles['Normal']
    style.font.name = 'Yu Gothic'
    style._element.rPr.rFonts.set(qn('w:eastAsia'), 'Yu Gothic')
    style.font.size = Pt(11)

    # タイトル
    title = doc.add_heading(analysis.project_name, 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subtitle = doc.add_paragraph('システム仕様書')
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER

    date_para = doc.add_paragraph(f'生成日: {datetime.now().strftime("%Y年%m月%d日")}')
    date_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

    gen_para = doc.add_paragraph('Forguncy Insight により自動生成')
    gen_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    gen_para.runs[0].italic = True

    doc.add_page_break()

    # 目次
    doc.add_heading('目次', 1)
    doc.add_paragraph('1. システム概要')
    doc.add_paragraph('2. テーブル定義')
    doc.add_paragraph('3. 画面一覧')
    if analysis.workflows:
        doc.add_paragraph('4. ワークフロー定義')
    if analysis.server_commands:
        doc.add_paragraph('5. サーバーコマンド')
    doc.add_paragraph('6. ER図（Mermaid形式）')

    doc.add_page_break()

    # 1. システム概要
    doc.add_heading('1. システム概要', 1)
    doc.add_heading('1.1 プロジェクト概要', 2)

    summary_table = doc.add_table(rows=7, cols=2)
    summary_table.style = 'Table Grid'
    summary_data = [
        ('プロジェクト名', analysis.project_name),
        ('テーブル数', f'{analysis.summary.table_count}件'),
        ('ページ数', f'{analysis.summary.page_count}件'),
        ('ワークフロー数', f'{analysis.summary.workflow_count}件'),
        ('サーバーコマンド数', f'{analysis.summary.server_command_count}件'),
        ('総カラム数', f'{analysis.summary.total_columns}件'),
        ('リレーション数', f'{analysis.summary.total_relations}件'),
    ]
    for i, (label, value) in enumerate(summary_data):
        summary_table.rows[i].cells[0].text = label
        summary_table.rows[i].cells[1].text = value

    doc.add_page_break()

    # 2. テーブル定義
    doc.add_heading('2. テーブル定義', 1)
    doc.add_heading('2.1 テーブル一覧', 2)

    if analysis.tables:
        table_list = doc.add_table(rows=len(analysis.tables) + 1, cols=5)
        table_list.style = 'Table Grid'
        headers = ['No.', 'テーブル名', 'フォルダ', 'カラム数', 'リレーション']
        for j, h in enumerate(headers):
            table_list.rows[0].cells[j].text = h

        for i, t in enumerate(analysis.tables):
            table_list.rows[i + 1].cells[0].text = str(i + 1)
            table_list.rows[i + 1].cells[1].text = t.name
            table_list.rows[i + 1].cells[2].text = t.folder or '-'
            table_list.rows[i + 1].cells[3].text = str(len(t.columns))
            table_list.rows[i + 1].cells[4].text = str(len(t.relations))

    doc.add_heading('2.2 テーブル詳細', 2)

    for table in analysis.tables:
        doc.add_heading(table.name, 3)

        if table.columns:
            col_table = doc.add_table(rows=len(table.columns) + 1, cols=5)
            col_table.style = 'Table Grid'
            col_headers = ['カラム名', 'データ型', '必須', 'ユニーク', 'デフォルト値']
            for j, h in enumerate(col_headers):
                col_table.rows[0].cells[j].text = h

            for i, c in enumerate(table.columns):
                col_table.rows[i + 1].cells[0].text = c.name
                col_table.rows[i + 1].cells[1].text = c.type
                col_table.rows[i + 1].cells[2].text = '○' if c.required else ''
                col_table.rows[i + 1].cells[3].text = '○' if c.unique else ''
                col_table.rows[i + 1].cells[4].text = c.default_value or ''

        if table.relations:
            doc.add_paragraph('リレーション:', style='Intense Quote')
            rel_table = doc.add_table(rows=len(table.relations) + 1, cols=4)
            rel_table.style = 'Table Grid'
            rel_headers = ['種別', 'ソースカラム', '参照先テーブル', '参照先カラム']
            for j, h in enumerate(rel_headers):
                rel_table.rows[0].cells[j].text = h

            for i, r in enumerate(table.relations):
                rel_table.rows[i + 1].cells[0].text = r.relation_type
                rel_table.rows[i + 1].cells[1].text = r.source_column
                rel_table.rows[i + 1].cells[2].text = r.target_table
                rel_table.rows[i + 1].cells[3].text = r.target_column

    doc.add_page_break()

    # 3. 画面一覧
    doc.add_heading('3. 画面一覧', 1)
    doc.add_heading('3.1 画面一覧', 2)

    if analysis.pages:
        page_table = doc.add_table(rows=len(analysis.pages) + 1, cols=5)
        page_table.style = 'Table Grid'
        page_headers = ['No.', '画面名', '種別', 'ボタン数', '数式数']
        for j, h in enumerate(page_headers):
            page_table.rows[0].cells[j].text = h

        for i, p in enumerate(analysis.pages):
            page_table.rows[i + 1].cells[0].text = str(i + 1)
            page_table.rows[i + 1].cells[1].text = p.name
            page_table.rows[i + 1].cells[2].text = 'マスターページ' if p.page_type == 'masterPage' else 'ページ'
            page_table.rows[i + 1].cells[3].text = str(len(p.buttons))
            page_table.rows[i + 1].cells[4].text = str(len(p.formulas))

    # 画面詳細（ボタンがあるページのみ）
    pages_with_buttons = [p for p in analysis.pages if p.buttons or p.formulas]

    if pages_with_buttons:
        doc.add_heading('3.2 画面詳細', 2)

        for page in pages_with_buttons:
            doc.add_heading(page.name, 3)

            if page.buttons:
                doc.add_paragraph('ボタン:', style='Intense Quote')
                for button in page.buttons:
                    para = doc.add_paragraph(style='List Bullet')
                    para.add_run(button.name)
                    para.add_run(f' ({len(button.commands)}個のコマンド)').italic = True

                    for cmd in button.commands:
                        cmd_para = doc.add_paragraph(f'  • {cmd.description}')
                        cmd_para.paragraph_format.left_indent = Inches(0.5)

            if page.formulas:
                doc.add_paragraph('数式:', style='Intense Quote')
                formula_table = doc.add_table(rows=min(len(page.formulas), 20) + 1, cols=2)
                formula_table.style = 'Table Grid'
                formula_table.rows[0].cells[0].text = 'セル'
                formula_table.rows[0].cells[1].text = '数式'

                for i, f in enumerate(page.formulas[:20]):
                    formula_table.rows[i + 1].cells[0].text = f.cell
                    formula_table.rows[i + 1].cells[1].text = f.formula

                if len(page.formulas) > 20:
                    doc.add_paragraph(f'※ 他{len(page.formulas) - 20}件の数式があります').italic = True

    # 4. ワークフロー定義
    if analysis.workflows:
        doc.add_page_break()
        doc.add_heading('4. ワークフロー定義', 1)

        for wf in analysis.workflows:
            doc.add_heading(f'ワークフロー: {wf.table_name}', 2)

            # 状態一覧
            doc.add_heading('状態一覧', 3)
            state_table = doc.add_table(rows=len(wf.states) + 1, cols=3)
            state_table.style = 'Table Grid'
            state_table.rows[0].cells[0].text = '状態名'
            state_table.rows[0].cells[1].text = '初期状態'
            state_table.rows[0].cells[2].text = '終了状態'

            for i, s in enumerate(wf.states):
                state_table.rows[i + 1].cells[0].text = s.name
                state_table.rows[i + 1].cells[1].text = '○' if s.is_initial else ''
                state_table.rows[i + 1].cells[2].text = '○' if s.is_final else ''

            # 遷移一覧
            doc.add_heading('遷移一覧', 3)
            trans_table = doc.add_table(rows=len(wf.transitions) + 1, cols=4)
            trans_table.style = 'Table Grid'
            trans_table.rows[0].cells[0].text = 'アクション'
            trans_table.rows[0].cells[1].text = '遷移元'
            trans_table.rows[0].cells[2].text = '遷移先'
            trans_table.rows[0].cells[3].text = '担当者'

            for i, t in enumerate(wf.transitions):
                trans_table.rows[i + 1].cells[0].text = t.action
                trans_table.rows[i + 1].cells[1].text = t.from_state
                trans_table.rows[i + 1].cells[2].text = t.to_state
                assignees_str = ', '.join([f'{a.type}: {a.value}' for a in t.assignees]) or '未設定'
                trans_table.rows[i + 1].cells[3].text = assignees_str

            # Mermaidフロー図
            doc.add_heading('フロー図（Mermaid形式）', 3)
            mermaid = generate_workflow_mermaid(wf)
            mermaid_para = doc.add_paragraph(mermaid)
            mermaid_para.style = 'Quote'

    # 5. サーバーコマンド
    if analysis.server_commands:
        doc.add_page_break()
        doc.add_heading('5. サーバーコマンド（ビジネスロジック）', 1)

        doc.add_heading('5.1 サーバーコマンド一覧', 2)
        cmd_list_table = doc.add_table(rows=len(analysis.server_commands) + 1, cols=5)
        cmd_list_table.style = 'Table Grid'
        cmd_headers = ['No.', 'コマンド名', 'フォルダ', 'パラメータ数', '行数']
        for j, h in enumerate(cmd_headers):
            cmd_list_table.rows[0].cells[j].text = h

        for i, c in enumerate(analysis.server_commands):
            cmd_list_table.rows[i + 1].cells[0].text = str(i + 1)
            cmd_list_table.rows[i + 1].cells[1].text = c.name
            cmd_list_table.rows[i + 1].cells[2].text = c.folder or '-'
            cmd_list_table.rows[i + 1].cells[3].text = str(len(c.parameters))
            cmd_list_table.rows[i + 1].cells[4].text = str(len(c.commands))

        doc.add_heading('5.2 サーバーコマンド詳細', 2)

        for cmd in analysis.server_commands:
            doc.add_heading(cmd.name, 3)

            if cmd.parameters:
                doc.add_paragraph('パラメータ:', style='Intense Quote')
                param_table = doc.add_table(rows=len(cmd.parameters) + 1, cols=4)
                param_table.style = 'Table Grid'
                param_table.rows[0].cells[0].text = 'パラメータ名'
                param_table.rows[0].cells[1].text = 'データ型'
                param_table.rows[0].cells[2].text = '必須'
                param_table.rows[0].cells[3].text = 'デフォルト値'

                for i, p in enumerate(cmd.parameters):
                    param_table.rows[i + 1].cells[0].text = p.name
                    param_table.rows[i + 1].cells[1].text = p.type
                    param_table.rows[i + 1].cells[2].text = '○' if p.required else ''
                    param_table.rows[i + 1].cells[3].text = p.default_value or ''

            doc.add_paragraph('処理内容:', style='Intense Quote')
            display_lines = cmd.commands[:50]
            code_para = doc.add_paragraph('\n'.join(display_lines))
            code_para.style = 'Quote'

            if len(cmd.commands) > 50:
                doc.add_paragraph(f'※ 他{len(cmd.commands) - 50}行の処理があります').italic = True

    # 6. ER図
    doc.add_page_break()
    doc.add_heading('6. ER図（Mermaid形式）', 1)
    doc.add_paragraph('以下のMermaid記法をMermaid Live Editor等で表示できます。').italic = True

    er_mermaid = generate_er_diagram(analysis.tables)
    er_para = doc.add_paragraph(er_mermaid)
    er_para.style = 'Quote'

    # 保存
    file_path = os.path.join(output_dir, f'{analysis.project_name}_仕様書.docx')
    doc.save(file_path)

    return file_path


def sanitize_mermaid_id(id_str: str) -> str:
    """Mermaid用にIDをサニタイズ"""
    return re.sub(r'[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', '_', id_str)


def generate_workflow_mermaid(wf: WorkflowInfo) -> str:
    """ワークフローのMermaid図を生成"""
    lines = ['stateDiagram-v2']

    for state in wf.states:
        if state.is_initial:
            lines.append(f'  [*] --> {sanitize_mermaid_id(state.name)}')
        if state.is_final:
            lines.append(f'  {sanitize_mermaid_id(state.name)} --> [*]')

    for trans in wf.transitions:
        from_state = sanitize_mermaid_id(trans.from_state)
        to_state = sanitize_mermaid_id(trans.to_state)
        lines.append(f'  {from_state} --> {to_state}: {trans.action}')

    return '\n'.join(lines)


def generate_er_diagram(tables: list) -> str:
    """ER図のMermaid記法を生成"""
    lines = ['erDiagram']

    for table in tables:
        lines.append(f'  {sanitize_mermaid_id(table.name)} {{')
        for col in table.columns[:10]:
            col_type = re.sub(r'[^a-z]', '', col.type.lower())
            pk = 'PK' if col.name.lower() == 'id' else ''
            req = 'NOT_NULL' if col.required else ''
            line = f'    {col_type} {sanitize_mermaid_id(col.name)} {pk} {req}'.strip()
            lines.append(line)
        if len(table.columns) > 10:
            lines.append('    string _more_columns "..."')
        lines.append('  }')

    for table in tables:
        for rel in table.relations:
            from_table = sanitize_mermaid_id(table.name)
            to_table = sanitize_mermaid_id(rel.target_table)
            rel_type = '}o--||' if 'Many' in rel.relation_type else '||--||'
            lines.append(f'  {from_table} {rel_type} {to_table} : "{rel.source_column}"')

    return '\n'.join(lines)


# =============================================================================
# GUI
# =============================================================================

class ForguncyInsightApp:
    def __init__(self, root: Tk):
        self.root = root
        self.root.title("Forguncy Insight")
        self.root.geometry("600x400")
        self.root.resizable(True, True)

        # 変数
        self.file_path = StringVar()
        self.output_dir = StringVar(value=str(Path.home() / "Documents"))

        self.setup_ui()

    def setup_ui(self):
        # メインフレーム
        main_frame = Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill='both', expand=True)

        # タイトル
        title_label = Label(main_frame, text="Forguncy Insight", font=('Helvetica', 18, 'bold'))
        title_label.pack(pady=(0, 5))

        subtitle_label = Label(main_frame, text="Forguncyプロジェクト解析・仕様書自動生成", font=('Helvetica', 10))
        subtitle_label.pack(pady=(0, 20))

        # ファイル選択
        file_frame = Frame(main_frame)
        file_frame.pack(fill='x', pady=10)

        Label(file_frame, text="プロジェクトファイル (.fgcp):").pack(anchor='w')

        file_input_frame = Frame(file_frame)
        file_input_frame.pack(fill='x', pady=5)

        file_entry = Entry(file_input_frame, textvariable=self.file_path, state='readonly')
        file_entry.pack(side='left', fill='x', expand=True)

        browse_btn = Button(file_input_frame, text="参照...", command=self.browse_file)
        browse_btn.pack(side='right', padx=(10, 0))

        # 出力フォルダ
        output_frame = Frame(main_frame)
        output_frame.pack(fill='x', pady=10)

        Label(output_frame, text="出力フォルダ:").pack(anchor='w')

        output_input_frame = Frame(output_frame)
        output_input_frame.pack(fill='x', pady=5)

        output_entry = Entry(output_input_frame, textvariable=self.output_dir)
        output_entry.pack(side='left', fill='x', expand=True)

        output_btn = Button(output_input_frame, text="変更...", command=self.browse_output)
        output_btn.pack(side='right', padx=(10, 0))

        # プログレスバー
        self.progress = ttk.Progressbar(main_frame, mode='determinate')
        self.progress.pack(fill='x', pady=20)

        self.status_label = Label(main_frame, text="")
        self.status_label.pack()

        # 解析ボタン
        self.analyze_btn = Button(main_frame, text="解析開始", command=self.start_analysis,
                                   font=('Helvetica', 12), bg='#2563EB', fg='white',
                                   padx=30, pady=10)
        self.analyze_btn.pack(pady=20)

        # バージョン
        version_label = Label(main_frame, text="Forguncy Insight v1.0.0 - Python Edition",
                              font=('Helvetica', 8), fg='gray')
        version_label.pack(side='bottom')

    def browse_file(self):
        file_path = filedialog.askopenfilename(
            title="Forguncyプロジェクトを選択",
            filetypes=[("Forguncy Project", "*.fgcp"), ("All files", "*.*")]
        )
        if file_path:
            self.file_path.set(file_path)

    def browse_output(self):
        dir_path = filedialog.askdirectory(
            title="出力フォルダを選択",
            initialdir=self.output_dir.get()
        )
        if dir_path:
            self.output_dir.set(dir_path)

    def update_progress(self, pct: int, msg: str):
        self.progress['value'] = pct
        self.status_label.config(text=msg)
        self.root.update_idletasks()

    def start_analysis(self):
        if not self.file_path.get():
            messagebox.showerror("エラー", "プロジェクトファイルを選択してください")
            return

        if not os.path.exists(self.file_path.get()):
            messagebox.showerror("エラー", "ファイルが見つかりません")
            return

        self.analyze_btn.config(state='disabled')
        self.progress['value'] = 0

        try:
            # 解析
            self.update_progress(10, "解析を開始しています...")
            analysis = analyze_project(self.file_path.get(), self.update_progress)

            # 仕様書生成
            self.update_progress(70, "仕様書を生成しています...")
            output_path = generate_spec_document(analysis, self.output_dir.get())

            self.update_progress(100, "完了しました!")

            messagebox.showinfo(
                "完了",
                f"仕様書を生成しました:\n{output_path}\n\n"
                f"テーブル: {analysis.summary.table_count}件\n"
                f"ページ: {analysis.summary.page_count}件\n"
                f"ワークフロー: {analysis.summary.workflow_count}件\n"
                f"サーバーコマンド: {analysis.summary.server_command_count}件"
            )

            # 出力フォルダを開く
            if os.name == 'nt':
                os.startfile(self.output_dir.get())
            elif os.name == 'posix':
                import subprocess
                subprocess.run(['open', self.output_dir.get()])

        except Exception as e:
            messagebox.showerror("エラー", f"解析中にエラーが発生しました:\n{str(e)}")
            self.update_progress(0, "")

        finally:
            self.analyze_btn.config(state='normal')


def main():
    root = Tk()
    app = ForguncyInsightApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()
