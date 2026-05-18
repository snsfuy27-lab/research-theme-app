# 研究テーマ構造化・測定語評価システム

高校生の課題研究テーマを、研究型、変数、測定語、評価観点に分解して整理する Next.js アプリです。

## 構成

- Next.js + React + TypeScript
- 外部APIなし
- サーバー処理なし
- GitHub Pages 用の静的出力に対応

## ローカル確認

```bash
pnpm install
pnpm dev
```

## 静的HTMLとして出力

```bash
pnpm build
```

ビルド後、`out/` フォルダに静的ファイルが生成されます。

## GitHub Pagesで公開する手順

1. GitHubで新しいリポジトリを作成する。
2. このフォルダの中身をすべてアップロードする。
3. `main` ブランチに push する。
4. GitHub の `Settings` → `Pages` を開く。
5. `Build and deployment` の `Source` を `GitHub Actions` にする。
6. Actions の実行が成功すると、GitHub Pages のURLで公開されます。

## 注意

このアプリは、入力された語句をブラウザ内で処理します。AI APIには送信しません。
