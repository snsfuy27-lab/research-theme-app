function testAppendPayload() {
  const payload = {
    studentId: "20140静北太郎",
    researchType: "因果型",
    title: "テストタイトル",
    c1: "紙飛行機",
    c2: "折る回数",
    c3: "滞空時間",
    c4: "教室内",
    hypothesis: "",
    memo: "GASエディタからの直接テスト"
  };
  const result = appendPayload(payload);
  Logger.log(result.getContent());
}
