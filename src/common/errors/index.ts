/**
 * Insight Series 共通エラー定義
 */

import { t } from '../i18n';

/**
 * エラーコード定義
 */
export const ErrorCode = {
  // 一般エラー (1xxx)
  UNKNOWN: 'E1000',
  VALIDATION: 'E1001',
  NOT_FOUND: 'E1002',
  PERMISSION_DENIED: 'E1003',
  TIMEOUT: 'E1004',

  // ファイル関連 (2xxx)
  FILE_NOT_FOUND: 'E2001',
  FILE_READ_ERROR: 'E2002',
  FILE_WRITE_ERROR: 'E2003',
  FILE_INVALID_FORMAT: 'E2004',
  FILE_TOO_LARGE: 'E2005',
  FILE_CORRUPTED: 'E2006',

  // 解析関連 (3xxx)
  ANALYSIS_ERROR: 'E3001',
  ANALYSIS_TIMEOUT: 'E3002',
  ANALYSIS_INVALID_STRUCTURE: 'E3003',
  ANALYSIS_UNSUPPORTED_VERSION: 'E3004',

  // ライセンス関連 (4xxx)
  LICENSE_INVALID: 'E4001',
  LICENSE_EXPIRED: 'E4002',
  LICENSE_MACHINE_MISMATCH: 'E4003',
  LICENSE_FEATURE_RESTRICTED: 'E4004',
  LICENSE_LIMIT_EXCEEDED: 'E4005',

  // ネットワーク関連 (5xxx)
  NETWORK_ERROR: 'E5001',
  NETWORK_TIMEOUT: 'E5002',
  NETWORK_UNAVAILABLE: 'E5003',

  // エクスポート関連 (6xxx)
  EXPORT_ERROR: 'E6001',
  EXPORT_TEMPLATE_ERROR: 'E6002',
  EXPORT_PERMISSION_DENIED: 'E6003',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * エラーの重要度
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * エラーカテゴリ
 */
export type ErrorCategory =
  | 'general'
  | 'file'
  | 'analysis'
  | 'license'
  | 'network'
  | 'export';

/**
 * エラーメタデータ
 */
export interface ErrorMetadata {
  code: ErrorCodeType;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  userFacing: boolean;
}

/**
 * エラーメタデータマップ
 */
const errorMetadata: Record<ErrorCodeType, ErrorMetadata> = {
  [ErrorCode.UNKNOWN]: { code: ErrorCode.UNKNOWN, category: 'general', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.VALIDATION]: { code: ErrorCode.VALIDATION, category: 'general', severity: 'warning', retryable: false, userFacing: true },
  [ErrorCode.NOT_FOUND]: { code: ErrorCode.NOT_FOUND, category: 'general', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.PERMISSION_DENIED]: { code: ErrorCode.PERMISSION_DENIED, category: 'general', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.TIMEOUT]: { code: ErrorCode.TIMEOUT, category: 'general', severity: 'error', retryable: true, userFacing: true },

  [ErrorCode.FILE_NOT_FOUND]: { code: ErrorCode.FILE_NOT_FOUND, category: 'file', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.FILE_READ_ERROR]: { code: ErrorCode.FILE_READ_ERROR, category: 'file', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.FILE_WRITE_ERROR]: { code: ErrorCode.FILE_WRITE_ERROR, category: 'file', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.FILE_INVALID_FORMAT]: { code: ErrorCode.FILE_INVALID_FORMAT, category: 'file', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.FILE_TOO_LARGE]: { code: ErrorCode.FILE_TOO_LARGE, category: 'file', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.FILE_CORRUPTED]: { code: ErrorCode.FILE_CORRUPTED, category: 'file', severity: 'error', retryable: false, userFacing: true },

  [ErrorCode.ANALYSIS_ERROR]: { code: ErrorCode.ANALYSIS_ERROR, category: 'analysis', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.ANALYSIS_TIMEOUT]: { code: ErrorCode.ANALYSIS_TIMEOUT, category: 'analysis', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.ANALYSIS_INVALID_STRUCTURE]: { code: ErrorCode.ANALYSIS_INVALID_STRUCTURE, category: 'analysis', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.ANALYSIS_UNSUPPORTED_VERSION]: { code: ErrorCode.ANALYSIS_UNSUPPORTED_VERSION, category: 'analysis', severity: 'warning', retryable: false, userFacing: true },

  [ErrorCode.LICENSE_INVALID]: { code: ErrorCode.LICENSE_INVALID, category: 'license', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.LICENSE_EXPIRED]: { code: ErrorCode.LICENSE_EXPIRED, category: 'license', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.LICENSE_MACHINE_MISMATCH]: { code: ErrorCode.LICENSE_MACHINE_MISMATCH, category: 'license', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.LICENSE_FEATURE_RESTRICTED]: { code: ErrorCode.LICENSE_FEATURE_RESTRICTED, category: 'license', severity: 'warning', retryable: false, userFacing: true },
  [ErrorCode.LICENSE_LIMIT_EXCEEDED]: { code: ErrorCode.LICENSE_LIMIT_EXCEEDED, category: 'license', severity: 'warning', retryable: false, userFacing: true },

  [ErrorCode.NETWORK_ERROR]: { code: ErrorCode.NETWORK_ERROR, category: 'network', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.NETWORK_TIMEOUT]: { code: ErrorCode.NETWORK_TIMEOUT, category: 'network', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.NETWORK_UNAVAILABLE]: { code: ErrorCode.NETWORK_UNAVAILABLE, category: 'network', severity: 'error', retryable: true, userFacing: true },

  [ErrorCode.EXPORT_ERROR]: { code: ErrorCode.EXPORT_ERROR, category: 'export', severity: 'error', retryable: true, userFacing: true },
  [ErrorCode.EXPORT_TEMPLATE_ERROR]: { code: ErrorCode.EXPORT_TEMPLATE_ERROR, category: 'export', severity: 'error', retryable: false, userFacing: true },
  [ErrorCode.EXPORT_PERMISSION_DENIED]: { code: ErrorCode.EXPORT_PERMISSION_DENIED, category: 'export', severity: 'error', retryable: false, userFacing: true },
};

/**
 * Insight Series 基底エラークラス
 */
export class InsightError extends Error {
  public readonly code: ErrorCodeType;
  public readonly metadata: ErrorMetadata;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly cause?: Error;

  constructor(
    code: ErrorCodeType,
    message?: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message || code);
    this.name = 'InsightError';
    this.code = code;
    this.metadata = errorMetadata[code] || errorMetadata[ErrorCode.UNKNOWN];
    this.details = details;
    this.timestamp = new Date();
    this.cause = cause;

    // スタックトレースを正しく設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InsightError);
    }
  }

  /**
   * リトライ可能かどうか
   */
  isRetryable(): boolean {
    return this.metadata.retryable;
  }

  /**
   * ユーザー向けエラーかどうか
   */
  isUserFacing(): boolean {
    return this.metadata.userFacing;
  }

  /**
   * ローカライズされたメッセージを取得
   */
  getLocalizedMessage(): string {
    const key = `errors.${this.code}`;
    const translated = t(key);
    return translated !== key ? translated : this.message;
  }

  /**
   * JSON形式に変換
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * ファイルエラー
 */
