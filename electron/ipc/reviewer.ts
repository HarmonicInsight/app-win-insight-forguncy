import {
  AnalysisResult,
  ReviewResult,
  ReviewIssue,
  ReviewSummary,
  ReviewCategory,
  OrgImpactResult,
  HardcodedReference,
  RoleReference,
  ApprovalFlowReference,
  ServerCommandInfo,
  WorkflowInfo,
  TableInfo,
  PageInfo,
  CommandInfo,
} from './types';

/**
 * プロジェクトのコードレビューを実行
 */
export function reviewProject(analysis: AnalysisResult): ReviewResult {
  const issues: ReviewIssue[] = [];

  // セキュリティチェック
  issues.push(...checkSecurityIssues(analysis));

  // バグリスクチェック
  issues.push(...checkBugRisks(analysis));

  // パフォーマンスチェック
  issues.push(...checkPerformanceIssues(analysis));

  // 保守性チェック
  issues.push(...checkMaintainabilityIssues(analysis));

  // ワークフローチェック
  issues.push(...checkWorkflowIssues(analysis));

  // 組織変更影響分析
  const orgImpact = analyzeOrgImpact(analysis);

  // サマリー計算
  const summary = calculateSummary(issues);

  return { issues, summary, orgImpact };
}

/**
 * セキュリティ問題のチェック
 */
function checkSecurityIssues(analysis: AnalysisResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // SQLインジェクションリスクのチェック
  for (const cmd of analysis.serverCommands) {
    for (const line of cmd.commands) {
      if (line.includes('EXECUTE SQL:')) {
        // パラメータ化されていないSQL
        const sqlContent = cmd.commands.slice(
          cmd.commands.indexOf(line) + 1
        ).join('\n');

        // 文字列連結の検出
        if (sqlContent.includes("' +") || sqlContent.includes("+ '") ||
            sqlContent.includes('" +') || sqlContent.includes('+ "')) {
          issues.push({
            severity: 'high',
            category: 'security',
            title: 'SQLインジェクションの可能性',
            description: '文字列連結によるSQL構築が検出されました。パラメータ化クエリを使用してください。',
            location: `サーバーコマンド: ${cmd.name}`,
            code: sqlContent.slice(0, 200),
            suggestion: 'パラメータ（@param形式）を使用してSQL文を構築してください。',
          });
        }

        // LIKE句の不適切な使用
        if (sqlContent.toUpperCase().includes('LIKE') &&
            (sqlContent.includes('%') || sqlContent.includes('_'))) {
          issues.push({
            severity: 'medium',
            category: 'security',
            title: 'LIKE句のワイルドカード使用',
            description: 'LIKE句でワイルドカードを使用しています。ユーザー入力が含まれる場合はエスケープが必要です。',
            location: `サーバーコマンド: ${cmd.name}`,
            suggestion: 'ユーザー入力をエスケープするか、全文検索機能の使用を検討してください。',
          });
        }
      }
    }

    // パラメータ未使用のチェック
    if (cmd.parameters && cmd.parameters.length > 0) {
      for (const param of cmd.parameters) {
        const paramUsed = cmd.commands.some(
          (line) => line.includes(`@${param.name}`) || line.includes(`=${param.name}`)
        );
        if (!paramUsed) {
          issues.push({
            severity: 'low',
            category: 'security',
            title: '未使用パラメータ',
            description: `パラメータ「${param.name}」が定義されていますが使用されていません。`,
            location: `サーバーコマンド: ${cmd.name}`,
            suggestion: '不要なパラメータは削除してください。',
          });
        }
      }
    }
  }

  // メールアドレスのハードコード
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const cmd of analysis.serverCommands) {
    const cmdText = cmd.commands.join('\n');
    const emails = cmdText.match(emailPattern);
    if (emails) {
      issues.push({
        severity: 'medium',
        category: 'security',
        title: 'ハードコードされたメールアドレス',
        description: `メールアドレスがハードコードされています: ${emails.join(', ')}`,
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: 'メールアドレスは設定テーブルまたはマスタテーブルで管理してください。',
      });
    }
  }

  return issues;
}

/**
 * バグリスクのチェック
 */
