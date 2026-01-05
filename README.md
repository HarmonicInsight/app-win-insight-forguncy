# Forguncy Insight

Forguncyプロジェクト(.fgcp)を解析し、仕様書を自動生成するツール

**v1.1.0 | 対応: Forguncy 9.x | Python版**

## 機能

- **プロジェクト解析**: テーブル、ページ、ワークフロー、サーバーコマンドを自動抽出
- **Word/Excel出力**: 正式な仕様書形式で出力（Standard版）
- **差分比較**: 2つのプロジェクトの変更点を検出（Standard版）
- **ER図生成**: Mermaid形式でER図を出力
- **非同期処理**: 大きなファイルでもUIがフリーズしない
- **安全ガード**: 破損・巨大ファイルの検出と保護

## クイックスタート

```bash
# 依存関係のインストール
pip install -r requirements.txt

# 起動
python ForguncyInsight.py
```

### 依存関係

```bash
pip install python-docx openpyxl tkinterdnd2
```

`tkinterdnd2` はドラッグ＆ドロップ機能に使用（オプション）

## 使い方

1. ファイルをドロップまたは「クリック」でForguncyプロジェクト(.fgcp)を選択
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

## ログファイル

エラー発生時はログファイルを確認してください：

- **Windows**: `%APPDATA%\ForguncyInsight\logs\app.log`
- **macOS/Linux**: `~/.forguncyinsight/logs/app.log`

## 制限事項

入力ファイルの安全ガード：

| 項目 | 上限 |
|------|------|
| ファイルサイズ | 200MB |
| ZIPエントリ数 | 50,000 |
| 解凍後サイズ | 1GB |

上限を超えるファイルは警告または拒否されます。

## EXE化（Windows）

PyInstallerを使用してEXE化できます：

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --name ForguncyInsight ForguncyInsight.py
```

生成されたEXEは `dist/ForguncyInsight.exe` に出力されます。

## ファイル構成

```
ForguncyInsight/
├── ForguncyInsight.py   # メインアプリケーション
├── requirements.txt     # Python依存関係
├── README.md            # このファイル
├── docs/
│   └── manual.md        # ユーザーマニュアル
├── assets/
│   └── icon.svg         # アプリアイコン
└── samples/             # サンプルファイル
```

## 変更履歴

### v1.1.0
- Python版に一本化（Electron版廃止）
- 非同期処理によるUIフリーズ解消
- ZIP安全ガード追加（サイズ・エントリ数制限）
- ログ基盤追加（ファイル＋UI表示）
- エラー発生時の原因追跡機能強化

### v1.0.0
- 初回リリース
