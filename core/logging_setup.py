#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ログ設定モジュール

ファイルログとコンソールログを設定する。
Windows: %APPDATA%/ForguncyInsight/logs/app.log
macOS/Linux: ~/.forguncyinsight/logs/app.log
"""

import logging
import os
from pathlib import Path


def get_log_dir() -> Path:
    """ログディレクトリを取得（Windows: %APPDATA%/ForguncyInsight/logs）"""
    if os.name == 'nt':
        appdata = os.environ.get('APPDATA')
        if appdata:
            log_dir = Path(appdata) / 'ForguncyInsight' / 'logs'
        else:
            log_dir = Path.home() / '.forguncyinsight' / 'logs'
    else:
        log_dir = Path.home() / '.forguncyinsight' / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def setup_logging() -> logging.Logger:
    """ロギングを設定"""
    logger = logging.getLogger('ForguncyInsight')
    logger.setLevel(logging.DEBUG)

    # 既存のハンドラをクリア
    logger.handlers.clear()

    # ファイルハンドラ
    log_file = get_log_dir() / 'app.log'
    file_handler = logging.FileHandler(log_file, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # コンソールハンドラ（開発用）
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter('[%(levelname)s] %(message)s')
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger


# グローバルロガー
logger = setup_logging()
