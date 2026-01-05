import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  TableOfContents,
  StyleLevel,
  ShadingType,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import {
  AnalysisResult,
  ReviewResult,
  TableInfo,
  PageInfo,
  WorkflowInfo,
  ServerCommandInfo,
  ReviewIssue,
} from './types';

/**
 * 仕様書ドキュメントを生成
 */
export async function generateSpecDocument(
  analysis: AnalysisResult,
  outputDir: string
): Promise<string> {
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Yu Gothic', size: 22 },
          paragraph: { spacing: { after: 120, line: 276 } },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Yu Gothic', size: 32, bold: true },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Yu Gothic', size: 28, bold: true },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          run: { font: 'Yu Gothic', size: 24, bold: true },
          paragraph: { spacing: { before: 160, after: 80 } },
        },
      ],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${analysis.projectName} - システム仕様書`,
                    size: 18,
                    color: '666666',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'ページ ', size: 18 }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                  }),
                  new TextRun({ text: ' / ', size: 18 }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // タイトル
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `${analysis.projectName}`,
                bold: true,
                size: 48,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
            children: [
              new TextRun({
                text: 'システム仕様書',
                size: 36,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `生成日: ${new Date().toLocaleDateString('ja-JP')}`,
                size: 22,
                color: '666666',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Forguncy Insight により自動生成',
                size: 20,
                italics: true,
                color: '888888',
              }),
            ],
          }),

          // 目次
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '目次' })],
          }),
          new TableOfContents('目次', {
            hyperlink: true,
            headingStyleRange: '1-3',
          }),

          // 1. システム概要
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '1. システム概要' })],
          }),
          ...generateSystemOverview(analysis),

          // 2. テーブル定義
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '2. テーブル定義' })],
          }),
          ...generateTableDefinitions(analysis.tables),

          // 3. 画面一覧
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '3. 画面一覧' })],
          }),
          ...generatePageList(analysis.pages),

          // 4. ワークフロー定義
          ...(analysis.workflows.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  pageBreakBefore: true,
                  children: [new TextRun({ text: '4. ワークフロー定義' })],
                }),
                ...generateWorkflowDefinitions(analysis.workflows),
              ]
            : []),

          // 5. サーバーコマンド
          ...(analysis.serverCommands.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  pageBreakBefore: true,
                  children: [
                    new TextRun({ text: '5. サーバーコマンド（ビジネスロジック）' }),
                  ],
                }),
                ...generateServerCommands(analysis.serverCommands),
              ]
            : []),

          // 6. ER図
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '6. ER図（Mermaid形式）' })],
          }),
          ...generateERDiagram(analysis.tables),
        ],
      },
    ],
  });

  const filePath = path.join(outputDir, `${analysis.projectName}_仕様書.docx`);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

/**
 * システム概要セクションを生成
 */
function generateSystemOverview(analysis: AnalysisResult): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '1.1 プロジェクト概要' })],
    })
  );

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['項目', '値'], true),
      createTableRow(['プロジェクト名', analysis.projectName]),
      createTableRow(['テーブル数', `${analysis.summary.tableCount}件`]),
      createTableRow(['ページ数', `${analysis.summary.pageCount}件`]),
      createTableRow(['ワークフロー数', `${analysis.summary.workflowCount}件`]),
      createTableRow(['サーバーコマンド数', `${analysis.summary.serverCommandCount}件`]),
      createTableRow(['総カラム数', `${analysis.summary.totalColumns}件`]),
      createTableRow(['リレーション数', `${analysis.summary.totalRelations}件`]),
    ],
  });

  paragraphs.push(summaryTable);

  return paragraphs;
}

/**
 * テーブル定義セクションを生成
 */
function generateTableDefinitions(tables: TableInfo[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // テーブル一覧
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '2.1 テーブル一覧' })],
    })
  );

  const listTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['No.', 'テーブル名', 'フォルダ', 'カラム数', 'リレーション'], true),
      ...tables.map((t, i) =>
        createTableRow([
          String(i + 1),
          t.name,
          t.folder || '-',
          String(t.columns.length),
          String(t.relations.length),
        ])
      ),
    ],
  });

  elements.push(listTable);

  // 各テーブルの詳細
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '2.2 テーブル詳細' })],
    })
  );

  for (const table of tables) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: `${table.name}` })],
      })
    );

    // カラム定義
    const columnTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['カラム名', 'データ型', '必須', 'ユニーク', 'デフォルト値'], true),
        ...table.columns.map((c) =>
          createTableRow([
            c.name,
            c.type,
            c.required ? '○' : '',
            c.unique ? '○' : '',
            c.defaultValue || '',
          ])
        ),
      ],
    });

    elements.push(columnTable);

    // リレーション
    if (table.relations.length > 0) {
      elements.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [new TextRun({ text: 'リレーション:', bold: true })],
        })
      );

      const relationTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          createTableRow(['種別', 'ソースカラム', '参照先テーブル', '参照先カラム'], true),
          ...table.relations.map((r) =>
            createTableRow([r.type, r.sourceColumn, r.targetTable, r.targetColumn])
          ),
        ],
      });

      elements.push(relationTable);
    }

    elements.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  return elements;
}

/**
 * 画面一覧セクションを生成
 */
function generatePageList(pages: PageInfo[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // 画面一覧テーブル
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '3.1 画面一覧' })],
    })
  );

  const pageTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['No.', '画面名', '種別', 'ボタン数', '数式数'], true),
      ...pages.map((p, i) =>
        createTableRow([
          String(i + 1),
          p.name,
          p.type === 'masterPage' ? 'マスターページ' : 'ページ',
          String(p.buttons.length),
          String(p.formulas.length),
        ])
      ),
    ],
  });

  elements.push(pageTable);

  // 画面詳細
  const pagesWithButtons = pages.filter((p) => p.buttons.length > 0 || p.formulas.length > 0);

  if (pagesWithButtons.length > 0) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.2 画面詳細' })],
      })
    );

    for (const page of pagesWithButtons) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: page.name })],
        })
      );

      // ボタン一覧
      if (page.buttons.length > 0) {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: 'ボタン:', bold: true })],
          })
        );

        for (const button of page.buttons) {
          elements.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({ text: `${button.name}` }),
                new TextRun({
                  text: ` (${button.commands.length}個のコマンド)`,
                  color: '666666',
                }),
              ],
            })
          );

          for (const cmd of button.commands) {
            elements.push(
              new Paragraph({
                indent: { left: 720 },
                children: [
                  new TextRun({ text: `• ${cmd.description}`, size: 20, color: '333333' }),
                ],
              })
            );
          }
        }
      }

      // 数式一覧
      if (page.formulas.length > 0) {
        elements.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [new TextRun({ text: '数式:', bold: true })],
          })
        );

        const formulaTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['セル', '数式'], true),
            ...page.formulas.slice(0, 20).map((f) => createTableRow([f.cell, f.formula])),
          ],
        });

        elements.push(formulaTable);

        if (page.formulas.length > 20) {
          elements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `※ 他${page.formulas.length - 20}件の数式があります`,
                  italics: true,
                  color: '666666',
                }),
              ],
            })
          );
        }
      }
    }
  }

  return elements;
}

/**
 * ワークフロー定義セクションを生成
 */
function generateWorkflowDefinitions(workflows: WorkflowInfo[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  for (const wf of workflows) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `ワークフロー: ${wf.tableName}` })],
      })
    );

    // 状態一覧
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: '状態一覧' })],
      })
    );

    const stateTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['状態名', '初期状態', '終了状態'], true),
        ...wf.states.map((s) =>
          createTableRow([s.name, s.isInitial ? '○' : '', s.isFinal ? '○' : ''])
        ),
      ],
    });

    elements.push(stateTable);

    // 遷移一覧
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: '遷移一覧' })],
      })
    );

    const transitionTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['アクション', '遷移元', '遷移先', '担当者'], true),
        ...wf.transitions.map((t) =>
          createTableRow([
            t.action,
            t.fromState,
            t.toState,
            t.assignees.map((a) => `${a.type}: ${a.value}`).join(', ') || '未設定',
          ])
        ),
      ],
    });

    elements.push(transitionTable);

    // Mermaidフロー図
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'フロー図（Mermaid形式）' })],
      })
    );

    const mermaidCode = generateWorkflowMermaid(wf);
    elements.push(
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
        children: [
          new TextRun({
            text: mermaidCode,
            font: 'Consolas',
            size: 18,
          }),
        ],
      })
    );
  }

  return elements;
}

/**
 * ワークフローのMermaid図を生成
 */
function generateWorkflowMermaid(wf: WorkflowInfo): string {
  const lines: string[] = ['stateDiagram-v2'];

  for (const state of wf.states) {
    if (state.isInitial) {
      lines.push(`  [*] --> ${sanitizeMermaidId(state.name)}`);
    }
    if (state.isFinal) {
      lines.push(`  ${sanitizeMermaidId(state.name)} --> [*]`);
    }
  }

  for (const trans of wf.transitions) {
    const from = sanitizeMermaidId(trans.fromState);
    const to = sanitizeMermaidId(trans.toState);
    lines.push(`  ${from} --> ${to}: ${trans.action}`);
  }

  return lines.join('\n');
}

function sanitizeMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_');
}

/**
 * サーバーコマンドセクションを生成
 */
function generateServerCommands(commands: ServerCommandInfo[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // コマンド一覧
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '5.1 サーバーコマンド一覧' })],
    })
  );

  const listTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['No.', 'コマンド名', 'フォルダ', 'パラメータ数', '行数'], true),
      ...commands.map((c, i) =>
        createTableRow([
          String(i + 1),
          c.name,
          c.folder || '-',
          String(c.parameters?.length || 0),
          String(c.commands.length),
        ])
      ),
    ],
  });

  elements.push(listTable);

  // コマンド詳細
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: '5.2 サーバーコマンド詳細' })],
    })
  );

  for (const cmd of commands) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: cmd.name })],
      })
    );

    // パラメータ
    if (cmd.parameters && cmd.parameters.length > 0) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: 'パラメータ:', bold: true })],
        })
      );

      const paramTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          createTableRow(['パラメータ名', 'データ型', '必須', 'デフォルト値'], true),
          ...cmd.parameters.map((p) =>
            createTableRow([p.name, p.type, p.required ? '○' : '', p.defaultValue || ''])
          ),
        ],
      });

      elements.push(paramTable);
    }

    // 処理内容
    elements.push(
      new Paragraph({
        spacing: { before: 100 },
        children: [new TextRun({ text: '処理内容:', bold: true })],
      })
    );

    // コード表示（最大50行）
    const displayLines = cmd.commands.slice(0, 50);
    elements.push(
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'F8F8F8' },
        spacing: { after: 100 },
        children: displayLines.map(
          (line, i) =>
            new TextRun({
              text: line + (i < displayLines.length - 1 ? '\n' : ''),
              font: 'Consolas',
              size: 18,
            })
        ),
      })
    );

    if (cmd.commands.length > 50) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `※ 他${cmd.commands.length - 50}行の処理があります`,
              italics: true,
              color: '666666',
            }),
          ],
        })
      );
    }
  }

  return elements;
}

/**
 * ER図セクションを生成
 */
function generateERDiagram(tables: TableInfo[]): Paragraph[] {
  const elements: Paragraph[] = [];

  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '以下のMermaid記法をMermaid Live Editor等で表示できます。',
          italics: true,
          color: '666666',
        }),
      ],
    })
  );

  const mermaidLines: string[] = ['erDiagram'];

  for (const table of tables) {
    // テーブル定義
    mermaidLines.push(`  ${sanitizeMermaidId(table.name)} {`);
    for (const col of table.columns.slice(0, 10)) {
      const type = col.type.toLowerCase().replace(/[^a-z]/g, '');
      const pk = col.name.toLowerCase() === 'id' ? 'PK' : '';
      const req = col.required ? 'NOT_NULL' : '';
      mermaidLines.push(`    ${type} ${sanitizeMermaidId(col.name)} ${pk} ${req}`.trim());
    }
    if (table.columns.length > 10) {
      mermaidLines.push(`    string _more_columns "..."`);
    }
    mermaidLines.push('  }');
  }

  // リレーション
  for (const table of tables) {
    for (const rel of table.relations) {
      const from = sanitizeMermaidId(table.name);
      const to = sanitizeMermaidId(rel.targetTable);
      const relType = rel.type.includes('Many') ? '}o--||' : '||--||';
      mermaidLines.push(`  ${from} ${relType} ${to} : "${rel.sourceColumn}"`);
    }
  }

  elements.push(
    new Paragraph({
      shading: { type: ShadingType.SOLID, color: 'F5F5F5' },
      children: [
        new TextRun({
          text: mermaidLines.join('\n'),
          font: 'Consolas',
          size: 18,
        }),
      ],
    })
  );

  return elements;
}

/**
 * テーブル行を作成するヘルパー関数
 */
function createTableRow(cells: string[], isHeader: boolean = false): TableRow {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          shading: isHeader
            ? { type: ShadingType.SOLID, color: '4472C4' }
            : undefined,
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: isHeader,
                  color: isHeader ? 'FFFFFF' : '000000',
                  size: 20,
                }),
              ],
            }),
          ],
        })
    ),
  });
}

/**
 * レビューレポートを生成
 */
export async function generateReviewDocument(
  review: ReviewResult,
  outputDir: string
): Promise<string> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Yu Gothic', size: 22 },
          paragraph: { spacing: { after: 120, line: 276 } },
        },
      ],
    },
    sections: [
      {
        children: [
          // タイトル
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: 'コードレビューレポート',
                bold: true,
                size: 48,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: `生成日: ${new Date().toLocaleDateString('ja-JP')}`,
                size: 22,
                color: '666666',
              }),
            ],
          }),

          // サマリー
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: '1. サマリー' })],
          }),
          ...generateReviewSummary(review),

          // 問題一覧
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            children: [new TextRun({ text: '2. 検出された問題' })],
          }),
          ...generateIssueList(review.issues),

          // 組織変更影響
          ...(review.orgImpact
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  pageBreakBefore: true,
                  children: [new TextRun({ text: '3. 組織変更影響分析' })],
                }),
                ...generateOrgImpactSection(review),
              ]
            : []),
        ],
      },
    ],
  });

  const filePath = path.join(outputDir, 'コードレビューレポート.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  return filePath;
}

/**
 * レビューサマリーを生成
 */
function generateReviewSummary(review: ReviewResult): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['重要度', '件数'], true),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'FFCCCC' },
            children: [new Paragraph({ children: [new TextRun({ text: 'HIGH（高）', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${review.summary.high}件` })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'FFEECC' },
            children: [new Paragraph({ children: [new TextRun({ text: 'MEDIUM（中）', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${review.summary.medium}件` })] })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'FFFFCC' },
            children: [new Paragraph({ children: [new TextRun({ text: 'LOW（低）', bold: true })] })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${review.summary.low}件` })] })],
          }),
        ],
      }),
      createTableRow(['合計', `${review.summary.total}件`]),
    ],
  });

  elements.push(summaryTable);

  // カテゴリ別
  elements.push(
    new Paragraph({
      spacing: { before: 200 },
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'カテゴリ別件数' })],
    })
  );

  const categoryLabels: Record<string, string> = {
    security: 'セキュリティ',
    bug: 'バグリスク',
    performance: 'パフォーマンス',
    maintainability: '保守性',
    workflow: 'ワークフロー',
    organization: '組織',
  };

  const categoryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow(['カテゴリ', '件数'], true),
      ...Object.entries(review.summary.byCategory)
        .filter(([, count]) => count > 0)
        .map(([cat, count]) => createTableRow([categoryLabels[cat] || cat, `${count}件`])),
    ],
  });

  elements.push(categoryTable);

  return elements;
}

