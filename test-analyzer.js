// 解析テストスクリプト
const { analyzeProject } = require('./dist/electron/ipc/analyzer');

async function test() {
  const testFile = './samples/APM_20251217_1.fgcp';

  console.log('=== Forguncy Analyzer Pro テスト ===\n');
  console.log(`ファイル: ${testFile}\n`);

  try {
    const result = await analyzeProject(testFile, (progress, message) => {
      console.log(`[${progress}%] ${message}`);
    });

    console.log('\n=== 解析結果 ===\n');
    console.log(`プロジェクト名: ${result.projectName}`);
    console.log(`テーブル数: ${result.summary.tableCount}`);
    console.log(`ページ数: ${result.summary.pageCount}`);
    console.log(`ワークフロー数: ${result.summary.workflowCount}`);
    console.log(`サーバーコマンド数: ${result.summary.serverCommandCount}`);
    console.log(`総カラム数: ${result.summary.totalColumns}`);
    console.log(`リレーション数: ${result.summary.totalRelations}`);

    console.log('\n=== テーブル一覧（最初の5件）===\n');
    result.tables.slice(0, 5).forEach((t, i) => {
      console.log(`${i + 1}. ${t.name} (${t.folder}) - ${t.columns.length}カラム`);
    });

    console.log('\n=== ページ一覧（最初の5件）===\n');
    result.pages.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.type}) - ボタン${p.buttons.length}件, 数式${p.formulas.length}件`);
    });

    console.log('\n=== サーバーコマンド ===\n');
    result.serverCommands.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name}`);
      console.log(`   パラメータ: ${c.parameters.map(p => p.name).join(', ') || 'なし'}`);
      console.log(`   コマンド行数: ${c.commands.length}`);
    });

    console.log('\n=== テスト成功 ===');
  } catch (error) {
    console.error('エラー:', error);
  }
}

test();
