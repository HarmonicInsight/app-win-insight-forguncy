#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ZIP安全ガードモジュール

FGCPファイル（ZIP形式）の安全性をチェックし、
破損ファイルやzip爆弾からアプリケーションを保護する。
"""

import os
import zipfile
import zlib
from typing import Callable, Optional

from core.logging_setup import logger


# ZIP安全ガード設定
ZIP_SAFETY_LIMITS = {
    'max_file_size_mb': 200,        # 入力ファイルサイズ上限（MB）
    'max_entries': 50000,           # ZIP内エントリ数上限
    'max_uncompressed_size_gb': 1,  # 解凍後総サイズ上限（GB）
}


class ZipSafetyError(Exception):
    """ZIP安全チェックエラー"""
    pass


def check_zip_safety(file_path: str, confirm_callback: Optional[Callable[[str], bool]] = None) -> dict:
    """
    ZIPファイルの安全性をチェック

    Args:
        file_path: チェックするファイルパス
        confirm_callback: サイズ警告時の確認コールバック（Trueで続行）

    Returns:
        dict: チェック結果（entries, total_size, file_size）

    Raises:
        ZipSafetyError: 安全チェック失敗時
    """
    logger.info(f"ZIP安全チェック開始: {file_path}")

    # ファイルサイズチェック
    file_size = os.path.getsize(file_path)
    file_size_mb = file_size / (1024 * 1024)
    max_size_mb = ZIP_SAFETY_LIMITS['max_file_size_mb']

    if file_size_mb > max_size_mb:
        msg = f"ファイルサイズが大きすぎます: {file_size_mb:.1f}MB (上限: {max_size_mb}MB)"
        if confirm_callback:
            if not confirm_callback(f"{msg}\n\n処理を続行しますか？"):
                raise ZipSafetyError("ユーザーによりキャンセルされました")
        else:
            raise ZipSafetyError(msg)

    try:
        with zipfile.ZipFile(file_path, 'r') as zf:
            entries = zf.namelist()
            entry_count = len(entries)

            # エントリ数チェック
            max_entries = ZIP_SAFETY_LIMITS['max_entries']
            if entry_count > max_entries:
                raise ZipSafetyError(
                    f"ZIPエントリ数が多すぎます: {entry_count:,} (上限: {max_entries:,})"
                )

            # 解凍後サイズチェック
            total_uncompressed = sum(info.file_size for info in zf.infolist())
            max_uncompressed = ZIP_SAFETY_LIMITS['max_uncompressed_size_gb'] * 1024 * 1024 * 1024

            if total_uncompressed > max_uncompressed:
                raise ZipSafetyError(
                    f"解凍後サイズが大きすぎます: {total_uncompressed / (1024**3):.1f}GB "
                    f"(上限: {ZIP_SAFETY_LIMITS['max_uncompressed_size_gb']}GB)"
                )

            logger.info(
                f"ZIP安全チェック完了: エントリ={entry_count:,}, "
                f"圧縮前={file_size_mb:.1f}MB, 解凍後={total_uncompressed / (1024**2):.1f}MB"
            )

            return {
                'entries': entry_count,
                'total_size': total_uncompressed,
                'file_size': file_size,
            }

    except zipfile.BadZipFile as e:
        logger.error(f"不正なZIPファイル: {e}")
        raise ZipSafetyError(f"ファイルが破損しているか、正しいFGCPファイルではありません: {e}")
    except zlib.error as e:
        logger.error(f"ZIP解凍エラー: {e}")
        raise ZipSafetyError(f"ファイルの読み取りに失敗しました（圧縮データ破損）: {e}")
