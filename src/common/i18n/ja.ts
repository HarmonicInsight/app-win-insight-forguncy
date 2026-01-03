// 日本語リソース
export const ja = {
  // 共通
  common: {
    save: '保存',
    cancel: 'キャンセル',
    close: '閉じる',
    ok: 'OK',
    yes: 'はい',
    no: 'いいえ',
    confirm: '確認',
    delete: '削除',
    edit: '編集',
    add: '追加',
    search: '検索',
    loading: '読み込み中...',
    processing: '処理中...',
    error: 'エラー',
    success: '成功',
    warning: '警告',
    info: '情報',
    settings: '設定',
    help: 'ヘルプ',
    about: 'について',
    version: 'バージョン',
    file: 'ファイル',
    folder: 'フォルダ',
    open: '開く',
    export: 'エクスポート',
  },

  // アプリケーション
  app: {
    title: 'Forguncy Analyzer',
    subtitle: 'Forguncyプロジェクトを解析し、仕様書を自動生成',
    footer: 'Powered by HarmonicInsight',
  },

  // ファイル選択
  fileSelect: {
    dropzone: 'プロジェクトファイルをドロップ',
    orClick: 'または クリックして選択',
    supportedFormat: '対応形式: .fgcp (Forguncyプロジェクトファイル)',
    selected: '選択されたファイル',
    changeFile: 'クリックまたはドロップで変更',
  },

  // 解析オプション
  options: {
    title: '解析オプション',
    generateSpec: '仕様書生成',
    generateSpecDesc: 'Word形式の詳細仕様書を生成',
    codeReview: 'コードレビュー',
    codeReviewDesc: 'セキュリティ・バグリスクを検出',
    orgAnalysis: '組織変更分析',
    orgAnalysisDesc: '人事異動時の影響箇所を特定',
    fixGuide: '修正ガイド',
    fixGuideDesc: '問題の修正手順書を生成',
  },

  // 出力設定
  output: {
    folder: '出力フォルダ',
    notSet: '未設定',
    change: '変更',
    generatedFiles: '生成されたファイル',
    openFolder: '出力フォルダを開く',
  },

  // 解析
  analysis: {
    start: '解析開始',
    analyzing: '解析中...',
    complete: '完了しました',
    results: '解析結果',
    tables: 'テーブル',
    pages: '画面',
    workflows: 'ワークフロー',
    serverCommands: 'サーバーコマンド',
    columns: 'カラム',
    relations: 'リレーション',
    buttons: 'ボタン',
    formulas: '数式',
  },

  // レビュー
  review: {
    title: 'コードレビューレポート',
    issues: '検出された問題',
    summary: 'サマリー',
    high: '高',
    medium: '中',
    low: '低',
    total: '合計',
    category: {
      security: 'セキュリティ',
      bug: 'バグリスク',
      performance: 'パフォーマンス',
      maintainability: '保守性',
      workflow: 'ワークフロー',
      organization: '組織',
    },
    location: '場所',
    suggestion: '推奨対応',
  },

  // ライセンス
  license: {
    title: 'ライセンス',
    currentTier: '現在のプラン',
    free: '無料版',
    trial: 'トライアル',
    standard: 'スタンダード',
    professional: 'プロフェッショナル',
    enterprise: 'エンタープライズ',
    expiresAt: '有効期限',
    unlimited: '無制限',
    activate: 'アクティベート',
    enterKey: 'ライセンスキーを入力',
    invalidKey: 'ライセンスキーが無効です',
    expired: 'ライセンスの有効期限が切れています',
    activated: 'ライセンスが有効化されました',
    upgrade: 'アップグレード',
    upgradeCta: 'アップグレードで利用可能',
    purchaseUrl: '購入ページを開く',
    deactivate: '解除',
    generateTestKey: 'テストキー生成',
    devTools: '開発者ツール',
    restrictions: '機能制限',
    maxProjects: '最大プロジェクト数',
    maxTables: '最大テーブル数',
    maxPages: '最大ページ数',
  },

  // 進捗
  progress: {
    reading: 'プロジェクトファイルを読み込んでいます...',
    analyzingTables: 'テーブル定義を解析しています...',
    analyzingPages: 'ページ定義を解析しています...',
    analyzingWorkflows: 'ワークフローを解析しています...',
    analyzingCommands: 'サーバーコマンドを解析しています...',
    reviewing: 'コードレビューを実行しています...',
    generatingSpec: '仕様書を生成しています...',
    generatingReport: 'レビューレポートを生成しています...',
    complete: '完了しました',
  },

  // エラー
  errors: {
    fileNotFound: 'ファイルが見つかりません',
    invalidFile: '無効なファイル形式です',
    analysisError: '解析中にエラーが発生しました',
    exportError: 'エクスポート中にエラーが発生しました',
    networkError: 'ネットワークエラーが発生しました',
    unknownError: '予期せぬエラーが発生しました',
    licenseRequired: 'この機能にはライセンスが必要です',
    limitExceeded: '制限を超えています',
  },

  // 仕様書
  spec: {
    title: 'システム仕様書',
    generatedBy: 'Forguncy Analyzer Pro により自動生成',
    generatedAt: '生成日',
    toc: '目次',
    overview: 'システム概要',
    projectOverview: 'プロジェクト概要',
    tableDefinition: 'テーブル定義',
    tableList: 'テーブル一覧',
    tableDetail: 'テーブル詳細',
    columnName: 'カラム名',
    dataType: 'データ型',
    required: '必須',
    unique: 'ユニーク',
    defaultValue: 'デフォルト値',
    pageList: '画面一覧',
    pageDetail: '画面詳細',
    workflowDefinition: 'ワークフロー定義',
    stateList: '状態一覧',
    transitionList: '遷移一覧',
    serverCommandList: 'サーバーコマンド一覧',
    erDiagram: 'ER図（Mermaid形式）',
  },
};

export type TranslationKeys = typeof ja;
