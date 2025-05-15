import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Prisma Client のインスタンス

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nameQuery = searchParams.get('name');

  if (!nameQuery || nameQuery.trim() === '') {
    return NextResponse.json({ customers: [] }); // クエリが空なら空の配列を返す
  }

  try {
    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: nameQuery, // 部分一致検索
          mode: 'insensitive', // 大文字・小文字を区別しない (データベースによる)
        },
      },
      select: { // 必要なフィールドのみ選択
        id: true,
        name: true,
        phone: true,
      },
      take: 10, // 最大10件まで返す (パフォーマンスのため)
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("API /api/customers/search エラー詳細:", error); // 詳細なエラーを出力
    return NextResponse.json({ error: '顧客情報の検索に失敗しました。', details: error.message }, { status: 500 });
  }
} 