# GitHub Actions 修正内容

## 原因

以前の workflow は `pnpm` を使う設定でしたが、GitHub Actions 上で `pnpm` 実行ファイルを認識できず失敗していました。

## 修正

- `.github/workflows/deploy.yml` を npm 専用に変更
- `pnpm-lock.yaml` を削除
- `packageManager: pnpm...` を package.json から削除
- Node.js 24 を使用
- `npm install` → `npm run build` → `out/` を Pages にアップロード

## GitHub 側で必要な設定

`Settings → Pages → Source → GitHub Actions`

