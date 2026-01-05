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
      className={`p-1.5 rounded-md hover:bg-surface-tertiary transition-colors ${className}`}
      title="コピー"
    >
      {copied ? (
        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
    },
    {
      key: 'pages',
      label: '画面',
      count: hideEmptyPages ? pagesWithContent.length : analysisResult.pages.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'serverCommands',
      label: 'サーバーコマンド',
      count: analysisResult.serverCommands.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'workflows',
      label: 'ワークフロー',
      count: analysisResult.workflows.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-[560px] border border-border rounded-lg overflow-hidden select-text bg-surface-primary">
      {/* Sidebar */}
      <div className="w-52 bg-surface-secondary border-r border-border flex-shrink-0">
        <div className="p-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2.5 rounded-md transition-colors ${
                activeSection === section.key
                  ? 'bg-accent-light text-accent font-medium'
                  : 'text-content-secondary hover:bg-surface-tertiary hover:text-content-primary'
              }`}
            >
              {section.icon}
              <span className="flex-1">{section.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activeSection === section.key
                  ? 'bg-accent/10 text-accent'
                  : 'bg-surface-tertiary text-content-muted'
              }`}>
                {section.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
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

// Expandable Item Component
function ExpandableItem({
  id: _id,
  title,
  subtitle,
  badge,
  isExpanded,
  onToggle,
  onCopy,
  muted,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      muted ? 'border-border-light' : 'border-border'
    }`}>
      <div className={`flex items-center transition-colors ${
        muted ? 'bg-surface-secondary/50' : 'bg-surface-secondary hover:bg-surface-tertiary'
      }`}>
        <button
          onClick={onToggle}
          className="flex-1 px-4 py-3 flex items-center gap-3 text-left"
        >
          <svg
            className={`w-4 h-4 text-content-muted transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={`text-sm font-medium ${muted ? 'text-content-muted' : 'text-content-primary'}`}>
            {title}
          </span>
          {badge}
          {subtitle && (
            <span className={`text-xs ml-auto ${muted ? 'text-content-muted/60' : 'text-content-muted'}`}>
              {subtitle}
            </span>
          )}
        </button>
        {onCopy && !muted && <CopyButton text={onCopy} className="mr-2" />}
      </div>
      {isExpanded && (
        <div className="border-t border-border-light bg-surface-primary p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Section Header
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-medium text-content-muted uppercase tracking-wider mb-2">
      {children}
    </h4>
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

  if (tables.length === 0) {
    return <EmptyState message="テーブルがありません" />;
  }

  return (
    <div className="space-y-2">
      {tables.map((table, index) => {
        const id = `table-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <ExpandableItem
            key={id}
            id={id}
            title={table.name}
            subtitle={`${table.columns.length}列`}
            isExpanded={isExpanded}
            onToggle={() => toggleItem(id)}
            onCopy={formatTableAsText(table)}
          >
            <SectionHeader>カラム</SectionHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-content-muted border-b border-border-light">
                    <th className="pb-2 font-medium">名前</th>
                    <th className="pb-2 font-medium">型</th>
                    <th className="pb-2 font-medium w-16">必須</th>
                    <th className="pb-2 font-medium w-20">ユニーク</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col, i) => (
                    <tr key={i} className="border-b border-border-light last:border-0">
                      <td className="py-2 font-mono text-accent text-sm">{col.name}</td>
                      <td className="py-2 text-content-secondary">{col.type}</td>
                      <td className="py-2">{col.required && <span className="text-warning">●</span>}</td>
                      <td className="py-2">{col.unique && <span className="text-accent">●</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.relations.length > 0 && (
              <div className="mt-4">
                <SectionHeader>リレーション</SectionHeader>
                <div className="space-y-1.5">
                  {table.relations.map((rel, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-accent">{rel.sourceColumn}</span>
                      <svg className="w-4 h-4 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-mono text-success">{rel.targetTable}.{rel.targetColumn}</span>
                      <span className="text-2xs text-content-muted bg-surface-secondary px-1.5 py-0.5 rounded">
                        {rel.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ExpandableItem>
        );
      })}
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
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex items-center gap-2 pb-3 border-b border-border-light">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-content-secondary">
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={onToggleHideEmpty}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
          />
          空の画面を非表示
        </label>
        {emptyCount > 0 && (
          <span className="text-xs text-content-muted">({emptyCount}件)</span>
        )}
      </div>

      {filteredPages.length === 0 ? (
        <EmptyState message="画面がありません" />
      ) : (
        <div className="space-y-2">
          {filteredPages.map((page, index) => {
            const id = `page-${index}`;
            const isExpanded = expandedItems.has(id);
            const hasContent = page.buttons.length > 0 || page.formulas.length > 0;

            const subtitle = hasContent
              ? [
                  page.buttons.length > 0 && `${page.buttons.length}ボタン`,
                  page.formulas.length > 0 && `${page.formulas.length}数式`,
                ].filter(Boolean).join(' ')
              : 'コンテンツなし';

            return (
              <ExpandableItem
                key={id}
                id={id}
                title={page.name}
                subtitle={subtitle}
                badge={page.type === 'masterPage' ? (
                  <span className="text-2xs bg-accent-light text-accent px-1.5 py-0.5 rounded font-medium">
                    マスター
                  </span>
                ) : undefined}
                isExpanded={isExpanded}
                onToggle={() => toggleItem(id)}
                onCopy={hasContent ? formatPageAsText(page) : undefined}
                muted={!hasContent}
              >
                {page.buttons.length > 0 && (
                  <div className="mb-4">
                    <SectionHeader>ボタン</SectionHeader>
                    <div className="space-y-2">
                      {page.buttons.map((btn, i) => (
                        <div key={i} className="bg-surface-secondary rounded-md p-3">
                          <div className="text-sm font-medium text-content-primary">{btn.name}</div>
                          {btn.commands.length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {btn.commands.map((cmd, j) => (
                                <div key={j} className="text-xs text-content-secondary">
                                  • {cmd.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {page.formulas.length > 0 && (
                  <div>
                    <SectionHeader>数式</SectionHeader>
                    <div className="space-y-1 max-h-40 overflow-auto">
                      {page.formulas.slice(0, 10).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-accent">{f.cell}</span>
                          <span className="text-content-muted">=</span>
                          <span className="font-mono text-xs text-content-secondary truncate">{f.formula}</span>
                        </div>
                      ))}
                      {page.formulas.length > 10 && (
                        <div className="text-xs text-content-muted pt-1">
                          他{page.formulas.length - 10}件...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!hasContent && (
                  <p className="text-sm text-content-muted italic">コンテンツなし</p>
                )}
              </ExpandableItem>
            );
          })}
        </div>
      )}
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

  if (commands.length === 0) {
    return <EmptyState message="サーバーコマンドがありません" />;
  }

  return (
    <div className="space-y-2">
      {commands.map((cmd, index) => {
        const id = `cmd-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <ExpandableItem
            key={id}
            id={id}
            title={cmd.name}
            subtitle={`${cmd.commands.length}行`}
            isExpanded={isExpanded}
            onToggle={() => toggleItem(id)}
            onCopy={formatCommandAsText(cmd)}
          >
            {cmd.parameters && cmd.parameters.length > 0 && (
              <div className="mb-4">
                <SectionHeader>パラメータ</SectionHeader>
                <div className="flex flex-wrap gap-2">
                  {cmd.parameters.map((p, i) => (
                    <span key={i} className="text-xs bg-accent-light text-accent px-2 py-1 rounded font-mono">
                      {p.name}: {p.type}
                      {p.required && <span className="text-error ml-0.5">*</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionHeader>処理内容</SectionHeader>
                <CopyButton text={cmd.commands.join('\n')} />
              </div>
              <pre className="bg-content-primary text-content-inverse p-3 rounded-lg text-xs overflow-auto max-h-60 font-mono leading-relaxed">
                {cmd.commands.slice(0, 30).join('\n')}
                {cmd.commands.length > 30 && `\n\n... 他${cmd.commands.length - 30}行`}
              </pre>
            </div>
          </ExpandableItem>
        );
      })}
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

  if (workflows.length === 0) {
    return <EmptyState message="ワークフローがありません" />;
  }

  return (
    <div className="space-y-2">
      {workflows.map((wf, index) => {
        const id = `wf-${index}`;
        const isExpanded = expandedItems.has(id);
        return (
          <ExpandableItem
            key={id}
            id={id}
            title={wf.tableName}
            subtitle={`${wf.states.length}状態 ${wf.transitions.length}遷移`}
            isExpanded={isExpanded}
            onToggle={() => toggleItem(id)}
            onCopy={formatWorkflowAsText(wf)}
          >
            <div className="mb-4">
              <SectionHeader>状態</SectionHeader>
              <div className="flex flex-wrap gap-2">
                {wf.states.map((state, i) => (
                  <span
                    key={i}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      state.isInitial
                        ? 'bg-success-light text-success'
                        : state.isFinal
                        ? 'bg-error-light text-error'
                        : 'bg-surface-tertiary text-content-secondary'
                    }`}
                  >
                    {state.name}
                    {state.isInitial && ' (開始)'}
                    {state.isFinal && ' (終了)'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <SectionHeader>遷移</SectionHeader>
              <div className="space-y-2">
                {wf.transitions.map((t, i) => (
                  <div key={i} className="bg-surface-secondary rounded-md p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-accent">{t.fromState}</span>
                      <svg className="w-4 h-4 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className="font-mono text-success">{t.toState}</span>
                      <span className="text-content-secondary ml-1">: {t.action}</span>
                    </div>
                    {t.assignees.length > 0 && (
                      <div className="text-xs text-content-muted mt-1.5">
                        担当: {t.assignees.map(a => `${a.type}:${a.value}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ExpandableItem>
        );
      })}
    </div>
  );
}

// Empty State
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-content-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-content-muted">{message}</p>
    </div>
  );
}
