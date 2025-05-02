import { NextResponse } from 'next/server';
// lib/prisma.ts から prisma インスタンスをインポート
import { prisma } from '@/lib/prisma'; // パスを確認・修正。エイリアスがなければ相対パスで。
// import { PrismaClient } from '@prisma/client'; // ← 不要
// import { testMessage } from '@/lib/test'; // または '@/lib/test'

// const prisma = new PrismaClient(); // ← この行を削除する

export async function POST(request: Request) {
  console.log("!!! /api/customers POST request received !!!"); // ★★★ 最も単純なログ

  try {
    // console.log("Test message from lib:", testMessage); // デバッグ用、不要なら削除

    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: '名前と電話番号は必須です' }, { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: phone }, // schema.prisma で phone に @unique が必要
    });

    let customer;
    if (existingCustomer) {
      console.log(`顧客情報は既に存在します: ${phone}`);
      customer = existingCustomer;
      return NextResponse.json(customer, { status: 200 });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: name,
          phone: phone,
        },
      });
      console.log(`新規顧客をDBに作成しました: ${phone}`);
      return NextResponse.json(customer, { status: 201 });
    }

  } catch (error) {
    console.error('!!! APIルートでキャッチしたエラー:', error);
    let errorMessage = 'データベース処理中にエラーが発生しました';
    return NextResponse.json({ error: errorMessage, details: String(error) }, { status: 500 });
  }
  // finally {
  //   await prisma.$disconnect(); // シングルトンパターンでは通常不要
  // }
}
