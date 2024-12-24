/**
 * @file IPA脆弱性情報フィルタリングAPI
 * @description このCloudflare Workersスクリプトは、IPAの「脆弱性対策情報データベース」からデータを取得し、
 * 特定のキーワード（例: "Microsoft", "Adobe Acrobat", "Java"）を含むデータをフィルタリングしてJSON形式で返却します。
 * また、フィルタリングの過程で不要なフィールド（item_identifier）を削除し、必要なフィールド（item_date, item_title, item_link）のみを返却します。
 * フィルタリングされたデータは、item_date の昇順に並び替えられます。
 * データ取得元のURLには、UNIX時間をクエリパラメータとして動的に追加します。
 * @author MareMare
 * @created 2024-12-23
 * @version 1.0.1
 * @fetch_source http://isec-myjvn-feed1.ipa.go.jp/IPARssReader.php
 */

export default {
	async fetch(request, env, ctx) {
	  // 現在の日時を取得
	  const currentDateTime = new Date();
	  // UNIX時間を計算
	  const unixTime = Math.floor(currentDateTime.getTime() / 1000);
	  // URLにUNIX時間を含める
	  const sourceUrl = `http://isec-myjvn-feed1.ipa.go.jp/IPARssReader.php?${unixTime}&tool=icatw`;
  
	  try {
		// JSONデータを取得
		const response = await fetch(sourceUrl);
		const source = await response.json();
  
		// JSONの "itemdata" フィールドを取得
		const itemData = source.itemdata || [];
		
		// キーワードを定義
		const keywords = ["Microsoft", "Adobe Acrobat", "Java"];
  
		// フィルタリング条件を設定
		const filteredData = itemData
		  .filter(item => 
			keywords.some(keyword => item.item_title.includes(keyword))
		  )
		  .map(item => {
			// "item_identifier" フィールドを削除
			const { item_identifier, ...rest } = item;
			return rest;
		  })
		  .sort((a, b) => {
			// item_date の昇順でソート
			const dateA = new Date(a.item_date).getTime();
			const dateB = new Date(b.item_date).getTime();
			return dateA - dateB;
		  });
  
		// フィルタリングされたデータを返す
		return new Response(JSON.stringify(filteredData, null, 2), {
		  headers: { "Content-Type": "application/json" },
		});
	  } catch (error) {
		// エラーが発生した場合
		return new Response(
		  JSON.stringify({ error: "Failed to fetch or process data", details: error.message }),
		  { status: 500, headers: { "Content-Type": "application/json" } }
		);
	  }
	},
  };
  