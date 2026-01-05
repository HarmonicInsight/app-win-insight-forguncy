#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excelエクスポートモジュール

解析結果をExcel形式で出力する。
"""

import os
import re
from datetime import datetime

from core.models import AnalysisResult


# =============================================================================
# バージョン情報
# =============================================================================
APP_VERSION = "1.1.0"
SUPPORTED_FORGUNCY_VERSIONS = ["9.x"]
VERSION_INFO = f"v{APP_VERSION} (Forguncy {', '.join(SUPPORTED_FORGUNCY_VERSIONS)} 対応)"


# =============================================================================
# openpyxl可用性チェック
# =============================================================================
try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, Border, Side, PatternFill
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False


# =============================================================================
# ER図Mermaid生成
# =============================================================================
def generate_er_mermaid(tables: list) -> str:
    """ER図のMermaid記法を生成"""
    def sanitize(s):
        return re.sub(r'[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]', '_', s)

    lines = ['erDiagram']
    for table in tables:
        lines.append(f'  {sanitize(table.name)} {{')
        for col in table.columns[:10]:
            col_type = re.sub(r'[^a-z]', '', col.type.lower()) or 'string'
            pk = 'PK' if col.name.lower() == 'id' else ''
            lines.append(f'    {col_type} {sanitize(col.name)} {pk}'.strip())
        if len(table.columns) > 10:
            lines.append('    string more_columns "..."')
        lines.append('  }')

    for table in tables:
        for rel in table.relations:
            from_t = sanitize(table.name)
            to_t = sanitize(rel.target_table)
            rel_type = '}o--||' if 'Many' in rel.relation_type else '||--||'
            lines.append(f'  {from_t} {rel_type} {to_t} : "{rel.source_column}"')

    return '\n'.join(lines)


# =============================================================================
# Excel出力
# =============================================================================
def generate_excel_document(analysis: AnalysisResult, output_dir: str) -> str:
    """Excel形式で出力"""
    if not EXCEL_AVAILABLE:
        raise ImportError("openpyxlがインストールされていません。pip install openpyxl を実行してください。")

    os.makedirs(output_dir, exist_ok=True)
    wb = Workbook()

    # ヘッダースタイル
    header_fill = PatternFill(start_color='4472C4', end_color='4472C4', fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF')
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    # サマリーシート
    ws_summary = wb.active
    ws_summary.title = 'サマリー'
    summary_data = [
        ['項目', '値'],
        ['プロジェクト名', analysis.project_name],
        ['テーブル数', analysis.summary.table_count],
        ['ページ数', analysis.summary.page_count],
        ['ワークフロー数', analysis.summary.workflow_count],
        ['サーバーコマンド数', analysis.summary.server_command_count],
        ['総カラム数', analysis.summary.total_columns],
        ['リレーション数', analysis.summary.total_relations],
        ['生成日', datetime.now().strftime('%Y-%m-%d %H:%M')],
        ['生成ツール', f'Forguncy Insight {VERSION_INFO}'],
    ]
    for row_idx, row in enumerate(summary_data, 1):
        for col_idx, value in enumerate(row, 1):
            cell = ws_summary.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            if row_idx == 1:
                cell.fill = header_fill
                cell.font = header_font

    ws_summary.column_dimensions['A'].width = 20
    ws_summary.column_dimensions['B'].width = 40

    # テーブル一覧シート
    ws_tables = wb.create_sheet('テーブル一覧')
    table_headers = ['No.', 'テーブル名', 'フォルダ', 'カラム数', 'リレーション数']
    for col_idx, header in enumerate(table_headers, 1):
        cell = ws_tables.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = thin_border

    for row_idx, t in enumerate(analysis.tables, 2):
        values = [row_idx - 1, t.name, t.folder or '-', len(t.columns), len(t.relations)]
        for col_idx, value in enumerate(values, 1):
            cell = ws_tables.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border

    # カラム定義シート
    ws_columns = wb.create_sheet('カラム定義')
    col_headers = ['テーブル名', 'カラム名', 'データ型', '必須', 'ユニーク', 'デフォルト値']
    for col_idx, header in enumerate(col_headers, 1):
        cell = ws_columns.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = thin_border

    row_idx = 2
    for t in analysis.tables:
        for c in t.columns:
            values = [t.name, c.name, c.type, '○' if c.required else '', '○' if c.unique else '', c.default_value or '']
            for col_idx, value in enumerate(values, 1):
                cell = ws_columns.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin_border
            row_idx += 1

    # ページ一覧シート
    ws_pages = wb.create_sheet('ページ一覧')
    page_headers = ['No.', 'ページ名', '種別', 'ボタン数', '数式数']
    for col_idx, header in enumerate(page_headers, 1):
        cell = ws_pages.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = thin_border

    for row_idx, p in enumerate(analysis.pages, 2):
        values = [row_idx - 1, p.name, 'マスターページ' if p.page_type == 'masterPage' else 'ページ', len(p.buttons), len(p.formulas)]
        for col_idx, value in enumerate(values, 1):
            cell = ws_pages.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border

    # サーバーコマンドシート
    ws_cmds = wb.create_sheet('サーバーコマンド')
    cmd_headers = ['No.', 'コマンド名', 'フォルダ', 'パラメータ数', '処理行数']
    for col_idx, header in enumerate(cmd_headers, 1):
        cell = ws_cmds.cell(row=1, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = thin_border

    for row_idx, c in enumerate(analysis.server_commands, 2):
        values = [row_idx - 1, c.name, c.folder or '-', len(c.parameters), len(c.commands)]
        for col_idx, value in enumerate(values, 1):
            cell = ws_cmds.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border

    # ER図シート (テキスト形式)
    ws_er = wb.create_sheet('ER図(Mermaid)')
    ws_er.cell(row=1, column=1, value='以下をMermaid Live Editorに貼り付けてください')
    er_code = generate_er_mermaid(analysis.tables)
    ws_er.cell(row=3, column=1, value=er_code)

    file_path = os.path.join(output_dir, f'{analysis.project_name}_仕様書.xlsx')
    wb.save(file_path)
    return file_path
