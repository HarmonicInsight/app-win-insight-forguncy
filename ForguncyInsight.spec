# -*- mode: python ; coding: utf-8 -*-

import pathlib

block_cipher = None

project_dir = pathlib.Path(__file__).resolve().parent

insight_common_datas = [
    ('insight-common/i18n', 'insight-common/i18n'),
    ('insight-common/errors', 'insight-common/errors'),
    ('insight-common/utils', 'insight-common/utils'),
    ('insight-common/license', 'insight-common/license'),
    ('insight-common/config', 'insight-common/config'),
    ('insight-common/company', 'insight-common/company'),
    ('insight-common/legal', 'insight-common/legal'),
]

a = Analysis(
    ['ForguncyInsight.py'],
    pathex=[str(project_dir)],
    binaries=[],
    datas=insight_common_datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ForguncyInsight',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ForguncyInsight')