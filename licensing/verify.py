#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ライセンス検証モジュール

ライセンスキーの検証とライセンス管理を行う。
形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2
"""

import base64
import hashlib
import hmac
import json
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional

from core.logging_setup import logger


# =============================================================================
# ライセンス定数
# =============================================================================
LICENSE_KEY_PATTERN = re.compile(
    r'^(INSS|INSP|INPY|FGIN)-(TRIAL|STD|PRO)-(\d{4})-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$'
)

PRODUCT_CODE = 'FGIN'
PRODUCT_NAME = 'Forguncy Insight'
PRICE_STANDARD = '¥49,800/年'

PURCHASE_URL = 'https://because-zero.com/forguncy-insight/purchase'
TRIAL_URL = 'https://because-zero.com/forguncy-insight/trial'

EXPIRY_WARNING_DAYS = 30
TRIAL_DAYS = 14

# 署名用シークレットキー
# セキュリティ: デフォルト値なし。環境変数が設定されていない場合はライセンス検証不可
_SECRET_KEY_RAW = os.environ.get("INSIGHT_LICENSE_SECRET")
_SECRET_KEY = _SECRET_KEY_RAW.encode() if _SECRET_KEY_RAW else None

# 秘密鍵がない場合のライセンス検証モード
_LICENSE_DEV_MODE = os.environ.get("INSIGHT_LICENSE_DEV_MODE", "").lower() == "true"

# 機能制限
FEATURE_LIMITS = {
    'FREE': {
        'max_tables': 5,
        'max_pages': 10,
        'max_server_commands': 3,
        'max_workflows': 1,
        'word_export': False,
        'excel_export': False,
        'diff_compare': False,
        'commercial_use': False,
    },
    'STD': {
        'max_tables': float('inf'),
        'max_pages': float('inf'),
        'max_server_commands': float('inf'),
        'max_workflows': float('inf'),
        'word_export': True,
        'excel_export': True,
        'diff_compare': True,
        'commercial_use': True,
    },
}

TIER_NAMES = {
    'TRIAL': 'トライアル',
    'STD': 'Standard',
    'PRO': 'Pro',
}


# =============================================================================
# 署名関数
# =============================================================================
def _generate_email_hash(email: str) -> str:
    """メールアドレスから4文字のハッシュを生成"""
    h = hashlib.sha256(email.lower().strip().encode()).digest()
    return base64.b32encode(h)[:4].decode().upper()


def _generate_signature(data: str) -> Optional[str]:
    """署名を生成（8文字）。秘密鍵がない場合はNone"""
    if _SECRET_KEY is None:
        return None
    sig = hmac.new(_SECRET_KEY, data.encode(), hashlib.sha256).digest()
    encoded = base64.b32encode(sig)[:8].decode().upper()
    return encoded


def _verify_signature(data: str, signature: str) -> bool:
    """署名を検証。秘密鍵がない場合は常にFalse（開発モード除く）"""
    if _SECRET_KEY is None:
        if _LICENSE_DEV_MODE:
            logger.warning("開発モード: ライセンス署名検証をスキップ")
            return True
        logger.warning("秘密鍵が設定されていないため、ライセンス検証不可")
        return False
    expected = _generate_signature(data)
    if expected is None:
        return False
    return hmac.compare_digest(expected, signature)


# =============================================================================
# ライセンス検証
# =============================================================================
def validate_license_key(license_key: str, email: str) -> Dict:
    """
    ライセンスキーを検証（新形式）
    形式: PPPP-PLAN-YYMM-HASH-SIG1-SIG2
    """
    if not license_key:
        return {'is_valid': False, 'error': 'ライセンスキーが必要です', 'tier': None}

    if not email:
        return {'is_valid': False, 'error': 'メールアドレスが必要です', 'tier': None}

    normalized = license_key.strip().upper()
    email = email.strip().lower()
    match = LICENSE_KEY_PATTERN.match(normalized)

    if not match:
        return {'is_valid': False, 'error': '無効なライセンスキー形式です', 'tier': None}

    product_code, tier, yymm, email_hash, sig1, sig2 = match.groups()
    signature = sig1 + sig2

    # 署名検証
    sign_data = f"{product_code}-{tier}-{yymm}-{email_hash}"
    if not _verify_signature(sign_data, signature):
        return {'is_valid': False, 'error': 'ライセンスキーが無効です', 'tier': None}

    # メールハッシュ照合
    expected_hash = _generate_email_hash(email)
    if email_hash != expected_hash:
        return {'is_valid': False, 'error': 'メールアドレスが一致しません', 'tier': None}

    # 有効期限チェック
    try:
        year = 2000 + int(yymm[:2])
        month = int(yymm[2:])
        if month == 12:
            expires_at = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            expires_at = datetime(year, month + 1, 1) - timedelta(days=1)
        expires_at = expires_at.replace(hour=23, minute=59, second=59)
    except ValueError:
        return {'is_valid': False, 'error': '無効な有効期限です', 'tier': None}

    if datetime.now() > expires_at:
        return {
            'is_valid': False,
            'error': 'ライセンスの有効期限が切れています',
            'tier': tier,
            'expires_at': expires_at
        }

    # 製品コードチェック
    if product_code != PRODUCT_CODE:
        return {'is_valid': False, 'error': f'このライセンスは {product_code} 用です', 'tier': None}

    return {
        'is_valid': True,
        'tier': tier,
        'product': product_code,
        'expires_at': expires_at,
        'error': None
    }


def get_feature_limits(tier: Optional[str]) -> Dict:
    """ティアに応じた機能制限を取得"""
    if tier in ['TRIAL', 'STD', 'PRO']:
        return FEATURE_LIMITS['STD']
    return FEATURE_LIMITS['FREE']


# =============================================================================
# ライセンスマネージャー
# =============================================================================
class LicenseManager:
    """ライセンス管理クラス（新形式対応）"""

    def __init__(self):
        self._config_dir = self._get_config_dir()
        self._config_file = self._config_dir / 'license.dat'
        self.license_key = None
        self.email = None
        self.expires_at = None
        self.activated_at = None
        self.tier = None
        self.limits = get_feature_limits(None)
        self.load()

    def _get_config_dir(self) -> Path:
        """設定ディレクトリを取得"""
        if os.name == 'nt':
            base = Path(os.environ.get('APPDATA', Path.home()))
        else:
            base = Path.home() / '.config'
        return base / 'HarmonicInsight' / 'ForguncyInsight'

    def load(self):
        """保存されたライセンス情報を読み込み"""
        if not self._config_file.exists():
            return

        try:
            with open(self._config_file, 'r', encoding='utf-8') as f:
                encoded = f.read()
            content = base64.b64decode(encoded).decode()
            data = json.loads(content)

            self.license_key = data.get('key')
            self.email = data.get('email')
            self.tier = data.get('plan')
            expires_str = data.get('expires')
            if expires_str:
                self.expires_at = datetime.strptime(expires_str, '%Y-%m-%d')
                self.expires_at = self.expires_at.replace(hour=23, minute=59, second=59)

            # 期限チェック
            if self.expires_at and datetime.now() > self.expires_at:
                self.tier = None
                self.limits = get_feature_limits(None)
            else:
                self.limits = get_feature_limits(self.tier)
        except Exception:
            pass

    def save(self):
        """ライセンス情報を保存"""
        self._config_dir.mkdir(parents=True, exist_ok=True)

        data = {
            'key': self.license_key,
            'email': self.email,
            'plan': self.tier,
            'productCode': PRODUCT_CODE,
            'product': PRODUCT_NAME,
            'expires': self.expires_at.strftime('%Y-%m-%d') if self.expires_at else None,
            'verifiedAt': datetime.now().isoformat()
        }

        content = json.dumps(data, ensure_ascii=False)
        encoded = base64.b64encode(content.encode()).decode()

        with open(self._config_file, 'w', encoding='utf-8') as f:
            f.write(encoded)

    def activate(self, email: str, license_key: str) -> Dict:
        """ライセンスをアクティベート"""
        if not email or '@' not in email:
            return {'is_valid': False, 'error': '有効なメールアドレスを入力してください', 'tier': None}

        info = validate_license_key(license_key, email)

        if info['is_valid']:
            self.license_key = license_key.strip().upper()
            self.email = email.strip().lower()
            self.expires_at = info.get('expires_at')
            self.activated_at = datetime.now()
            self.tier = info.get('tier')
            self.limits = get_feature_limits(self.tier)
            self.save()

        return info

    def clear(self):
        """ライセンスをクリア"""
        self.license_key = None
        self.email = None
        self.expires_at = None
        self.activated_at = None
        self.tier = None
        self.limits = get_feature_limits(None)
        if self._config_file.exists():
            self._config_file.unlink()

    @property
    def is_activated(self) -> bool:
        return self.tier is not None

    @property
    def tier_name(self) -> str:
        if self.tier:
            return TIER_NAMES.get(self.tier, self.tier)
        return 'Free'

    @property
    def days_until_expiry(self) -> Optional[int]:
        """有効期限までの日数を返す"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.now()
        return delta.days

    @property
    def is_expiring_soon(self) -> bool:
        """期限が近づいているかチェック（30日前から警告）"""
        days = self.days_until_expiry
        if days is None:
            return False
        return 0 < days <= EXPIRY_WARNING_DAYS

    @property
    def expiry_warning_message(self) -> Optional[str]:
        """期限警告メッセージを返す"""
        if not self.is_expiring_soon:
            return None
        days = self.days_until_expiry
        return f"ライセンスの有効期限まであと{days}日です。更新をお忘れなく！"