/**
 * 問題一覧を生成
 */
function generateIssueList(issues: ReviewIssue[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sortedIssues = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const severityLabels = { high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };
  const severityColors = { high: 'CC0000', medium: 'CC6600', low: '666600' };

  for (const issue of sortedIssues) {
    elements.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [
          new TextRun({
            text: `[${severityLabels[issue.severity]}] `,
            bold: true,
            color: severityColors[issue.severity],
          }),
          new TextRun({
            text: issue.title,
            bold: true,
          }),
        ],
      })
    );

    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: '場所: ', bold: true }),
          new TextRun({ text: issue.location }),
        ],
      })
    );

    elements.push(
      new Paragraph({
        children: [new TextRun({ text: issue.description })],
      })
    );

    if (issue.code) {
      elements.push(
        new Paragraph({
          shading: { type: ShadingType.SOLID, color: 'F8F8F8' },
          children: [
            new TextRun({
              text: issue.code,
              font: 'Consolas',
              size: 18,
            }),
          ],
        })
      );
    }

    if (issue.suggestion) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({ text: '推奨対応: ', bold: true, color: '006600' }),
            new TextRun({ text: issue.suggestion }),
          ],
        })
      );
    }
  }

  return elements;
}

/**
 * 組織変更影響セクションを生成
 */
