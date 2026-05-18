# GAS連携確認メモ

現在のWebアプリURL:
https://script.google.com/macros/s/AKfycbxzUElaKbrWYSy06eR77uOWyPWHX2Z1YsMkv1QX7tcFiRL2nm4yQouw0tR66GlosYtKRQ/exec

## 確認順
1. ブラウザで上記URLを開き、`GAS RUNNING` が表示されることを確認する。
2. GASエディタで `testAppendPayload()` を実行し、Spreadsheetに1行追加されることを確認する。
3. GitHub Pages公開後、ブラウザのDevTools Networkで `https://script.google.com/macros/s/AKfycbxzUElaKbrWYSy06eR77uOWyPWHX2Z1YsMkv1QX7tcFiRL2nm4yQouw0tR66GlosYtKRQ/exec` へのPOSTが発生していることを確認する。
4. `no-cors` 送信では画面側でGASのJSON本文は読めないため、最終判定はSpreadsheetの行追加で確認する。
