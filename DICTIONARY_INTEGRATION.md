# Dictionary Suggestion Integration

この版では、`lib/dictionaries/` と `public/dictionaries/` に JSON 辞書を統合しています。

## 判定方針

1. 抽象語・感覚語に正規化後完全一致した場合は、サジェストを表示します。
2. 総称語に正規化後完全一致した場合は、サジェストを表示します。
3. specific語・測定語に正規化後完全一致した場合は、サジェストを抑制します。
4. 未登録語は弱い確認表示の対象です。

重要: specific語の判定に部分一致は使いません。
そのため、「集中力」に含まれる「力」や、「力の大きさ」に含まれる「大きさ」で誤判定しません。

## 主なファイル

- `lib/suggestion-dictionary.ts`
  - JSON辞書を読み込み、判定関数を提供します。
- `lib/dictionaries/suggestion_dictionary_bundle.json`
  - アプリ内部で使う統合辞書です。
- `public/dictionaries/suggestion_dictionary_bundle.json`
  - 辞書確認パネルでブラウザから読み込む公開用辞書です。
- `lib/evaluation-utils.ts`
  - 既存評価ロジックにJSON辞書判定を接続しています。

## GitHub Pages

既存の GitHub Actions により、`main` ブランチへ push すると `pnpm build` で静的サイトを生成します。