function generateOrgImpactSection(review: ReviewResult): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const impact = review.orgImpact!;

  // ハードコードされたユーザー
  if (impact.hardcodedUsers.length > 0) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.1 ハードコードされたユーザーID' })],
      })
    );

    const userTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['ユーザーID', '場所', 'コンテキスト'], true),
        ...impact.hardcodedUsers.map((u) => createTableRow([u.value, u.location, u.context])),
      ],
    });

    elements.push(userTable);
  }

  // ハードコードされたメールアドレス
  if (impact.hardcodedEmails.length > 0) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.2 ハードコードされたメールアドレス' })],
      })
    );

    const emailTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['メールアドレス', '場所', 'コンテキスト'], true),
        ...impact.hardcodedEmails.map((e) => createTableRow([e.value, e.location, e.context])),
      ],
    });

    elements.push(emailTable);
  }

  // ロール参照
  if (impact.roleReferences.length > 0) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.3 ロール参照箇所' })],
      })
    );

    const roleTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['ロール名', '場所', '用途'], true),
        ...impact.roleReferences.map((r) => createTableRow([r.roleName, r.location, r.usage])),
      ],
    });

    elements.push(roleTable);
  }

  // 承認フロー
  if (impact.approvalFlows.length > 0) {
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.4 承認フロー順序' })],
      })
    );

    const flowTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableRow(['順序', 'ワークフロー', '遷移', '担当者'], true),
        ...impact.approvalFlows.map((f) =>
          createTableRow([String(f.order + 1), f.workflow, f.transition, f.assignees.join(', ')])
        ),
      ],
    });

    elements.push(flowTable);
  }

  return elements;
}