export class FileError extends InsightError {
  constructor(
    code: ErrorCodeType,
    message?: string,
    filePath?: string,
    cause?: Error
  ) {
    super(code, message, { filePath }, cause);
    this.name = 'FileError';
  }
}

/**
 * ライセンスエラー
 */
export class LicenseError extends InsightError {
  constructor(
    code: ErrorCodeType,
    message?: string,
    details?: Record<string, unknown>
  ) {
    super(code, message, details);
    this.name = 'LicenseError';
  }
}

/**
 * 解析エラー
 */
export class AnalysisError extends InsightError {
  constructor(
    code: ErrorCodeType,
    message?: string,
    location?: string,
    cause?: Error
  ) {
    super(code, message, { location }, cause);
    this.name = 'AnalysisError';
  }
}

/**
 * エクスポートエラー
 */
export class ExportError extends InsightError {
  constructor(
    code: ErrorCodeType,
    message?: string,
    outputPath?: string,
    cause?: Error
  ) {
    super(code, message, { outputPath }, cause);
    this.name = 'ExportError';
  }
}

/**
 * エラーがリトライ可能かチェック
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof InsightError) {
    return error.isRetryable();
  }
  return false;
}

/**
 * エラーをInsightErrorに変換
 */
export function toInsightError(error: unknown): InsightError {
  if (error instanceof InsightError) {
    return error;
  }

  if (error instanceof Error) {
    return new InsightError(ErrorCode.UNKNOWN, error.message, undefined, error);
  }

  return new InsightError(ErrorCode.UNKNOWN, String(error));
}

/**
 * エラーハンドラー
 */
export type ErrorHandler = (error: InsightError) => void;

let globalErrorHandler: ErrorHandler | null = null;

/**
 * グローバルエラーハンドラーを設定
 */
export function setErrorHandler(handler: ErrorHandler): void {
  globalErrorHandler = handler;
}

/**
 * エラーを報告
 */
export function reportError(error: unknown): void {
  const insightError = toInsightError(error);

  // コンソールにログ出力
  console.error(`[${insightError.code}] ${insightError.message}`, insightError.details);

  // グローバルハンドラーがあれば呼び出し
  if (globalErrorHandler) {
    globalErrorHandler(insightError);
  }
}
