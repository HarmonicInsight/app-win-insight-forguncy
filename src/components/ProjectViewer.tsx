import { useState, useCallback } from 'react';

// 型はvite-env.d.tsでグローバルに定義されている

interface Props {
  analysisResult: AnalysisResult;
}

type ViewSection = 'tables' | 'pages' | 'serverCommands' | 'workflows';

// コピー機能
function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`p-1 rounded hover:bg-gray-200 transition-colors ${className}`}
      title="コピー"
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export default function ProjectViewer({ analysisResult }: Props) {
  const [activeSection, setActiveSection] = useState<ViewSection>('tables');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hideEmptyPages, setHideEmptyPages] = useState(false);

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const pagesWithContent = analysisResult.pages.filter(p => p.buttons.length > 0 || p.formulas.length > 0);

  const sections: { key: ViewSection; label: string; count: number; icon: JSX.Element }[] = [
    {
      key: 'tables',
      label: 'テーブル',
      count: analysisResult.tables.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      key: 'pages',
      label: '画面',
      count: hideEmptyPages ? pagesWithContent.length : analysisResult.pages.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'serverCommands',
      label: 'サーバーコマンド',
      count: analysisResult.serverCommands.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'workflows',
      label: 'ワークフロー',
      count: analysisResult.workflows.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-[600px] border border-gray-200 rounded-lg overflow-hidden select-text">
      {/* サイドバー */}
      <div className="w-48 bg-gray-50 border-r border-gray-200 flex-shrink-0">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 transition-colors ${
              activeSection === section.key
                ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {section.icon}
            <span className="flex-1">{section.label}</span>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              {section.count}
            </span>
          </button>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto p-4">
        {activeSection === 'tables' && (
          <TableList tables={analysisResult.tables} expandedItems={expandedItems} toggleItem={toggleItem} />
        )}
        {activeSection === 'pages' && (
          <PageList
            pages={analysisResult.pages}
            expandedItems={expandedItems}
            toggleItem={toggleItem}
            hideEmpty={hideEmptyPages}
            onToggleHideEmpty={() => setHideEmptyPages(!hideEmptyPages)}
          />
        )}
        {activeSection === 'serverCommands' && (
          <ServerCommandList commands={analysisResult.serverCommands} expandedItems={expandedItems} toggleItem={toggleItem} />
        )}
        {activeSection === 'workflows' && (
          <WorkflowList workflows={analysisResult.workflows} expandedItems={expandedItems} toggleItem={toggleItem} />
        )}
      </div>
    </div>
  );
}

// テーブル一覧
function TableList({ tables, expandedItems, toggleItem }: { tables: TableInfo[]; expandedItems: Set<string>; toggleItem: (id: string) => void }) {
  const formatTableAsText = (table: TableInfo) => {
    let text = `テーブル: ${table.name}\n`;
    text += `カラム:\n`;
    table.columns.forEach(col => {
      text += `  - ${col.name} (${col.type})${col.required ? ' [必須]' : ''}${col.unique ? ' [ユニーク]' : ''}\n`;
    });
    if (table.relations.length > 0) {
      text += `リレーション:\n`;
      table.relations.forEach(rel => {
        text += `  - ${rel.sourceColumn} → ${rel.targetTable}.${rel.targetColumn} (${rel.type})\n`;
      });
    }
    return text;
  };

  return (
    <div className="space-y-2">
      {tables.map((table, index) => {
        const id = `table-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <button
                onClick={() => toggleItem(id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-left"
              >
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-800">{table.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{table.columns.length}列</span>
              </button>
              <CopyButton text={formatTableAsText(table)} className="mr-2" />
            </div>
            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <h4 className="text-xs font-medium text-gray-500 mb-2">カラム</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b">
                      <th className="pb-2">名前</th>
                      <th className="pb-2">型</th>
                      <th className="pb-2">必須</th>
                      <th className="pb-2">ユニーク</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-1.5 font-mono text-indigo-600">{col.name}</td>
                        <td className="py-1.5 text-gray-600">{col.type}</td>
                        <td className="py-1.5">{col.required ? '○' : ''}</td>
                        <td className="py-1.5">{col.unique ? '○' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {table.relations.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-gray-500 mt-4 mb-2">リレーション</h4>
                    <div className="space-y-1">
                      {table.relations.map((rel, i) => (
                        <div key={i} className="text-sm text-gray-600">
                          <span className="font-mono text-indigo-600">{rel.sourceColumn}</span>
                          <span className="mx-2">→</span>
                          <span className="font-mono text-green-600">{rel.targetTable}.{rel.targetColumn}</span>
                          <span className="text-xs text-gray-400 ml-2">({rel.type})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
      {tables.length === 0 && <p className="text-gray-300 text-center py-8">テーブルがありません</p>}
    </div>
  );
}

// 画面一覧
function PageList({ pages, expandedItems, toggleItem, hideEmpty, onToggleHideEmpty }: {
  pages: PageInfo[];
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  hideEmpty: boolean;
  onToggleHideEmpty: () => void;
}) {
  const filteredPages = hideEmpty ? pages.filter(p => p.buttons.length > 0 || p.formulas.length > 0) : pages;
  const emptyCount = pages.length - pages.filter(p => p.buttons.length > 0 || p.formulas.length > 0).length;

  const formatPageAsText = (page: PageInfo) => {
    let text = `画面: ${page.name}${page.type === 'masterPage' ? ' [マスターページ]' : ''}\n`;
    if (page.buttons.length > 0) {
      text += `ボタン:\n`;
      page.buttons.forEach(btn => {
        text += `  - ${btn.name}\n`;
        btn.commands.forEach(cmd => {
          text += `    • ${cmd.description}\n`;
        });
      });
    }
    if (page.formulas.length > 0) {
      text += `数式:\n`;
      page.formulas.forEach(f => {
        text += `  - ${f.cell} = ${f.formula}\n`;
      });
    }
    return text;
  };

  return (
    <div className="space-y-2">
      {/* フィルタトグル */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={onToggleHideEmpty}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          空の画面を非表示
          {emptyCount > 0 && <span className="text-xs text-gray-400">({emptyCount}件)</span>}
        </label>
      </div>

      {filteredPages.map((page, index) => {
        const id = `page-${index}`;
        const isExpanded = expandedItems.has(id);
        const hasContent = page.buttons.length > 0 || page.formulas.length > 0;
        return (
          <div key={id} className={`border rounded-lg overflow-hidden ${hasContent ? 'border-gray-200' : 'border-gray-100'}`}>
            <div className={`flex items-center transition-colors ${hasContent ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-50/50 hover:bg-gray-100/50'}`}>
              <button
                onClick={() => toggleItem(id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-left"
              >
                <svg className={`w-4 h-4 transition-transform ${hasContent ? 'text-gray-400' : 'text-gray-200'} ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className={`font-medium ${hasContent ? 'text-gray-800' : 'text-gray-400'}`}>{page.name}</span>
                {page.type === 'masterPage' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">マスター</span>
                )}
                <span className={`text-xs ml-auto ${hasContent ? 'text-gray-500' : 'text-gray-300'}`}>
                  {hasContent ? (
                    <>
                      {page.buttons.length > 0 && `${page.buttons.length}ボタン`}
                      {page.formulas.length > 0 && ` ${page.formulas.length}数式`}
                    </>
                  ) : (
                    'コンテンツなし'
                  )}
                </span>
              </button>
              {hasContent && <CopyButton text={formatPageAsText(page)} className="mr-2" />}
            </div>
            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-white">
                {page.buttons.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">ボタン</h4>
                    <div className="space-y-2 mb-4">
                      {page.buttons.map((btn, i) => (
                        <div key={i} className="bg-gray-50 rounded p-2">
                          <div className="font-medium text-sm text-gray-800">{btn.name}</div>
                          {btn.commands.length > 0 && (
                            <div className="mt-1 text-xs text-gray-500">
                              {btn.commands.map((cmd, j) => (
                                <div key={j}>• {cmd.description}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {page.formulas.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">数式</h4>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {page.formulas.slice(0, 10).map((f, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-mono text-indigo-600">{f.cell}</span>
                          <span className="mx-2">=</span>
                          <span className="font-mono text-gray-600 text-xs">{f.formula}</span>
                        </div>
                      ))}
                      {page.formulas.length > 10 && (
                        <div className="text-xs text-gray-400">他{page.formulas.length - 10}件...</div>
                      )}
                    </div>
                  </>
                )}
                {!hasContent && (
                  <p className="text-sm text-gray-300 italic">コンテンツなし</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {filteredPages.length === 0 && <p className="text-gray-300 text-center py-8">画面がありません</p>}
    </div>
  );
}

// サーバーコマンド一覧
function ServerCommandList({ commands, expandedItems, toggleItem }: { commands: ServerCommandInfo[]; expandedItems: Set<string>; toggleItem: (id: string) => void }) {
  const formatCommandAsText = (cmd: ServerCommandInfo) => {
    let text = `サーバーコマンド: ${cmd.name}\n`;
    if (cmd.parameters && cmd.parameters.length > 0) {
      text += `パラメータ:\n`;
      cmd.parameters.forEach(p => {
        text += `  - ${p.name}: ${p.type}${p.required ? ' [必須]' : ''}\n`;
      });
    }
    text += `処理内容:\n`;
    cmd.commands.forEach(c => {
      text += `  ${c}\n`;
    });
    return text;
  };

  return (
    <div className="space-y-2">
      {commands.map((cmd, index) => {
        const id = `cmd-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <button
                onClick={() => toggleItem(id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-left"
              >
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-800">{cmd.name}</span>
                <span className="text-xs text-gray-500 ml-auto">{cmd.commands.length}行</span>
              </button>
              <CopyButton text={formatCommandAsText(cmd)} className="mr-2" />
            </div>
            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-white">
                {cmd.parameters && cmd.parameters.length > 0 && (
                  <>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">パラメータ</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cmd.parameters.map((p, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {p.name}: {p.type}
                          {p.required && <span className="text-red-500">*</span>}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-500">処理内容</h4>
                  <CopyButton text={cmd.commands.join('\n')} />
                </div>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-60 font-mono">
                  {cmd.commands.slice(0, 30).join('\n')}
                  {cmd.commands.length > 30 && `\n\n... 他${cmd.commands.length - 30}行`}
                </pre>
              </div>
            )}
          </div>
        );
      })}
      {commands.length === 0 && <p className="text-gray-300 text-center py-8">サーバーコマンドがありません</p>}
    </div>
  );
}

// ワークフロー一覧
function WorkflowList({ workflows, expandedItems, toggleItem }: { workflows: WorkflowInfo[]; expandedItems: Set<string>; toggleItem: (id: string) => void }) {
  const formatWorkflowAsText = (wf: WorkflowInfo) => {
    let text = `ワークフロー: ${wf.tableName}\n`;
    text += `状態:\n`;
    wf.states.forEach(state => {
      text += `  - ${state.name}${state.isInitial ? ' [開始]' : ''}${state.isFinal ? ' [終了]' : ''}\n`;
    });
    text += `遷移:\n`;
    wf.transitions.forEach(t => {
      text += `  - ${t.fromState} → ${t.toState}: ${t.action}\n`;
      if (t.assignees.length > 0) {
        text += `    担当: ${t.assignees.map(a => `${a.type}:${a.value}`).join(', ')}\n`;
      }
    });
    return text;
  };

  return (
    <div className="space-y-2">
      {workflows.map((wf, index) => {
        const id = `wf-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <div key={id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <button
                onClick={() => toggleItem(id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-left"
              >
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-medium text-gray-800">{wf.tableName}</span>
                <span className="text-xs text-gray-500 ml-auto">{wf.states.length}状態 {wf.transitions.length}遷移</span>
              </button>
              <CopyButton text={formatWorkflowAsText(wf)} className="mr-2" />
            </div>
            {isExpanded && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <h4 className="text-xs font-medium text-gray-500 mb-2">状態</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {wf.states.map((state, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded ${
                        state.isInitial
                          ? 'bg-green-100 text-green-700'
                          : state.isFinal
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {state.name}
                      {state.isInitial && ' (開始)'}
                      {state.isFinal && ' (終了)'}
                    </span>
                  ))}
                </div>
                <h4 className="text-xs font-medium text-gray-500 mb-2">遷移</h4>
                <div className="space-y-2">
                  {wf.transitions.map((t, i) => (
                    <div key={i} className="text-sm bg-gray-50 rounded p-2">
                      <div>
                        <span className="font-mono text-indigo-600">{t.fromState}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono text-green-600">{t.toState}</span>
                        <span className="text-gray-600 ml-2">: {t.action}</span>
                      </div>
                      {t.assignees.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          担当: {t.assignees.map(a => `${a.type}:${a.value}`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {workflows.length === 0 && <p className="text-gray-300 text-center py-8">ワークフローがありません</p>}
    </div>
  );
}
