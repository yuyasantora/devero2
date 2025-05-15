import { PrismaClient } from '@prisma/client';

// グローバルスコープに宣言（ホットリロード対策）
declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined
}

// 開発環境ではグローバル変数を使い回す
export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // 必要に応じてログレベルを設定
  })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
