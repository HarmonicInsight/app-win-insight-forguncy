#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
データモデル定義モジュール

FGCPプロジェクト解析で使用するデータクラスを定義する。
"""

from dataclasses import dataclass, field
from typing import Any, Optional


# =============================================================================
# 非同期処理用イベント
# =============================================================================
@dataclass
class AnalysisEvent:
    """解析イベント（UIスレッドへの通知用）"""
    event_type: str  # 'progress', 'log', 'complete', 'error'
    data: Any = None


# =============================================================================
# テーブル関連
# =============================================================================
@dataclass
class ColumnInfo:
    """テーブルカラム情報"""
    name: str
    type: str
    required: bool = False
    unique: bool = False
    default_value: Optional[str] = None
    description: Optional[str] = None


@dataclass
class RelationInfo:
    """テーブルリレーション情報"""
    target_table: str
    source_column: str
    target_column: str
    relation_type: str = "OneToMany"


# =============================================================================
# コマンド・ワークフロー関連
# =============================================================================
@dataclass
class CommandInfo:
    """コマンド情報"""
    type: str
    description: str
    details: dict = field(default_factory=dict)
    sub_commands: list = field(default_factory=list)


@dataclass
class StateInfo:
    """ワークフロー状態情報"""
    name: str
    is_initial: bool = False
    is_final: bool = False


@dataclass
class AssigneeInfo:
    """ワークフロー担当者情報"""
    type: str
    value: str


@dataclass
class ConditionInfo:
    """ワークフロー条件情報"""
    type: str
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[str] = None
    expression: Optional[str] = None


@dataclass
class TransitionInfo:
    """ワークフロー遷移情報"""
    from_state: str
    to_state: str
    action: str
    conditions: list = field(default_factory=list)
    assignees: list = field(default_factory=list)
    commands: list = field(default_factory=list)


@dataclass
class WorkflowInfo:
    """ワークフロー情報"""
    table_name: str
    states: list = field(default_factory=list)
    transitions: list = field(default_factory=list)


@dataclass
class TableInfo:
    """テーブル情報"""
    name: str
    folder: str = ""
    columns: list = field(default_factory=list)
    relations: list = field(default_factory=list)
    workflow: Optional[WorkflowInfo] = None
    primary_key: list = field(default_factory=list)


# =============================================================================
# ページ関連
# =============================================================================
@dataclass
class FormulaInfo:
    """セル数式情報"""
    cell: str
    formula: str


@dataclass
class ButtonInfo:
    """ボタン情報"""
    name: str
    cell: str = ""
    commands: list = field(default_factory=list)


@dataclass
class CellCommandInfo:
    """セルコマンド情報"""
    cell: str
    event: str
    commands: list = field(default_factory=list)


@dataclass
class PageInfo:
    """ページ情報"""
    name: str
    page_type: str
    path: str
    folder: str = ""
    buttons: list = field(default_factory=list)
    formulas: list = field(default_factory=list)
    cell_commands: list = field(default_factory=list)


# =============================================================================
# サーバーコマンド関連
# =============================================================================
@dataclass
class ParameterInfo:
    """パラメータ情報"""
    name: str
    type: str
    required: bool = False
    default_value: Optional[str] = None


@dataclass
class ServerCommandInfo:
    """サーバーコマンド情報"""
    name: str
    folder: str = ""
    path: str = ""
    commands: list = field(default_factory=list)
    raw_commands: list = field(default_factory=list)
    parameters: list = field(default_factory=list)


# =============================================================================
# 解析結果
# =============================================================================
@dataclass
class AnalysisSummary:
    """解析サマリー"""
    table_count: int = 0
    page_count: int = 0
    workflow_count: int = 0
    server_command_count: int = 0
    total_columns: int = 0
    total_relations: int = 0


@dataclass
class AnalysisResult:
    """解析結果"""
    project_name: str
    tables: list = field(default_factory=list)
    pages: list = field(default_factory=list)
    workflows: list = field(default_factory=list)
    server_commands: list = field(default_factory=list)
    summary: AnalysisSummary = field(default_factory=AnalysisSummary)


# =============================================================================
# 差分比較
# =============================================================================
@dataclass
class DiffResult:
    """差分比較結果"""
    added_tables: list = field(default_factory=list)
    removed_tables: list = field(default_factory=list)
    modified_tables: list = field(default_factory=list)
    added_pages: list = field(default_factory=list)
    removed_pages: list = field(default_factory=list)
    modified_pages: list = field(default_factory=list)
    added_server_commands: list = field(default_factory=list)
    removed_server_commands: list = field(default_factory=list)
    modified_server_commands: list = field(default_factory=list)
