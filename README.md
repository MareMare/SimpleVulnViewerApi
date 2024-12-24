# IPA脆弱性情報フィルタリングAPI
このプロジェクトは、Cloudflare Workers を利用して構築されたスクリプトであり、IPAが提供する「脆弱性対策情報データベース」からデータを取得し、指定されたキーワードに基づいて情報をフィルタリングします。

## 機能概要
- IPAの「脆弱性対策情報データベース」から最新のJSONデータを取得します。
- 指定されたキーワードに一致するデータのみを抽出し、フィルタリング結果を返却します。
- フィルタリングされたデータは日付順（昇順）で並び替えられます。
- レスポンスには不要なデータを除去し、必要な情報（`item_date`, `item_title`, `item_link`）のみを含めます。

## 使用方法

### リクエスト
以下のように、クエリパラメータを使用してキーワードを指定できます。

### クエリパラメータ
- `keyword`: フィルタリングするキーワードを指定します（複数指定が可能です）。
    - **例1**: 単一のキーワードを指定
`?keyword=Microsoft`
    - **例2**: 複数のキーワードを指定
`?keyword=Microsoft&keyword=Oracle Java`
    - **例3**: URLエンコードされたキーワードを指定
`?keyword=Oracle%20Java`

- **デフォルトキーワード**: クエリパラメータを指定しない場合、`["Microsoft", "Adobe Acrobat", "Java"]` が使用されます。

### レスポンス
リクエストの結果としてフィルタリングされたJSONデータがレスポンスに返却されます。
レスポンスデータの例は以下のとおりです：
```json
[
  {
    "item_date": "2024-12-20",
    "item_title": "Microsoft Windows に関する脆弱性情報",
    "item_link": "http://example.com/vulnerability/1"
  },
  {
    "item_date": "2024-12-21",
    "item_title": "Adobe Acrobat の脆弱性",
    "item_link": "http://example.com/vulnerability/2"
  }
]
```

### 含まれるフィールド
- `item_date`: 情報の日付
- `item_title`: アイテムのタイトル
- `item_link`: 詳細情報へのリンク

上記以外のフィールド（例: `item_identifier`）は削除されます。

### エラーの挙動

エラーが発生した場合、以下のようなJSON形式のエラーメッセージが返却されます：

```json
{
  "error": "Failed to fetch or process data",
  "details": "エラーの詳細メッセージ"
}
```

**エラーが発生する主なケース**:
- データ取得元URLにアクセスできない場合
- 無効なリクエストURLを指定した場合

## 使用例

以下のURLは、複数のキーワードを指定したリクエスト例です：
```ps1
https://simplevulnviewerapi.maremare.workers.dev/?keyword=Microsoft%20%E8%A3%BD%E5%93%81&keyword=Oracle%20Java&keyword=Adobe%20Acrobat
```

このリクエストでは、次のキーワードを利用しています：
- **Microsoft 製品**
- **Oracle Java**
- **Adobe Acrobat**

上記のキーワードに一致する情報がフィルタリングされます。

## 関連リポジトリ
* [SimpleVulnViewer](https://github.com/MareMare/SimpleVulnViewer)
