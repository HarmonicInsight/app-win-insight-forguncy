# Forguncy Insight

Forguncyプロジェクト(.fgcp)を解析し、仕様書を自動生成するツール

**v1.0.0 | 対応: Forguncy 9.x**

## 機能

- **プロジェクト解析**: テーブル、ページ、ワークフロー、サーバーコマンドを自動抽出
- **Word/Excel出力**: 正式な仕様書形式で出力（Standard版）
- **差分比較**: 2つのプロジェクトの変更点を検出（Standard版）
- **ER図生成**: Mermaid形式でER図を出力

## クイックスタート

```bash
# インストール
pip install python-docx openpyxl

# 起動
python ForguncyInsight.py
```

## 使い方

1. 「参照...」でForguncyプロジェクト(.fgcp)を選択
2. 出力フォルダを指定
3. 「解析開始」をクリック

## ライセンス

| プラン | 解析制限 | Word/Excel | 差分比較 | 価格 |
|--------|---------|------------|----------|------|
| Free | テーブル5件, ページ10件 | - | - | 無料 |
| Standard | 無制限 | ○ | ○ | ¥49,800/年 |

## ドキュメント

詳細は [ユーザーマニュアル](docs/manual.md) を参照してください。

## 動作環境

- Python 3.8+
- Windows / macOS / Linux
- Forguncy 9.x

## ファイル構成

```
ForguncyInsight/
├── ForguncyInsight.py   # メインアプリケーション
├── requirements.txt     # Python依存関係
├── README.md            # このファイル
└── docs/
    └── manual.md        # ユーザーマニュアル
```
