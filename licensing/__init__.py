#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forguncy Insight - Licensing モジュール

ライセンス管理・検証機能を提供する。
"""

from licensing.verify import (
    LicenseManager,
    validate_license_key,
    get_feature_limits,
    FEATURE_LIMITS,
    TIER_NAMES,
    PRODUCT_CODE,
    PRODUCT_NAME,
    PURCHASE_URL,
    TRIAL_URL,
)

__all__ = [
    'LicenseManager',
    'validate_license_key',
    'get_feature_limits',
    'FEATURE_LIMITS',
    'TIER_NAMES',
    'PRODUCT_CODE',
    'PRODUCT_NAME',
    'PURCHASE_URL',
    'TRIAL_URL',
]
