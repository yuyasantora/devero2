// import { PrismaClient } from '@prisma/client'; // ← これを削除またはコメントアウト
import { PrismaClient } from './generated/prisma'; // ← 生成先のパスからインポート

// グローバルスコープに宣言（ホットリロード対策）
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// 開発環境ではグローバル変数を使い回す
export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query'], // 開発時にクエリログを見たい場合
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