function checkBugRisks(analysis: AnalysisResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const cmd of analysis.serverCommands) {
    const cmdText = cmd.commands.join('\n').toUpperCase();

    // トランザクション未使用
    const hasMultipleDbOps =
      (cmdText.match(/UPDATE TABLE|INSERT INTO TABLE|DELETE FROM TABLE|EXECUTE SQL/g) || []).length > 1;

    if (hasMultipleDbOps && !cmdText.includes('TRANSACTION')) {
      issues.push({
        severity: 'high',
        category: 'bug',
        title: 'トランザクション未使用',
        description: '複数のデータベース操作がありますが、トランザクションが使用されていません。',
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: '複数のDB操作は「トランザクション開始」「コミット」「ロールバック」で囲んでください。',
      });
    }

    // NULL未考慮
    if (cmdText.includes('WHERE') && !cmdText.includes('IS NULL') && !cmdText.includes('IS NOT NULL')) {
      if (cmdText.includes('=') && !cmdText.includes('!=') && !cmdText.includes('<>')) {
        issues.push({
          severity: 'low',
          category: 'bug',
          title: 'NULL値の考慮不足の可能性',
          description: 'WHERE句でNULL値のチェックがない可能性があります。',
          location: `サーバーコマンド: ${cmd.name}`,
          suggestion: 'NULL値が入る可能性のあるカラムには IS NULL / IS NOT NULL を使用してください。',
        });
      }
    }
  }

  // 必須フィールドにデフォルト値がない
  for (const table of analysis.tables) {
    for (const col of table.columns) {
      if (col.required && !col.defaultValue) {
        issues.push({
          severity: 'low',
          category: 'bug',
          title: '必須フィールドのデフォルト値未設定',
          description: `必須フィールド「${col.name}」にデフォルト値が設定されていません。`,
          location: `テーブル: ${table.name}`,
          suggestion: '必須フィールドにはデフォルト値を設定するか、入力フォームで必須チェックを行ってください。',
        });
      }
    }
  }

  return issues;
}

/**
 * パフォーマンス問題のチェック
 */
function checkPerformanceIssues(analysis: AnalysisResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const cmd of analysis.serverCommands) {
    const cmdText = cmd.commands.join('\n').toUpperCase();

    // N+1クエリパターン
    if (cmdText.includes('LOOP') && cmdText.includes('EXECUTE SQL')) {
      issues.push({
        severity: 'high',
        category: 'performance',
        title: 'N+1クエリの可能性',
        description: 'ループ内でSQLを実行しています。大量データで遅くなる可能性があります。',
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: 'ループ前に一括でデータを取得するか、JOINを使用してください。',
      });
    }

    // 大量のサブクエリ
    const subqueryCount = (cmdText.match(/\(SELECT/g) || []).length;
    if (subqueryCount >= 3) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        title: '多数のサブクエリ',
        description: `${subqueryCount}個のサブクエリが含まれています。`,
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: 'JOINやCTEを使用してクエリを最適化してください。',
      });
    }

    // SELECT * の使用
    if (cmdText.includes('SELECT *')) {
      issues.push({
        severity: 'low',
        category: 'performance',
        title: 'SELECT * の使用',
        description: '全カラム取得は不要なデータ転送を招きます。',
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: '必要なカラムのみを明示的に指定してください。',
      });
    }
  }

  // 多すぎるリレーション
  for (const table of analysis.tables) {
    if (table.relations.length > 10) {
      issues.push({
        severity: 'medium',
        category: 'performance',
        title: '過度なリレーション',
        description: `テーブル「${table.name}」に${table.relations.length}個のリレーションがあります。`,
        location: `テーブル: ${table.name}`,
        suggestion: 'テーブル設計の見直しを検討してください。',
      });
    }
  }

  return issues;
}

/**
 * 保守性問題のチェック
 */
