#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forguncy Insight - メインエントリポイント

使用方法:
    python main.py

モジュール構造:
    core/           - 解析ロジック、モデル定義
    core/exporters/ - Word/Excel出力
    ui/             - GUIアプリケーション
    licensing/      - ライセンス管理
"""

import sys
import os

# モジュールパスの追加（EXE化時のため）
if getattr(sys, 'frozen', False):
    # PyInstallerでEXE化された場合
    application_path = os.path.dirname(sys.executable)
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, application_path)

# メインアプリケーションのインポートと起動
from ui.app_tk import main

if __name__ == '__main__':
    main()
