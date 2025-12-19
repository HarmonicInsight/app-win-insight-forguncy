const { analyzeProject } = require('./dist/electron/ipc/analyzer');
const fs = require('fs');
const path = require('path');

async function testAll() {
  const samplesDir = './samples';
  const files = fs.readdirSync(samplesDir).filter(f => f.endsWith('.fgcp'));

  console.log('=== 全ファイルテスト ===\n');

  for (const file of files) {
    const filePath = path.join(samplesDir, file);
    console.log(`\n--- ${file} ---`);

    try {
      const result = await analyzeProject(filePath);
      const buttonCount = result.pages.reduce((s, p) => s + p.buttons.length, 0);
      console.log(`  テーブル: ${result.summary.tableCount}件`);
      console.log(`  ページ: ${result.summary.pageCount}件`);
      console.log(`  ワークフロー: ${result.summary.workflowCount}件`);
      console.log(`  サーバーコマンド: ${result.summary.serverCommandCount}件`);
      console.log(`  ボタン総数: ${buttonCount}件`);
    } catch (error) {
      console.log(`  エラー: ${error.message}`);
    }
  }
}

testAll();