function checkMaintainabilityIssues(analysis: AnalysisResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // マジックナンバー・マジックストリング
  for (const cmd of analysis.serverCommands) {
    const cmdText = cmd.commands.join('\n');

    // 数値リテラル（0, 1以外）
    const numbers = cmdText.match(/[^a-zA-Z_](\d{2,})/g);
    if (numbers && numbers.length > 3) {
      issues.push({
        severity: 'low',
        category: 'maintainability',
        title: 'ハードコードされた数値',
        description: '複数のハードコードされた数値があります。',
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: '定数として定義するか、設定テーブルで管理してください。',
      });
    }
  }

  // 長すぎるサーバーコマンド
  for (const cmd of analysis.serverCommands) {
    if (cmd.commands.length > 100) {
      issues.push({
        severity: 'medium',
        category: 'maintainability',
        title: '長すぎるサーバーコマンド',
        description: `${cmd.commands.length}行のコマンドがあります。保守が困難です。`,
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: '機能ごとに分割してください。',
      });
    }
  }

  // 深すぎるネスト
  for (const cmd of analysis.serverCommands) {
    let maxIndent = 0;
    for (const line of cmd.commands) {
      const indent = line.search(/\S/);
      if (indent > maxIndent) maxIndent = indent;
    }
    if (maxIndent / 2 > 5) {
      issues.push({
        severity: 'medium',
        category: 'maintainability',
        title: '深すぎるネスト',
        description: 'ネストが深すぎます（5階層以上）。',
        location: `サーバーコマンド: ${cmd.name}`,
        suggestion: '早期リターンパターンや関数分割を検討してください。',
      });
    }
  }

  // 重複コードの検出（簡易版）
  const sqlStatements: Map<string, string[]> = new Map();
  for (const cmd of analysis.serverCommands) {
    for (let i = 0; i < cmd.commands.length; i++) {
      if (cmd.commands[i].includes('EXECUTE SQL:')) {
        const sql = cmd.commands.slice(i + 1, i + 10).join('\n').trim();
        if (sql.length > 50) {
          const existing = sqlStatements.get(sql) || [];
          existing.push(cmd.name);
          sqlStatements.set(sql, existing);
        }
      }
    }
  }

  for (const [sql, locations] of sqlStatements) {
    if (locations.length > 1) {
      issues.push({
        severity: 'medium',
        category: 'maintainability',
        title: '重複SQLの可能性',
        description: `同様のSQLが${locations.length}箇所で使用されています。`,
        location: locations.join(', '),
        suggestion: '共通のサーバーコマンドとして抽出してください。',
      });
    }
  }

  return issues;
}

/**
 * ワークフロー問題のチェック
 */
