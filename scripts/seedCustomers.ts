import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ローカルストレージから取得した customerPreferences のデータ構造を仮定
// 例: [{ phone: "090...", preferences: { ... } }, { phone: "080...", ... }]
// この部分は実際のデータ取得方法に置き換えてください。
// ブラウザ環境でないと localStorage は使えないため、
// 一度ブラウザのコンソールで localStorage.getItem('customerPreferences') の内容をコピーし、
// JSONファイルとして保存するか、直接このスクリプトにペーストするなどの工夫が必要です。
const customerPreferencesDataString = `[
  {"phone":"09012345678","preferences":{"slice":"薄切り"}},
  {"phone":"08098765432","preferences":{"block":"厚切り"}}
]`; // ← ここに実際のJSON文字列をペーストするか、ファイルから読み込む

interface CustomerPreferenceSeed {
  phone: string;
  // name はこのデータにはないので、phoneをnameとして使うか、別途用意する必要がある
  preferences: Record<string, string>;
}

async function main() {
  console.log('顧客データの登録を開始します...');
  const customerPreferences: CustomerPreferenceSeed[] = JSON.parse(customerPreferencesDataString);

  for (const pref of customerPreferences) {
    // Customerテーブルに電話番号で検索
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: pref.phone },
    });

    if (!existingCustomer) {
      // 存在しなければ新規作成
      // name が customerPreferencesData にない場合、どうするか検討が必要
      // ここでは仮に phone 番号を name にも使うか、'名前未設定' などにする
      await prisma.customer.create({
        data: {
          phone: pref.phone,
          name: `顧客 (${pref.phone.slice(-4)})`, // 仮の名前
          // preferences は Customer モデルに直接保存するか、別モデルにするかスキーマ設計による
          // ここでは Customer モデルに preferences という JSON 型のフィールドがあると仮定
          // preferences: pref.preferences, // JSON型の場合
        },
      });
      console.log(`顧客を登録しました: ${pref.phone}`);
    } else {
      console.log(`顧客は既に存在します: ${pref.phone}`);
      // 必要であれば更新処理
      // await prisma.customer.update({
      //   where: { phone: pref.phone },
      //   data: {
      //     name: `顧客 (${pref.phone.slice(-4)}) Updated`,
      //     // preferences: pref.preferences,
      //   },
      // });
    }
  }
  console.log('顧客データの登録が完了しました。');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 