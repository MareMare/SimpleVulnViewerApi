/**
 * @file IPA脆弱性情報フィルタリングAPI
 * @description このCloudflare Workersスクリプトは、IPAの「脆弱性対策情報データベース」からデータを取得し、
 * 特定のキーワードを含むデータをフィルタリングしてJSON形式で返却します。
 * キーワードはリクエストパラメータとして指定でき、以下の処理を行います：
 *  - クエリパラメータ "keyword" は複数回指定可能（例: `?keyword=Microsoft&keyword=Oracle Java`）。
 *  - クエリパラメータ "keyword" が指定されない場合は、デフォルトのキーワード ["Microsoft", "Adobe Acrobat", "Java"] を使用します。
 *  - クエリパラメータ値はURLエンコードされた文字列（例: `Oracle%20Java`）として指定可能です。
 * フィルタリングの過程で不要なフィールド（item_identifier）を削除し、必要なフィールド（item_date, item_title, item_link）のみを返却します。
 * さらに、フィルタリングされたデータは、item_date の昇順に並び替えられます。
 * データ取得元のURLには、UNIX時間をクエリパラメータとして動的に追加します。
 *
 * @author MareMare
 * @created 2024-12-23
 * @version 1.1.0
 * @fetch_source http://isec-myjvn-feed1.ipa.go.jp/IPARssReader.php
 *
 * @request_parameters
 *  - `keyword`: フィルタリングするキーワードを指定します。複数指定が可能です。
 *      例1: `?keyword=Microsoft`
 *      例2: `?keyword=Microsoft&keyword=Oracle Java`
 *  - キーワードが指定されない場合、デフォルト値 ["Microsoft", "Adobe Acrobat", "Java"] が使用されます。
 *
 * @response
 * JSON配列形式で、以下のフィールドを含むオブジェクトを返却します：
 *  - `item_date`: アイテムの日付
 *  - `item_title`: アイテムのタイトル
 *  - `item_link`: アイテムのリンク
 * 不要なフィールド（`item_identifier`）は削除されます。
 */

export default {
    async fetch(request, env, ctx) {
        // 現在の日時を取得
        const currentDateTime = new Date();
        // UNIX時間を計算
        const unixTime = Math.floor(currentDateTime.getTime() / 1000);
        const sourceUrl = `http://isec-myjvn-feed1.ipa.go.jp/IPARssReader.php?${unixTime}&tool=icatw`;

        // 許可されたパス
        const allowedPath = '/'; // ルートパスのみ許可
        try {
            // メソッド、パス、ポートを検証
            const { method, url, headers } = request;
            const parsedUrl = new URL(url);

            // 環境判定（本番かローカルか）
            // `localhost`や`127.0.0.1`、および`.local`をローカル環境と判定
            const isLocalEnv =
                parsedUrl.hostname === 'localhost' ||
                parsedUrl.hostname === '127.0.0.1' ||
                parsedUrl.hostname.endsWith('.local');

            // 許可されたポートを定義
            const allowedPorts = isLocalEnv
                ? new Set(['80', '443', '8787'])
                : new Set(['80', '443']);

            // メソッドを制御
            if (method !== 'GET') {
                return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 }); // 405 Method Not Allowed
            }

            // パスを制御
            if (parsedUrl.pathname !== allowedPath) {
                return new Response(JSON.stringify({ error: 'Path not allowed' }), { status: 404 }); // 404 Not Found
            }

            // ポートを制御
            const port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'); // ポートが明示されていない場合のデフォルト
            if (!allowedPorts.has(port)) {
                return new Response(JSON.stringify({ error: 'Port not allowed' }), { status: 403 }); // 403 Forbidden
            }

            // クエリパラメータ "keyword" を取得（複数指定対応）
            const keywords = parsedUrl.searchParams.getAll('keyword')
                .map(keyword => decodeURIComponent(keyword.trim()));

            // キーワードが指定されていない場合のデフォルト値
            const effectiveKeywords = keywords.length > 0
                ? keywords
                : ['Microsoft', 'Adobe Acrobat', 'Java'];

            // JSONデータを取得
            const response = await fetch(sourceUrl);
            const source = await response.json();

            // JSONの "itemdata" フィールドを取得
            const itemData = source.itemdata || [];

            // フィルタリング条件を設定
            const filteredData = itemData
                .filter(item =>
                    effectiveKeywords.some(keyword => item.item_title.includes(keyword))
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
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            // エラーが発生した場合
            return new Response(
                JSON.stringify({ error: 'Failed to fetch or process data', details: error.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }
    }
};