function checkWorkflowIssues(analysis: AnalysisResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  for (const wf of analysis.workflows) {
    // デッドエンド状態のチェック
    const statesWithOutgoing = new Set(wf.transitions.map((t) => t.fromState));
    const finalStates = wf.states.filter((s) => s.isFinal).map((s) => s.name);

    for (const state of wf.states) {
      if (!statesWithOutgoing.has(state.name) && !finalStates.includes(state.name) && !state.isFinal) {
        issues.push({
          severity: 'high',
          category: 'workflow',
          title: 'デッドエンド状態',
          description: `状態「${state.name}」から遷移先がありません。`,
          location: `ワークフロー: ${wf.tableName}`,
          suggestion: '遷移を追加するか、終了状態に設定してください。',
        });
      }
    }

    // 担当者未設定のチェック
    for (const trans of wf.transitions) {
      if (trans.assignees.length === 0) {
        issues.push({
          severity: 'medium',
          category: 'workflow',
          title: '担当者未設定',
          description: `遷移「${trans.action}」（${trans.fromState}→${trans.toState}）に担当者が設定されていません。`,
          location: `ワークフロー: ${wf.tableName}`,
          suggestion: '担当者、ロール、またはフィールド参照を設定してください。',
        });
      }
    }

    // 条件なし遷移の重複チェック
    const unconditionalTransitions: Map<string, string[]> = new Map();
    for (const trans of wf.transitions) {
      if (trans.conditions.length === 0) {
        const key = trans.fromState;
        const existing = unconditionalTransitions.get(key) || [];
        existing.push(trans.action);
        unconditionalTransitions.set(key, existing);
      }
    }

    for (const [state, actions] of unconditionalTransitions) {
      if (actions.length > 1) {
        issues.push({
          severity: 'medium',
          category: 'workflow',
          title: '複数の無条件遷移',
          description: `状態「${state}」に複数の無条件遷移があります: ${actions.join(', ')}`,
          location: `ワークフロー: ${wf.tableName}`,
          suggestion: '条件を追加して遷移を明確にしてください。',
        });
      }
    }

    // 孤立状態のチェック
    const reachableStates = new Set<string>();
    const initialStates = wf.states.filter((s) => s.isInitial);

    if (initialStates.length === 0) {
      issues.push({
        severity: 'high',
        category: 'workflow',
        title: '初期状態未設定',
        description: 'ワークフローに初期状態が設定されていません。',
        location: `ワークフロー: ${wf.tableName}`,
        suggestion: 'いずれかの状態を初期状態に設定してください。',
      });
    } else {
      // 初期状態から到達可能な状態を計算
      const queue = initialStates.map((s) => s.name);
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (reachableStates.has(current)) continue;
        reachableStates.add(current);

        for (const trans of wf.transitions) {
          if (trans.fromState === current && !reachableStates.has(trans.toState)) {
            queue.push(trans.toState);
          }
        }
      }

      for (const state of wf.states) {
        if (!reachableStates.has(state.name)) {
          issues.push({
            severity: 'medium',
            category: 'workflow',
            title: '孤立状態',
            description: `状態「${state.name}」は初期状態から到達できません。`,
            location: `ワークフロー: ${wf.tableName}`,
            suggestion: '遷移を追加するか、状態を削除してください。',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * 組織変更影響分析
 */
function analyzeOrgImpact(analysis: AnalysisResult): OrgImpactResult {
  const hardcodedUsers: HardcodedReference[] = [];
  const hardcodedEmails: HardcodedReference[] = [];
  const roleReferences: RoleReference[] = [];
  const approvalFlows: ApprovalFlowReference[] = [];

  // メールアドレスパターン
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // サーバーコマンドからハードコード検出
  for (const cmd of analysis.serverCommands) {
    const cmdText = cmd.commands.join('\n');

    // メールアドレス
    const emails = cmdText.match(emailPattern);
    if (emails) {
      for (const email of emails) {
        hardcodedEmails.push({
          value: email,
          location: `サーバーコマンド: ${cmd.name}`,
          context: 'サーバーコマンド内のメール設定',
        });
      }
    }

    // ユーザーIDらしき文字列（日本語名またはID形式）
    const userIdPatterns = [
      /担当者[:：]\s*([^\s,、]+)/g,
      /送信先[:：]\s*([^\s,、]+)/g,
      /ユーザー[:：]\s*([^\s,、]+)/g,
    ];

    for (const pattern of userIdPatterns) {
      let match;
      while ((match = pattern.exec(cmdText)) !== null) {
        if (!match[1].includes('@')) {
          hardcodedUsers.push({
            value: match[1],
            location: `サーバーコマンド: ${cmd.name}`,
            context: '担当者・送信先設定',
          });
        }
      }
    }
  }

  // ワークフローからロール参照と承認フロー抽出
  for (const wf of analysis.workflows) {
    let order = 0;
    for (const trans of wf.transitions) {
      const assigneeNames: string[] = [];

      for (const assignee of trans.assignees) {
        if (assignee.type === 'role') {
          roleReferences.push({
            roleName: assignee.value,
            location: `ワークフロー: ${wf.tableName} / 遷移: ${trans.action}`,
            usage: '承認者ロール',
          });
          assigneeNames.push(`[ロール] ${assignee.value}`);
        } else if (assignee.type === 'user') {
          hardcodedUsers.push({
            value: assignee.value,
            location: `ワークフロー: ${wf.tableName} / 遷移: ${trans.action}`,
            context: '承認担当者',
          });
          assigneeNames.push(`[ユーザー] ${assignee.value}`);
        } else {
          assigneeNames.push(`[${assignee.type}] ${assignee.value}`);
        }
      }

      if (assigneeNames.length > 0) {
        approvalFlows.push({
          workflow: wf.tableName,
          transition: `${trans.fromState} → ${trans.toState}`,
          assignees: assigneeNames,
          order: order++,
        });
      }
    }
  }

  return { hardcodedUsers, hardcodedEmails, roleReferences, approvalFlows };
}

/**
 * レビューサマリーを計算
 */
function calculateSummary(issues: ReviewIssue[]): ReviewSummary {
  const summary: ReviewSummary = {
    high: 0,
    medium: 0,
    low: 0,
    total: issues.length,
    byCategory: {
      security: 0,
      bug: 0,
      performance: 0,
      maintainability: 0,
      workflow: 0,
      organization: 0,
    },
  };

  for (const issue of issues) {
    summary[issue.severity]++;
    summary.byCategory[issue.category]++;
  }

  return summary;
}
