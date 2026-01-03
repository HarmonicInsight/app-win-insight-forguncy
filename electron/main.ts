import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { analyzeProject } from './ipc/analyzer';
import { reviewProject } from './ipc/reviewer';
import { generateSpecDocument, generateReviewDocument } from './ipc/generator';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Forguncy Analyzer',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    // 本番環境ではDevToolsを無効化
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// ファイル選択ダイアログ
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Forguncy Project', extensions: ['fgcp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

// 出力フォルダ選択
ipcMain.handle('select-output-folder', async () => {
  const defaultPath = store.get('outputFolder', app.getPath('documents')) as string;
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath,
  });
  if (!result.canceled && result.filePaths[0]) {
    store.set('outputFolder', result.filePaths[0]);
    return result.filePaths[0];
  }
  return null;
});

// 設定取得
ipcMain.handle('get-settings', () => {
  return {
    outputFolder: store.get('outputFolder', app.getPath('documents')),
    options: store.get('options', {
      generateSpec: true,
      codeReview: true,
      orgAnalysis: true,
      fixGuide: true,
    }),
  };
});

// 設定保存
ipcMain.handle('save-settings', (_event, settings) => {
  store.set('outputFolder', settings.outputFolder);
  store.set('options', settings.options);
  return true;
});

// プロジェクト解析
ipcMain.handle('analyze-project', async (event, filePath: string, options: AnalysisOptions) => {
  try {
    const sendProgress = (progress: number, message: string) => {
      event.sender.send('analysis-progress', { progress, message });
    };

    sendProgress(5, 'プロジェクトファイルを読み込んでいます...');

    // 1. 解析
    sendProgress(10, 'プロジェクト構造を解析しています...');
    const analysisResult = await analyzeProject(filePath, sendProgress);

    // 2. コードレビュー（オプション）
    let reviewResult = null;
    if (options.codeReview) {
      sendProgress(50, 'コードレビューを実行しています...');
      reviewResult = reviewProject(analysisResult);
    }

    // 3. 出力フォルダの準備
    const outputFolder = store.get('outputFolder', app.getPath('documents')) as string;
    const projectName = analysisResult.projectName || 'ForguncyProject';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(outputFolder, `${projectName}_${timestamp}`);

    // 4. ドキュメント生成
    const generatedFiles: string[] = [];

    if (options.generateSpec) {
      sendProgress(70, '仕様書を生成しています...');
      const specPath = await generateSpecDocument(analysisResult, outputDir);
      generatedFiles.push(specPath);
    }

    if (options.codeReview && reviewResult) {
      sendProgress(85, 'レビューレポートを生成しています...');
      const reviewPath = await generateReviewDocument(reviewResult, outputDir);
      generatedFiles.push(reviewPath);
    }

    sendProgress(100, '完了しました');

    return {
      success: true,
      analysisResult,
      reviewResult,
      outputDir,
      generatedFiles,
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '解析中にエラーが発生しました',
    };
  }
});

// フォルダを開く
ipcMain.handle('open-folder', async (_event, folderPath: string) => {
  await shell.openPath(folderPath);
});

// ファイルを開く
ipcMain.handle('open-file', async (_event, filePath: string) => {
  await shell.openPath(filePath);
});

// 型定義
interface AnalysisOptions {
  generateSpec: boolean;
  codeReview: boolean;
  orgAnalysis: boolean;
  fixGuide: boolean;
}
