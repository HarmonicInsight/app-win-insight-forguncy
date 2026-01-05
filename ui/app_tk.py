#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Forguncy Insight - Tkinter UI モジュール

メインアプリケーションUIを提供する。
"""

import os
import queue
import threading
import traceback
import webbrowser
from datetime import datetime
from pathlib import Path
from tkinter import (
    Tk, Frame, Label, Button, Entry, StringVar,
    filedialog, messagebox, ttk, Toplevel, Text, Scrollbar,
    LEFT, RIGHT, BOTH, END, X, Y, W, E, N, S, VERTICAL, HORIZONTAL, WORD
)

from core.logging_setup import logger, get_log_dir
from core.safety_checks import ZipSafetyError, check_zip_safety
from core.models import AnalysisEvent
from core.fgcp_parser import analyze_project, compare_projects
from core.exporters import generate_spec_document, generate_excel_document, generate_diff_excel, EXCEL_AVAILABLE
from licensing.verify import (
    LicenseManager, PRODUCT_NAME, PRODUCT_CODE,
    PURCHASE_URL, TRIAL_URL, PRICE_STANDARD
)


# =============================================================================
# バージョン情報
# =============================================================================
APP_VERSION = "1.1.0"
SUPPORTED_FORGUNCY_VERSIONS = ["9.x"]
VERSION_INFO = f"v{APP_VERSION} (Forguncy {', '.join(SUPPORTED_FORGUNCY_VERSIONS)} 対応)"


# =============================================================================
# ドラッグ＆ドロップサポート
# =============================================================================
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    DND_AVAILABLE = True
except ImportError:
    DND_AVAILABLE = False


# =============================================================================
# GUI - モダンUI設定
# =============================================================================

# カラーパレット
COLORS = {
    "primary": "#3B82F6",        # ブルー
    "primary_hover": "#2563EB",  # ダークブルー
    "success": "#10B981",        # グリーン
    "warning": "#F59E0B",        # オレンジ
    "danger": "#EF4444",         # レッド
    "bg": "#F8FAFC",             # 背景
    "surface": "#FFFFFF",        # カード背景
    "text": "#1E293B",           # メインテキスト
    "text_secondary": "#64748B", # サブテキスト
    "text_muted": "#94A3B8",     # ミュートテキスト
    "border": "#E2E8F0",         # ボーダー
}

# フォント設定
FONT_FAMILY = "Yu Gothic UI"
FONTS = {
    "title": (FONT_FAMILY, 20, "bold"),
    "heading": (FONT_FAMILY, 14, "bold"),
    "body": (FONT_FAMILY, 11),
    "small": (FONT_FAMILY, 10),
}


# =============================================================================
# ライセンス認証ダイアログ
# =============================================================================
class LicenseActivationDialog:
    """ライセンス認証ダイアログ（モダンUI）"""

    def __init__(self, parent: Tk, license_manager: LicenseManager):
        self.parent = parent
        self.license_manager = license_manager
        self.result = False

        self.dialog = Toplevel(parent)
        self.dialog.title("ライセンス管理")
        self.dialog.geometry("500x580")
        self.dialog.resizable(False, False)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        self.dialog.configure(bg=COLORS["bg"])

        # ダイアログを中央に配置
        self.dialog.update_idletasks()
        x = (self.dialog.winfo_screenwidth() - 500) // 2
        y = (self.dialog.winfo_screenheight() - 580) // 2
        self.dialog.geometry(f"500x580+{x}+{y}")

        # アクティベート状態に応じてUIを切り替え
        if self.license_manager.is_activated:
            self.setup_status_ui()
        else:
            self.setup_activate_ui()

        # 閉じるボタンの処理
        self.dialog.protocol("WM_DELETE_WINDOW", self.on_close)

    def setup_status_ui(self):
        """アクティベート済みの場合：ステータス表示UI"""
        card = Frame(self.dialog, bg=COLORS["surface"], padx=40, pady=30)
        card.pack(fill='both', expand=True, padx=20, pady=20)

        # タイトル
        Label(card, text=PRODUCT_NAME, font=FONTS["title"],
              bg=COLORS["surface"], fg=COLORS["primary"]).pack(pady=(0, 5))
        Label(card, text="ライセンス情報", font=FONTS["heading"],
              bg=COLORS["surface"], fg=COLORS["text_secondary"]).pack(pady=(0, 25))

        # ステータスカード
        status_frame = Frame(card, bg="#ECFDF5", padx=20, pady=15)
        status_frame.pack(fill='x', pady=10)

        Label(status_frame, text="✓ ライセンス有効", font=FONTS["heading"],
              bg="#ECFDF5", fg=COLORS["success"]).pack(anchor='w')

        # ライセンス詳細
        info_frame = Frame(card, bg=COLORS["bg"], padx=20, pady=15)
        info_frame.pack(fill='x', pady=10)

        details = [
            ("プラン", self.license_manager.tier_name),
            ("メールアドレス", self.license_manager.email or "-"),
            ("有効期限", self.license_manager.expires_at.strftime('%Y年%m月%d日') if self.license_manager.expires_at else "-"),
        ]

        # 残り日数
        days = self.license_manager.days_until_expiry
        if days is not None:
            if days <= 30:
                details.append(("残り日数", f"{days}日 ⚠️"))
            else:
                details.append(("残り日数", f"{days}日"))

        for label_text, value in details:
            row = Frame(info_frame, bg=COLORS["bg"])
            row.pack(fill='x', pady=3)
            Label(row, text=f"{label_text}:", font=FONTS["body"],
                  bg=COLORS["bg"], fg=COLORS["text_secondary"], width=15, anchor='w').pack(side='left')
            Label(row, text=value, font=FONTS["body"],
                  bg=COLORS["bg"], fg=COLORS["text"]).pack(side='left')

        # ライセンスキー（マスク表示）
        if self.license_manager.license_key:
            key = self.license_manager.license_key
            masked_key = key[:9] + "****-****-****"
            row = Frame(info_frame, bg=COLORS["bg"])
            row.pack(fill='x', pady=3)
            Label(row, text="ライセンスキー:", font=FONTS["body"],
                  bg=COLORS["bg"], fg=COLORS["text_secondary"], width=15, anchor='w').pack(side='left')
            Label(row, text=masked_key, font=FONTS["small"],
                  bg=COLORS["bg"], fg=COLORS["text_muted"]).pack(side='left')

        # 期限警告
        if self.license_manager.is_expiring_soon:
            warning_frame = Frame(card, bg="#FEF3C7", padx=15, pady=10)
            warning_frame.pack(fill='x', pady=10)
            Label(warning_frame, text=f"⚠️ {self.license_manager.expiry_warning_message}",
                  font=FONTS["small"], bg="#FEF3C7", fg="#92400E", wraplength=380).pack()

        # ボタンフレーム
        btn_frame = Frame(card, bg=COLORS["surface"])
        btn_frame.pack(pady=20)

        Button(btn_frame, text="閉じる", command=self.on_close,
               bg=COLORS["primary"], fg='white', font=FONTS["body"],
               padx=25, pady=8, relief='flat', cursor='hand2').pack(side='left', padx=5)
        Button(btn_frame, text="ライセンス解除", command=self.on_deactivate,
               bg=COLORS["bg"], fg=COLORS["danger"], font=FONTS["body"],
               padx=15, pady=8, relief='flat', cursor='hand2').pack(side='left', padx=5)

        # 更新リンク
        if self.license_manager.is_expiring_soon:
            renew_link = Label(card, text="ライセンスを更新する", fg=COLORS["primary"],
                               cursor='hand2', font=FONTS["body"], bg=COLORS["surface"])
            renew_link.pack(pady=5)
            renew_link.bind('<Button-1>', lambda e: webbrowser.open(PURCHASE_URL))

    def setup_activate_ui(self):
        """未アクティベートの場合：認証UI"""
        card = Frame(self.dialog, bg=COLORS["surface"], padx=40, pady=30)
        card.pack(fill='both', expand=True, padx=20, pady=20)

        # タイトル
        Label(card, text=PRODUCT_NAME, font=FONTS["title"],
              bg=COLORS["surface"], fg=COLORS["primary"]).pack(pady=(0, 5))
        Label(card, text="ライセンス認証", font=FONTS["heading"],
              bg=COLORS["surface"], fg=COLORS["text_secondary"]).pack(pady=(0, 25))

        # 説明
        desc_text = "製品をご利用いただくには、ライセンスキーの認証が必要です。"
        Label(card, text=desc_text, wraplength=400, justify='left',
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w', pady=(0, 20))

        # メールアドレス
        Label(card, text="メールアドレス:", anchor='w',
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(fill='x')
        self.email_entry = Entry(card, width=50, font=FONTS["body"], relief='solid', bd=1)
        self.email_entry.pack(fill='x', pady=(5, 15), ipady=5)

        # ライセンスキー
        Label(card, text="ライセンスキー:", anchor='w',
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(fill='x')
        self.key_entry = Entry(card, width=50, font=FONTS["body"], relief='solid', bd=1)
        self.key_entry.pack(fill='x', pady=(5, 8), ipady=5)
        Label(card, text="例: FGIN-STD-2601-XXXX-XXXX-XXXX",
              fg=COLORS["text_muted"], font=FONTS["small"], bg=COLORS["surface"]).pack(anchor='w')

        # エラーメッセージ
        self.error_label = Label(card, text="", fg=COLORS["danger"], wraplength=400,
                                  font=FONTS["small"], bg=COLORS["surface"])
        self.error_label.pack(pady=10)

        # ボタンフレーム
        btn_frame = Frame(card, bg=COLORS["surface"])
        btn_frame.pack(pady=15)

        Button(btn_frame, text="認証", command=self.on_activate,
               bg=COLORS["primary"], fg='white', font=FONTS["body"],
               padx=25, pady=8, relief='flat', cursor='hand2').pack(side='left', padx=5)
        Button(btn_frame, text="Free版で続行", command=self.on_continue_free,
               bg=COLORS["bg"], fg=COLORS["text"], font=FONTS["body"],
               padx=15, pady=8, relief='flat', cursor='hand2').pack(side='left', padx=5)

        # リンクフレーム
        link_frame = Frame(card, bg=COLORS["surface"])
        link_frame.pack(pady=10)

        trial_link = Label(link_frame, text="トライアル申請", fg=COLORS["primary"],
                           cursor='hand2', font=FONTS["small"], bg=COLORS["surface"])
        trial_link.pack(side='left', padx=10)
        trial_link.bind('<Button-1>', lambda e: webbrowser.open(TRIAL_URL))

        purchase_link = Label(link_frame, text="ライセンス購入", fg=COLORS["primary"],
                               cursor='hand2', font=FONTS["small"], bg=COLORS["surface"])
        purchase_link.pack(side='left', padx=10)
        purchase_link.bind('<Button-1>', lambda e: webbrowser.open(PURCHASE_URL))

        # 価格表示
        Label(card, text=f"Standard版: {PRICE_STANDARD}",
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text_secondary"]).pack(pady=5)

    def on_activate(self):
        email = self.email_entry.get().strip()
        key = self.key_entry.get().strip()

        if not email:
            self.error_label.config(text="メールアドレスを入力してください")
            return

        if not key:
            self.error_label.config(text="ライセンスキーを入力してください")
            return

        result = self.license_manager.activate(email, key)

        if result['is_valid']:
            self.result = True
            self.dialog.destroy()
            # expires_atがNoneの場合のセーフガード
            expiry_str = self.license_manager.expires_at.strftime('%Y年%m月%d日') if self.license_manager.expires_at else '無期限'
            messagebox.showinfo("認証成功",
                f"ライセンスが正常に認証されました。\n\n"
                f"プラン: {self.license_manager.tier_name}\n"
                f"有効期限: {expiry_str}")
        else:
            self.error_label.config(text=result.get('error', '認証に失敗しました'))

    def on_continue_free(self):
        self.result = True
        self.dialog.destroy()

    def on_close(self):
        """閉じるボタン"""
        self.result = True
        self.dialog.destroy()

    def on_deactivate(self):
        """ライセンス解除"""
        if messagebox.askyesno("確認", "ライセンスを解除しますか？\n解除後はFree版として動作します。"):
            self.license_manager.clear()
            self.result = True  # UI更新が必要
            self.dialog.destroy()
            messagebox.showinfo("完了", "ライセンスが解除されました。")

    def show(self) -> bool:
        self.dialog.wait_window()
        return self.result


# =============================================================================
# メインアプリケーション
# =============================================================================
class ForguncyInsightApp:
    """モダンUI対応のメインアプリケーション"""

    def __init__(self, root: Tk):
        self.root = root
        self.root.title(f"Forguncy Insight {VERSION_INFO}")
        self.root.geometry("800x850")  # ログ表示欄追加のため高さ増加
        self.root.resizable(True, True)
        self.root.configure(bg=COLORS["bg"])

        # DPI対応
        try:
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass

        # 非同期処理用
        self.event_queue = queue.Queue()
        self.analysis_thread = None
        self.is_analyzing = False

        self.license_manager = LicenseManager()
        self.file_path = StringVar()
        self.file_path2 = StringVar()  # 差分比較用
        self.output_dir = StringVar(value=str(Path.home() / "Documents"))

        self.setup_styles()
        self.setup_ui()

        # イベントキューのポーリング開始
        self._poll_event_queue()

        # 起動時ログ
        logger.info(f"アプリケーション起動: {VERSION_INFO}")
        self._log_to_ui(f"Forguncy Insight {VERSION_INFO} 起動完了")
        self._log_to_ui(f"ログファイル: {get_log_dir() / 'app.log'}")

        # 起動時ライセンスチェック（UIセットアップ後）
        if not self.license_manager.is_activated:
            self.root.after(100, self._show_license_dialog)
        else:
            # 期限警告の表示
            self.show_expiry_warning()

    def setup_styles(self):
        """ttkスタイル設定"""
        style = ttk.Style()
        style.configure("TNotebook", background=COLORS["bg"])
        style.configure("TNotebook.Tab", font=FONTS["body"], padding=(15, 8))
        style.configure("TFrame", background=COLORS["surface"])
        style.configure("TLabel", background=COLORS["surface"], font=FONTS["body"])
        style.configure("TCheckbutton", background=COLORS["surface"], font=FONTS["body"])
        style.configure("TProgressbar", thickness=8)

    def _show_license_dialog(self):
        """ライセンスダイアログを表示"""
        dialog = LicenseActivationDialog(self.root, self.license_manager)
        dialog.show()
        # ダイアログ後にUI更新
        self.refresh_ui()
        self._update_license_badge()

    def _update_license_badge(self):
        """ライセンスバッジを更新"""
        tier = self.license_manager.tier
        badge_colors = {
            'TRIAL': (COLORS["warning"], "#FEF3C7"),
            'STD': (COLORS["primary"], "#DBEAFE"),
            'PRO': ("#8B5CF6", "#EDE9FE"),
        }
        if tier and tier in badge_colors:
            fg, bg = badge_colors[tier]
            self.license_badge.config(text=self.license_manager.tier_name, fg=fg, bg=bg)
        else:
            self.license_badge.config(text="Free", fg=COLORS["text_muted"], bg=COLORS["bg"])

    def show_expiry_warning(self):
        """期限警告を表示"""
        if self.license_manager.is_expiring_soon:
            warning_msg = self.license_manager.expiry_warning_message
            if warning_msg:
                messagebox.showwarning("ライセンス期限のお知らせ", warning_msg)

    def setup_ui(self):
        # ヘッダー
        header = Frame(self.root, bg=COLORS["surface"], height=70)
        header.pack(fill='x')
        header.pack_propagate(False)

        header_inner = Frame(header, bg=COLORS["surface"])
        header_inner.pack(fill='x', padx=20, pady=15)

        # タイトル
        title_frame = Frame(header_inner, bg=COLORS["surface"])
        title_frame.pack(side='left')

        Label(title_frame, text="◇ Forguncy Insight", font=FONTS["title"],
              bg=COLORS["surface"], fg=COLORS["primary"]).pack(side='left')

        Label(title_frame, text=f"  {VERSION_INFO}", font=FONTS["small"],
              bg=COLORS["surface"], fg=COLORS["text_muted"]).pack(side='left', padx=(10, 0))

        # ライセンスバッジ
        self.license_badge = Label(title_frame, text="Free", font=FONTS["small"],
                                    padx=10, pady=3, bg=COLORS["bg"], fg=COLORS["text_muted"])
        self.license_badge.pack(side='left', padx=(15, 0))
        self._update_license_badge()

        # ライセンスボタン
        license_btn = Button(header_inner, text="🔑 ライセンス", font=FONTS["small"],
                              bg=COLORS["bg"], fg=COLORS["text"], relief='flat',
                              padx=10, pady=5, cursor='hand2',
                              command=self._show_license_dialog)
        license_btn.pack(side='right')

        # Notebook (タブ)
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=15, pady=(10, 15))

        # タブ1: 解析
        self.tab_analyze = Frame(self.notebook, bg=COLORS["surface"], padx=30, pady=25)
        self.notebook.add(self.tab_analyze, text='  解析  ')
        self.setup_analyze_tab()

        # タブ2: 差分比較
        self.tab_diff = Frame(self.notebook, bg=COLORS["surface"], padx=30, pady=25)
        self.notebook.add(self.tab_diff, text='  差分比較  ')
        self.setup_diff_tab()


    def setup_analyze_tab(self):
        # タイトル
        Label(self.tab_analyze, text="Forguncyプロジェクト解析・仕様書自動生成",
              font=FONTS["heading"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w', pady=(0, 20))

        # ドラッグ＆ドロップエリア
        self.drop_frame = Frame(self.tab_analyze, bg=COLORS["border"], padx=2, pady=2)
        self.drop_frame.pack(fill='x', pady=10)

        self.drop_area = Frame(self.drop_frame, bg="#F1F5F9", height=100)
        self.drop_area.pack(fill='both', expand=True)
        self.drop_area.pack_propagate(False)

        self.drop_label = Label(self.drop_area, text="📂 ここにファイルをドロップ\nまたはクリックして選択 (.fgcp)",
                                 font=FONTS["body"], bg="#F1F5F9", fg=COLORS["text_secondary"],
                                 cursor='hand2')
        self.drop_label.pack(expand=True)

        # ファイルパス表示
        self.file_label = Label(self.tab_analyze, textvariable=self.file_path,
                                 font=FONTS["small"], bg=COLORS["surface"], fg=COLORS["primary"],
                                 wraplength=600)
        self.file_label.pack(anchor='w', pady=(5, 0))

        # クリックイベント
        self.drop_area.bind('<Button-1>', lambda e: self.browse_file())
        self.drop_label.bind('<Button-1>', lambda e: self.browse_file())

        # ドラッグ＆ドロップ対応（tkinterdnd2があれば）
        self._setup_dnd()

        # 出力フォルダ
        output_frame = Frame(self.tab_analyze, bg=COLORS["surface"])
        output_frame.pack(fill='x', pady=10)
        Label(output_frame, text="出力フォルダ:",
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w')
        output_input = Frame(output_frame, bg=COLORS["surface"])
        output_input.pack(fill='x', pady=5)
        Entry(output_input, textvariable=self.output_dir,
              font=FONTS["body"], relief='solid', bd=1).pack(side='left', fill='x', expand=True, ipady=4)
        Button(output_input, text="変更...", command=self.browse_output,
               font=FONTS["body"], bg=COLORS["bg"], fg=COLORS["text"],
               relief='flat', padx=15, cursor='hand2').pack(side='right', padx=(10, 0))

        # 出力形式
        format_frame = Frame(self.tab_analyze, bg=COLORS["surface"])
        format_frame.pack(fill='x', pady=15)
        Label(format_frame, text="出力形式:",
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w')

        self.output_word = ttk.Checkbutton(format_frame, text="Word (.docx)")
        self.output_word.pack(anchor='w', pady=3)
        self.output_word.state(['selected'] if self.license_manager.limits.get('word_export') else ['disabled'])

        self.output_excel = ttk.Checkbutton(format_frame, text="Excel (.xlsx)")
        self.output_excel.pack(anchor='w')
        self.output_excel.state(['selected'] if self.license_manager.limits.get('excel_export') else ['disabled'])

        # プログレス
        progress_frame = Frame(self.tab_analyze, bg=COLORS["surface"])
        progress_frame.pack(fill='x', pady=20)
        self.progress = ttk.Progressbar(progress_frame, mode='determinate')
        self.progress.pack(fill='x')
        self.status_label = Label(progress_frame, text="準備完了",
                                   font=FONTS["small"], bg=COLORS["surface"], fg=COLORS["text_muted"])
        self.status_label.pack(pady=(5, 0))

        # 解析ボタン
        self.analyze_btn = Button(self.tab_analyze, text="解析開始", command=self.start_analysis,
                                   font=FONTS["heading"], bg=COLORS["primary"], fg='white',
                                   padx=40, pady=12, relief='flat', cursor='hand2')
        self.analyze_btn.pack(pady=15)

        # Free版の制限表示
        if not self.license_manager.is_activated:
            limits = self.license_manager.limits
            limit_text = f"Free版制限: テーブル{int(limits['max_tables'])}件, ページ{int(limits['max_pages'])}件, サーバーコマンド{int(limits['max_server_commands'])}件"
            Label(self.tab_analyze, text=limit_text, fg=COLORS["text_muted"],
                  font=FONTS["small"], bg=COLORS["surface"]).pack()

        # ログ表示エリア
        log_frame = Frame(self.tab_analyze, bg=COLORS["surface"])
        log_frame.pack(fill='both', expand=True, pady=(10, 0))

        log_header = Frame(log_frame, bg=COLORS["surface"])
        log_header.pack(fill='x')
        Label(log_header, text="ログ", font=FONTS["small"], bg=COLORS["surface"],
              fg=COLORS["text_muted"]).pack(side='left')
        Button(log_header, text="クリア", font=FONTS["small"], bg=COLORS["bg"],
               fg=COLORS["text_muted"], relief='flat', padx=5,
               command=self._clear_log).pack(side='right')

        log_border = Frame(log_frame, bg=COLORS["border"], padx=1, pady=1)
        log_border.pack(fill='both', expand=True)

        self.log_text = Text(log_border, height=6, font=("Consolas", 9), bg="#FAFAFA",
                             fg=COLORS["text"], wrap=WORD, state='disabled',
                             relief='flat', padx=8, pady=8)
        log_scrollbar = Scrollbar(log_border, orient=VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        log_scrollbar.pack(side='right', fill='y')
        self.log_text.pack(side='left', fill='both', expand=True)

        # ログテキストのタグ設定（色分け用）
        self.log_text.tag_configure('INFO', foreground=COLORS["text"])
        self.log_text.tag_configure('WARNING', foreground=COLORS["warning"])
        self.log_text.tag_configure('ERROR', foreground=COLORS["danger"])

    def setup_diff_tab(self):
        Label(self.tab_diff, text="プロジェクト差分比較", font=FONTS["heading"],
              bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w', pady=(0, 20))

        if not self.license_manager.limits.get('diff_compare'):
            Label(self.tab_diff, text="この機能はStandard版で利用できます",
                  fg=COLORS["danger"], font=FONTS["body"], bg=COLORS["surface"]).pack(pady=20)
            Button(self.tab_diff, text="ライセンスを購入",
                   command=lambda: webbrowser.open(PURCHASE_URL),
                   font=FONTS["body"], bg=COLORS["primary"], fg='white',
                   relief='flat', padx=20, cursor='hand2').pack()
            return

        # ファイル1（比較元）ドロップエリア
        Label(self.tab_diff, text="比較元ファイル (旧バージョン):",
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w')

        drop1_outer = Frame(self.tab_diff, bg=COLORS["border"], padx=2, pady=2)
        drop1_outer.pack(fill='x', pady=5)

        self.drop_area1 = Frame(drop1_outer, bg="#F1F5F9", height=70)
        self.drop_area1.pack(fill='both', expand=True)
        self.drop_area1.pack_propagate(False)

        self.drop_label1 = Label(self.drop_area1, text="📂 ファイルをドロップまたはクリック (.fgcp)",
                                  font=FONTS["body"], bg="#F1F5F9", fg=COLORS["text_secondary"],
                                  cursor='hand2')
        self.drop_label1.pack(expand=True)

        self.drop_area1.bind('<Button-1>', lambda e: self._browse_diff_file(1))
        self.drop_label1.bind('<Button-1>', lambda e: self._browse_diff_file(1))

        # ファイル2（比較先）ドロップエリア
        Label(self.tab_diff, text="比較先ファイル (新バージョン):",
              font=FONTS["body"], bg=COLORS["surface"], fg=COLORS["text"]).pack(anchor='w', pady=(15, 0))

        drop2_outer = Frame(self.tab_diff, bg=COLORS["border"], padx=2, pady=2)
        drop2_outer.pack(fill='x', pady=5)

        self.drop_area2 = Frame(drop2_outer, bg="#F1F5F9", height=70)
        self.drop_area2.pack(fill='both', expand=True)
        self.drop_area2.pack_propagate(False)

        self.drop_label2 = Label(self.drop_area2, text="📂 ファイルをドロップまたはクリック (.fgcp)",
                                  font=FONTS["body"], bg="#F1F5F9", fg=COLORS["text_secondary"],
                                  cursor='hand2')
        self.drop_label2.pack(expand=True)

        self.drop_area2.bind('<Button-1>', lambda e: self._browse_diff_file(2))
        self.drop_label2.bind('<Button-1>', lambda e: self._browse_diff_file(2))

        # 比較ボタン
        Button(self.tab_diff, text="差分を比較", command=self.compare_files,
               font=FONTS["heading"], bg=COLORS["success"], fg='white',
               padx=40, pady=12, relief='flat', cursor='hand2').pack(pady=30)

        # 差分タブ用ドラッグ＆ドロップ設定
        self._setup_diff_dnd()

    def _setup_diff_dnd(self):
        """差分タブのドラッグ＆ドロップを設定"""
        if not DND_AVAILABLE:
            return
        try:
            # ファイル1用
            self.drop_area1.drop_target_register(DND_FILES)
            self.drop_area1.dnd_bind('<<Drop>>', lambda e: self._on_diff_drop(e, 1))
            self.drop_area1.dnd_bind('<<DragEnter>>', lambda e: self._on_diff_drag_enter(1))
            self.drop_area1.dnd_bind('<<DragLeave>>', lambda e: self._on_diff_drag_leave(1))
            # ファイル2用
            self.drop_area2.drop_target_register(DND_FILES)
            self.drop_area2.dnd_bind('<<Drop>>', lambda e: self._on_diff_drop(e, 2))
            self.drop_area2.dnd_bind('<<DragEnter>>', lambda e: self._on_diff_drag_enter(2))
            self.drop_area2.dnd_bind('<<DragLeave>>', lambda e: self._on_diff_drag_leave(2))
        except Exception:
            pass

    def _on_diff_drop(self, event, file_num):
        """差分タブでのファイルドロップ処理"""
        path = event.data
        if path.startswith('{') and path.endswith('}'):
            path = path[1:-1]
        if path.lower().endswith('.fgcp'):
            if file_num == 1:
                self.file_path.set(path)
            else:
                self.file_path2.set(path)
            self._update_diff_drop_area(file_num)
        self._on_diff_drag_leave(file_num)

    def _on_diff_drag_enter(self, file_num):
        """差分タブでのドラッグ中表示"""
        area = self.drop_area1 if file_num == 1 else self.drop_area2
        label = self.drop_label1 if file_num == 1 else self.drop_label2
        area.configure(bg="#DBEAFE")
        label.configure(bg="#DBEAFE", fg=COLORS["primary"])

    def _on_diff_drag_leave(self, file_num):
        """差分タブでのドラッグ離脱時表示"""
        area = self.drop_area1 if file_num == 1 else self.drop_area2
        label = self.drop_label1 if file_num == 1 else self.drop_label2
        path = self.file_path.get() if file_num == 1 else self.file_path2.get()
        if path:
            area.configure(bg="#ECFDF5")
            label.configure(bg="#ECFDF5", fg=COLORS["success"])
        else:
            area.configure(bg="#F1F5F9")
            label.configure(bg="#F1F5F9", fg=COLORS["text_secondary"])

    def _browse_diff_file(self, file_num):
        """差分比較用ファイル選択"""
        path = filedialog.askopenfilename(title="Forguncyプロジェクトを選択", filetypes=[("Forguncy Project", "*.fgcp")])
        if path:
            if file_num == 1:
                self.file_path.set(path)
                self._update_diff_drop_area(1)
            else:
                self.file_path2.set(path)
                self._update_diff_drop_area(2)

    def _update_diff_drop_area(self, file_num):
        """差分用ドロップエリア表示更新"""
        if file_num == 1:
            path = self.file_path.get()
            label = self.drop_label1
            area = self.drop_area1
        else:
            path = self.file_path2.get()
            label = self.drop_label2
            area = self.drop_area2

        if path:
            filename = Path(path).name
            label.configure(text=f"✓ {filename}", bg="#ECFDF5", fg=COLORS["success"])
            area.configure(bg="#ECFDF5")

    def _setup_dnd(self):
        """ドラッグ＆ドロップを設定（tkinterdnd2が利用可能な場合）"""
        if not DND_AVAILABLE:
            return
        try:
            self.drop_area.drop_target_register(DND_FILES)
            self.drop_area.dnd_bind('<<Drop>>', self._on_drop)
            self.drop_area.dnd_bind('<<DragEnter>>', self._on_drag_enter)
            self.drop_area.dnd_bind('<<DragLeave>>', self._on_drag_leave)
        except Exception:
            pass

    def _on_drop(self, event):
        """ファイルドロップ時の処理"""
        path = event.data
        # Windowsでは{}で囲まれている場合がある
        if path.startswith('{') and path.endswith('}'):
            path = path[1:-1]
        if path.lower().endswith('.fgcp'):
            self.file_path.set(path)
            self._update_drop_area()
        self._on_drag_leave(None)

    def _on_drag_enter(self, event):
        """ドラッグ中の表示"""
        self.drop_area.configure(bg="#DBEAFE")
        self.drop_label.configure(bg="#DBEAFE", fg=COLORS["primary"])

    def _on_drag_leave(self, event):
        """ドラッグ離脱時の表示"""
        if self.file_path.get():
            self.drop_area.configure(bg="#ECFDF5")
            self.drop_label.configure(bg="#ECFDF5", fg=COLORS["success"])
        else:
            self.drop_area.configure(bg="#F1F5F9")
            self.drop_label.configure(bg="#F1F5F9", fg=COLORS["text_secondary"])

    def _update_drop_area(self):
        """ファイル選択後のドロップエリア表示更新"""
        if self.file_path.get():
            filename = Path(self.file_path.get()).name
            self.drop_label.configure(text=f"✓ {filename}\n（クリックで変更）",
                                       bg="#ECFDF5", fg=COLORS["success"])
            self.drop_area.configure(bg="#ECFDF5")

    def browse_file(self):
        path = filedialog.askopenfilename(title="Forguncyプロジェクトを選択", filetypes=[("Forguncy Project", "*.fgcp")])
        if path:
            self.file_path.set(path)
            self._update_drop_area()

    def browse_file2(self):
        path = filedialog.askopenfilename(title="比較先プロジェクトを選択", filetypes=[("Forguncy Project", "*.fgcp")])
        if path:
            self.file_path2.set(path)

    def browse_output(self):
        path = filedialog.askdirectory(title="出力フォルダを選択", initialdir=self.output_dir.get())
        if path:
            self.output_dir.set(path)

    def update_progress(self, pct: int, msg: str):
        """進捗を更新（UIスレッドから呼び出し）"""
        self.progress['value'] = pct
        self.status_label.config(text=msg)
        self.root.update_idletasks()

    def _poll_event_queue(self):
        """イベントキューをポーリングしてUI更新（100ms間隔）"""
        try:
            while True:
                event = self.event_queue.get_nowait()
                self._handle_event(event)
        except queue.Empty:
            pass
        # 次のポーリングをスケジュール
        self.root.after(100, self._poll_event_queue)

    def _handle_event(self, event: AnalysisEvent):
        """イベントを処理"""
        if event.event_type == 'progress':
            pct, msg = event.data
            self.update_progress(pct, msg)
        elif event.event_type == 'log':
            level, msg = event.data
            self._log_to_ui(msg, level)
        elif event.event_type == 'complete':
            self._on_analysis_complete(event.data)
        elif event.event_type == 'error':
            self._on_analysis_error(event.data)

    def _log_to_ui(self, msg: str, level: str = 'INFO'):
        """UIのログ表示欄にメッセージを追加"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        self.log_text.configure(state='normal')
        self.log_text.insert(END, f"[{timestamp}] {msg}\n", level)
        self.log_text.see(END)
        self.log_text.configure(state='disabled')

    def _clear_log(self):
        """ログ表示をクリア"""
        self.log_text.configure(state='normal')
        self.log_text.delete(1.0, END)
        self.log_text.configure(state='disabled')

    def _confirm_large_file(self, msg: str) -> bool:
        """大きいファイルの処理確認"""
        return messagebox.askyesno("確認", msg)

    def start_analysis(self):
        """解析を開始（非同期）"""
        if not self.file_path.get():
            messagebox.showerror("エラー", "プロジェクトファイルを選択してください")
            return

        if self.is_analyzing:
            messagebox.showwarning("警告", "解析中です。完了をお待ちください。")
            return

        file_path = self.file_path.get()

        # ZIP安全チェック（UIスレッドで実行、確認ダイアログ表示のため）
        try:
            self._log_to_ui(f"ファイルチェック中: {Path(file_path).name}")
            check_zip_safety(file_path, self._confirm_large_file)
        except ZipSafetyError as e:
            logger.warning(f"ZIP安全チェック失敗: {e}")
            self._log_to_ui(str(e), 'ERROR')
            messagebox.showerror("ファイルエラー", str(e))
            return

        # UI状態を更新
        self.is_analyzing = True
        self.analyze_btn.config(state='disabled', text="解析中...")
        self.progress['value'] = 0

        self._log_to_ui(f"解析開始: {Path(file_path).name}")

        # バックグラウンドスレッドで解析実行
        self.analysis_thread = threading.Thread(
            target=self._run_analysis_thread,
            args=(file_path, self.output_dir.get(), self.license_manager.limits),
            daemon=True
        )
        self.analysis_thread.start()

    def _run_analysis_thread(self, file_path: str, output_dir: str, limits: dict):
        """解析処理（バックグラウンドスレッド）"""
        generated_files = []
        try:
            # 進捗コールバック（キュー経由でUIに通知）
            def progress_callback(pct, msg):
                self.event_queue.put(AnalysisEvent('progress', (pct, msg)))
                self.event_queue.put(AnalysisEvent('log', ('INFO', msg)))

            progress_callback(10, "解析を開始しています...")
            analysis = analyze_project(file_path, progress_callback, limits)

            # Word出力
            if limits.get('word_export'):
                progress_callback(70, "Word仕様書を生成しています...")
                word_path = generate_spec_document(analysis, output_dir)
                generated_files.append(word_path)
                logger.info(f"Word出力完了: {word_path}")

            # Excel出力
            if limits.get('excel_export') and EXCEL_AVAILABLE:
                progress_callback(85, "Excel仕様書を生成しています...")
                excel_path = generate_excel_document(analysis, output_dir)
                generated_files.append(excel_path)
                logger.info(f"Excel出力完了: {excel_path}")

            progress_callback(100, "完了しました!")

            # 完了イベント
            self.event_queue.put(AnalysisEvent('complete', {
                'analysis': analysis,
                'generated_files': generated_files,
                'output_dir': output_dir,
            }))

        except Exception as e:
            logger.error(f"解析エラー: {e}\n{traceback.format_exc()}")
            self.event_queue.put(AnalysisEvent('error', {
                'error': str(e),
                'traceback': traceback.format_exc(),
            }))

    def _on_analysis_complete(self, data: dict):
        """解析完了時の処理（UIスレッド）"""
        self.is_analyzing = False
        self.analyze_btn.config(state='normal', text="解析開始")

        analysis = data['analysis']
        generated_files = data['generated_files']
        output_dir = data['output_dir']

        self._log_to_ui(f"解析完了: テーブル={analysis.summary.table_count}, ページ={analysis.summary.page_count}")

        msg = f"解析が完了しました。\n\nテーブル: {analysis.summary.table_count}件\nページ: {analysis.summary.page_count}件"
        if generated_files:
            msg += f"\n\n生成ファイル:\n" + "\n".join(generated_files)
            for f in generated_files:
                self._log_to_ui(f"生成: {f}")
        else:
            msg += "\n\n※ Word/Excel出力にはStandard版が必要です"

        messagebox.showinfo("完了", msg)

        if generated_files and os.name == 'nt':
            try:
                os.startfile(output_dir)
            except Exception:
                pass

    def _on_analysis_error(self, data: dict):
        """解析エラー時の処理（UIスレッド）"""
        self.is_analyzing = False
        self.analyze_btn.config(state='normal', text="解析開始")
        self.update_progress(0, "エラーが発生しました")

        error_msg = data['error']
        tb = data.get('traceback', '')

        self._log_to_ui(f"エラー: {error_msg}", 'ERROR')

        # エラーダイアログにログファイルの場所を表示
        log_path = get_log_dir() / 'app.log'
        messagebox.showerror(
            "エラー",
            f"解析中にエラーが発生しました:\n{error_msg}\n\n"
            f"詳細はログファイルを確認してください:\n{log_path}"
        )

    def compare_files(self):
        if not self.file_path.get() or not self.file_path2.get():
            messagebox.showerror("エラー", "2つのファイルを選択してください")
            return

        try:
            old_analysis = analyze_project(self.file_path.get(), limits=self.license_manager.limits)
            new_analysis = analyze_project(self.file_path2.get(), limits=self.license_manager.limits)
            diff = compare_projects(old_analysis, new_analysis)

            # 差分データを保存（Excel出力用）
            self._last_diff = diff
            self._last_diff_old_name = old_analysis.project_name
            self._last_diff_new_name = new_analysis.project_name

            # 結果表示ウィンドウ
            diff_window = Toplevel(self.root)
            diff_window.title("差分比較結果")
            diff_window.geometry("700x600")

            # ボタンフレーム
            btn_frame = Frame(diff_window, bg=COLORS["bg"], padx=10, pady=10)
            btn_frame.pack(fill='x')

            Button(btn_frame, text="Excelに出力", command=self._export_diff_excel,
                   font=FONTS["body"], bg=COLORS["success"], fg='white',
                   padx=20, pady=5, relief='flat', cursor='hand2').pack(side='left')

            # テキストエリア
            text_frame = Frame(diff_window)
            text_frame.pack(fill=BOTH, expand=True, padx=10, pady=(0, 10))

            text = Text(text_frame, wrap=WORD, padx=10, pady=10, font=("Yu Gothic UI", 10))
            scrollbar = Scrollbar(text_frame, command=text.yview)
            text.configure(yscrollcommand=scrollbar.set)
            scrollbar.pack(side=RIGHT, fill=Y)
            text.pack(side=LEFT, fill=BOTH, expand=True)

            # タグ設定（色分け）
            text.tag_configure('header', font=("Yu Gothic UI", 12, "bold"))
            text.tag_configure('added', foreground='#006100')
            text.tag_configure('removed', foreground='#9C0006')
            text.tag_configure('modified', foreground='#9C6500')

            text.insert(END, f"=== 差分比較結果 ===\n\n", 'header')
            text.insert(END, f"比較元: {old_analysis.project_name}\n")
            text.insert(END, f"比較先: {new_analysis.project_name}\n\n")

            # テーブル
            text.insert(END, f"--- テーブル ---\n", 'header')
            text.insert(END, f"追加: {len(diff.added_tables)}件\n")
            for t in diff.added_tables:
                text.insert(END, f"  + {t.name} (カラム: {len(t.columns)})\n", 'added')
            text.insert(END, f"削除: {len(diff.removed_tables)}件\n")
            for t in diff.removed_tables:
                text.insert(END, f"  - {t.name} (カラム: {len(t.columns)})\n", 'removed')
            text.insert(END, f"変更: {len(diff.modified_tables)}件\n")
            for m in diff.modified_tables:
                details = []
                if m.get('added_columns'):
                    details.append(f"+{len(m['added_columns'])}カラム")
                if m.get('removed_columns'):
                    details.append(f"-{len(m['removed_columns'])}カラム")
                if m.get('modified_columns'):
                    details.append(f"変更{len(m['modified_columns'])}カラム")
                detail_str = f" ({', '.join(details)})" if details else ""
                text.insert(END, f"  * {m['name']}{detail_str}\n", 'modified')

            # ページ
            text.insert(END, f"\n--- ページ ---\n", 'header')
            text.insert(END, f"追加: {len(diff.added_pages)}件\n")
            for p in diff.added_pages:
                text.insert(END, f"  + {p.name}\n", 'added')
            text.insert(END, f"削除: {len(diff.removed_pages)}件\n")
            for p in diff.removed_pages:
                text.insert(END, f"  - {p.name}\n", 'removed')
            modified_pages = getattr(diff, 'modified_pages', [])
            if modified_pages:
                text.insert(END, f"変更: {len(modified_pages)}件\n")
                for m in modified_pages:
                    details = []
                    if m.get('added_buttons'):
                        details.append(f"+{len(m['added_buttons'])}ボタン")
                    if m.get('removed_buttons'):
                        details.append(f"-{len(m['removed_buttons'])}ボタン")
                    detail_str = f" ({', '.join(details)})" if details else ""
                    text.insert(END, f"  * {m['name']}{detail_str}\n", 'modified')

            # サーバーコマンド
            text.insert(END, f"\n--- サーバーコマンド ---\n", 'header')
            text.insert(END, f"追加: {len(diff.added_server_commands)}件\n")
            for c in diff.added_server_commands:
                text.insert(END, f"  + {c.name}\n", 'added')
            text.insert(END, f"削除: {len(diff.removed_server_commands)}件\n")
            for c in diff.removed_server_commands:
                text.insert(END, f"  - {c.name}\n", 'removed')
            text.insert(END, f"変更: {len(diff.modified_server_commands)}件\n")
            for m in diff.modified_server_commands:
                details = []
                if m.get('added_parameters'):
                    details.append(f"+{len(m['added_parameters'])}パラメータ")
                if m.get('removed_parameters'):
                    details.append(f"-{len(m['removed_parameters'])}パラメータ")
                if m.get('commands_changed'):
                    details.append("処理変更")
                detail_str = f" ({', '.join(details)})" if details else ""
                text.insert(END, f"  * {m['name']}{detail_str}\n", 'modified')

            text.config(state='disabled')

        except Exception as e:
            messagebox.showerror("エラー", f"比較中にエラーが発生しました:\n{str(e)}")

    def _export_diff_excel(self):
        """差分結果をExcelに出力"""
        if not hasattr(self, '_last_diff'):
            messagebox.showerror("エラー", "差分比較を先に実行してください")
            return

        try:
            output_dir = self.output_dir.get()
            file_path = generate_diff_excel(
                self._last_diff,
                self._last_diff_old_name,
                self._last_diff_new_name,
                output_dir
            )
            messagebox.showinfo("完了", f"差分レポートを出力しました:\n{file_path}")

            # ファイルを開く（Windows）
            if os.name == 'nt':
                try:
                    os.startfile(file_path)
                except Exception:
                    pass
        except Exception as e:
            messagebox.showerror("エラー", f"Excel出力に失敗しました:\n{str(e)}")


    def refresh_ui(self):
        """ライセンス状態に応じてUIを更新"""
        # 出力チェックボックスの状態を更新
        if self.license_manager.limits.get('word_export'):
            self.output_word.state(['!disabled', 'selected'])
        else:
            self.output_word.state(['disabled', '!selected'])

        if self.license_manager.limits.get('excel_export'):
            self.output_excel.state(['!disabled', 'selected'])
        else:
            self.output_excel.state(['disabled', '!selected'])

        # 差分比較タブを再構築
        for widget in self.tab_diff.winfo_children():
            widget.destroy()
        self.setup_diff_tab()

        # Free版制限表示の更新
        self._update_license_badge()


# =============================================================================
# main関数
# =============================================================================
def main():
    """アプリケーションエントリポイント"""
    # ドラッグ＆ドロップを有効にするためTkinterDnD.Tk()を使用
    if DND_AVAILABLE:
        root = TkinterDnD.Tk()
    else:
        root = Tk()
    app = ForguncyInsightApp(root)
    root.mainloop()


if __name__ == '__main__':
    main()
