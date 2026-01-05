#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forguncy Insight - Core モジュール

解析ロジック・モデル定義を提供する。
"""

from core.logging_setup import logger, get_log_dir, setup_logging
from core.safety_checks import ZipSafetyError, check_zip_safety, ZIP_SAFETY_LIMITS
from core.models import (
    AnalysisEvent, AnalysisResult, AnalysisSummary,
    ColumnInfo, RelationInfo, TableInfo, WorkflowInfo,
    PageInfo, ButtonInfo, FormulaInfo, CellCommandInfo,
    ServerCommandInfo, ParameterInfo, CommandInfo,
    StateInfo, TransitionInfo, AssigneeInfo, ConditionInfo,
    DiffResult
)

__all__ = [
    'logger', 'get_log_dir', 'setup_logging',
    'ZipSafetyError', 'check_zip_safety', 'ZIP_SAFETY_LIMITS',
    'AnalysisEvent', 'AnalysisResult', 'AnalysisSummary',
    'ColumnInfo', 'RelationInfo', 'TableInfo', 'WorkflowInfo',
    'PageInfo', 'ButtonInfo', 'FormulaInfo', 'CellCommandInfo',
    'ServerCommandInfo', 'ParameterInfo', 'CommandInfo',
    'StateInfo', 'TransitionInfo', 'AssigneeInfo', 'ConditionInfo',
    'DiffResult',
]
