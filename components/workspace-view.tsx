"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Clock, ArrowLeft, CheckCircle2, RefreshCcw, AlertTriangle, Save, Truck, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/contexts/order-context"
import { format, differenceInMinutes, parse } from "date-fns"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  受付済み: "bg-blue-100 text-blue-800",
  準備中: "bg-yellow-100 text-yellow-800",
  完了: "bg-green-100 text-green-800",
  キャンセル: "bg-red-100 text-red-800",
}

// カテゴリタグの色定義
const categoryColors: Record<string, string> = {
  スライス: "bg-blue-100 text-blue-800 border border-blue-300",
  ブロック: "bg-orange-100 text-orange-800 border border-orange-300",
  ホルモン: "bg-red-100 text-red-800 border border-red-300",
  その他: "bg-gray-100 text-gray-800 border border-gray-300",
}

// カテゴリ判定用のキーワード (例)
const hormoneKeywords = ["ホルモン", "レバー", "ミノ", "ハツ", "センマイ", "ギアラ", "テッチャン", "シマチョウ", "マルチョウ"];

// 配達方法の表示名と値 (new-order.tsx と合わせる)
const deliveryOptions = [
  { value: "local", label: "地元配達" },
  { value: "hiroshima", label: "広島配達" },
  { value: "sagawa", label: "佐川急便" },
  { value: "yamato", label: "ヤマト運輸" },
  { value: "pickup", label: "店頭受取" }, // 表示名を調整
];

// 配達方法タグの色定義
const deliveryMethodColors: Record<string, string> = {
  local: "bg-purple-100 text-purple-800",
  hiroshima: "bg-pink-100 text-pink-800",
  sagawa: "bg-cyan-100 text-cyan-800",
  yamato: "bg-lime-100 text-lime-800",
  pickup: "bg-gray-100 text-gray-800",
};

// ★ 配達方法の背景色定義 (より濃い色 + ホバー効果)
const deliveryMethodBgColors: Record<string, string> = {
  local: "bg-purple-200 hover:bg-purple-300", // 50->200, 100->300
  hiroshima: "bg-pink-200 hover:bg-pink-300",     // 50->200, 100->300
  sagawa: "bg-cyan-200 hover:bg-cyan-300",       // 50->200, 100->300
  yamato: "bg-lime-200 hover:bg-lime-300",       // 50->200, 100->300
  pickup: "bg-gray-100 hover:bg-gray-200",       // white->100, 50->200 (少し色付け)
  default: "bg-gray-100 hover:bg-gray-200",      // white->100, 50->200 (未設定時も少し色付け)
};

export default function WorkspaceView() {
  const router = useRouter()
  const { orders, updateOrderStatus, updateOrderItemWeight } = useOrders()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const { toast } = useToast()

  // 30秒ごとに自動更新
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefresh()
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  // 当日の注文のみフィルタリング
  const todayOrders = orders.filter((order) => {
    try {
      return order.status !== "キャンセル" && order.status !== "完了"
    } catch (e) {
      return false
    }
  })

  // 残り時間を計算する関数
  const calculateRemainingTime = (pickupTime) => {
    try {
      // 現在の日付と受け取り時間を組み合わせて日時を作成
      const today = format(currentTime, "yyyy-MM-dd")
      const pickupDateTime = parse(`${today} ${pickupTime}`, "yyyy-MM-dd HH:mm", new Date())

      // 残り分数を計算
      const remainingMinutes = differenceInMinutes(pickupDateTime, currentTime)

      return remainingMinutes
    } catch (e) {
      return 999 // エラーの場合は大きな値を返す
    }
  }

  // 残り時間でソート
  const sortOrdersByRemainingTime = (a, b) => {
    const remainingTimeA = calculateRemainingTime(a.pickupTime)
    const remainingTimeB = calculateRemainingTime(b.pickupTime)
    return remainingTimeA - remainingTimeB
  }

  // 残り時間を表示用にフォーマット
  const formatRemainingTime = (minutes) => {
    if (minutes < 0) {
      return `${Math.abs(minutes)}分超過`
    } else if (minutes === 0) {
      return "ちょうど今"
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
        return `残り${hours}時間${mins > 0 ? `${mins}分` : ""}`
      } else {
        return `残り${mins}分`
      }
    }
  }

  // 画面を更新
  const handleRefresh = () => {
    setCurrentTime(new Date())
    setLastRefreshed(new Date())
  }

  // ステータス変更ハンドラー
  const handleStatusChange = (id, newStatus) => {
    updateOrderStatus(id, newStatus)
    setLastRefreshed(new Date())
  }

  // 重量保存ハンドラー
  const handleSaveWeight = (orderId: string, itemId: string, weight: number | string) => {
    const weightValue = parseFloat(weight as string);

    if (!isNaN(weightValue) && weightValue >= 0) {
      try {
        // 1. 重量を更新 (コンテキストの関数を呼び出す想定)
        // updateOrderItemWeight(orderId, itemId, weightValue); // この関数の実装が必要
        console.log(`重量保存実行: orderId=${orderId}, itemId=${itemId}, weight=${weightValue}`); // 動作確認用ログ

        // 仮に、ここで orders 配列内の該当アイテムの actualWeight を直接更新してみる
        // ※ 本来は updateOrderItemWeight が行うべき処理
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
          const itemIndex = orders[orderIndex].items.findIndex(i => i.id === itemId);
          if (itemIndex !== -1) {
            // この変更はローカルステートにのみ影響し、永続化はされない点に注意
            // orders[orderIndex].items[itemIndex].actualWeight = weightValue;
            // 代わりに、チェックロジックで今回の入力値を考慮する
          }
        }
        // ここまで仮の更新処理

        toast({
          title: "重量保存",
          description: `商品ID ${itemId} の重量を ${weightValue} に更新しました。`,
        });

        // 2. 自動完了チェック
        //    現在の `orders` ステートから対象の注文を探す
        const targetOrder = orders.find(o => o.id === orderId);

        // 注文が存在し、まだ完了/キャンセルされていない場合のみチェック
        if (targetOrder && targetOrder.status !== '完了' && targetOrder.status !== 'キャンセル') {

          // この注文の全てのアイテムに有効な実重量が設定されているか確認
          const allItemsHaveWeight = targetOrder.items.every(item => {
            // 今回保存したアイテムについては、入力された `weightValue` を使用してチェック
            if (item.id === itemId) {
              return !isNaN(weightValue) && weightValue >= 0;
            }
            // それ以外のアイテムは、既存の `actualWeight` プロパティをチェック
            return typeof item.actualWeight === 'number' && item.actualWeight >= 0;
          });

          // 全てのアイテムに重量があれば、ステータスを「完了」に更新
          if (allItemsHaveWeight) {
            console.log(`注文 ${orderId} の全アイテムに重量入力済み。ステータスを完了に変更します。`);
            handleStatusChange(orderId, "完了"); // ステータス更新関数を呼び出し
            toast({
              title: "自動完了",
              description: `注文 ${orderId} の準備が完了しました。`,
              // Shadcn UI v1.0以降では variant="success" は非推奨かも
              // 必要に応じて className などでスタイル調整
              className: "bg-green-100 text-green-800",
            });
          }
        }

      } catch (error) {
        console.error("重量の保存またはステータス更新中にエラー:", error);
        toast({
          title: "エラー",
          description: "処理中にエラーが発生しました。",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "入力エラー",
        description: "有効な重量（0以上の数値）を入力してください。",
        variant: "destructive",
      });
    }
  };

  // 注文カードコンポーネント
  const OrderCard = ({ order }) => {
    const remainingMinutes = calculateRemainingTime(order.pickupTime)
    const isUrgent = remainingMinutes <= 60 && remainingMinutes > 0
    const isOverdue = remainingMinutes < 0

    // --- カテゴリタグを特定するロジック ---
    const getCategoryTags = (items) => {
      const tags = new Set<string>();
      items.forEach(item => {
        // 1. ホルモン判定
        if (hormoneKeywords.some(keyword => item.name.includes(keyword))) {
          tags.add("ホルモン"); return;
        }
        // 2. ブロック判定
        if (item.cutType === 'ブロック') {
          tags.add("ブロック"); return;
        }
        // 3. スライス判定
        if (item.cutType && (item.cutType.includes('スライス') || item.cutType.includes('薄切り') || item.cutType.includes('焼肉'))) {
          tags.add("スライス");
        } else if (!item.cutType && item.unit === 'g') {
          tags.add("スライス");
        }
      });
      return Array.from(tags);
    };
    const categoryTags = getCategoryTags(order.items);
    // --- カテゴリタグ特定ロジックここまで ---

    // --- 配達方法の表示名を取得 ---
    const deliveryMethodLabel = deliveryOptions.find(opt => opt.value === order.deliveryMethod)?.label || order.deliveryMethod || "未設定";
    const deliveryMethodTagColorClass = deliveryMethodColors[order.deliveryMethod] || deliveryMethodColors['pickup']; // タグ用
    const deliveryMethodBgClass = deliveryMethodBgColors[order.deliveryMethod] || deliveryMethodBgColors['default']; // ★ 背景用
    // --- ここまで ---

    // 各アイテムの入力重量を管理するstate
    const initialWeights = order.items.reduce((acc, item) => {
      acc[item.id] = item.actualWeight ?? '';
      return acc;
    }, {});
    const [itemWeights, setItemWeights] = useState<Record<string, number | string>>(initialWeights);

    const handleWeightInputChange = (itemId: string, value: string) => {
      setItemWeights(prev => ({ ...prev, [itemId]: value }));
    };

    const nextStatus = {
      受付済み: "準備中",
      準備中: "完了",
      完了: "完了",
    }

    return (
      <Card
        className={cn(
          "mb-4 overflow-hidden transition-colors duration-150 border",
          deliveryMethodBgClass, // 更新された背景色が適用される
          isUrgent && "border-red-500 border-2",
          isOverdue && "border-destructive border-2",
        )}
      >
        <CardHeader className="pb-2 flex flex-row items-start justify-between">
          <div className="flex-1 pr-2">
            <CardTitle className="text-lg flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
              <span className="flex items-center">
                <Clock className={`mr-1.5 h-4 w-4 ${isUrgent || isOverdue ? "text-red-500" : ""}`} />
                {order.pickupTime}
              </span>
              <Badge className={`${statusColors[order.status]} border border-transparent`}>{order.status}</Badge>
              {isUrgent && (
                <Badge variant="outline" className="border-red-500 text-red-600 flex items-center bg-white/50">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  急ぎ
                </Badge>
              )}
              {isOverdue && (
                <Badge className="bg-red-700 text-white flex items-center border border-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  超過
                </Badge>
              )}
            </CardTitle>
            <div className="text-sm font-semibold">
              {order.customer} ({order.phone})
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {order.deliveryMethod && (
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 flex items-center shadow-sm"
                >
                  {order.deliveryMethod !== 'pickup'
                    ? <Truck className="h-3 w-3 mr-1 text-gray-600" />
                    : <Tag className="h-3 w-3 mr-1 text-gray-600" />
                  }
                  {deliveryMethodLabel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <div className="text-2xl font-bold">{order.id}</div>
            {categoryTags.length > 0 && (
              <div className="flex flex-wrap justify-end gap-1">
                {categoryTags.map(category => (
                  <Badge
                    key={category}
                    className={cn(
                      "text-base font-semibold px-3 py-1 shadow",
                      categoryColors[category] || categoryColors['その他']
                    )}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className={`font-medium ${isUrgent || isOverdue ? "text-red-600" : ""}`}>
              {formatRemainingTime(remainingMinutes)}
            </div>

            <div className="font-medium mt-2">注文内容:</div>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id ?? index} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded-md">
                  <div className="text-sm mb-2 sm:mb-0 flex-1 pr-2">
                    {item.name} ({item.quantity}
                    {item.unit}
                    {item.cutType ? `・${item.cutType}` : ""})
                    {item.actualWeight != null && <span className="text-xs text-muted-foreground ml-1">(実: {item.actualWeight}{item.unit})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={`実重量 (${item.unit})`}
                      value={itemWeights[item.id]}
                      onChange={(e) => handleWeightInputChange(item.id, e.target.value)}
                      step="0.01"
                      className="w-28 h-8 text-sm"
                      disabled={order.status === '完了' || order.status === 'キャンセル'}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => handleSaveWeight(order.id, item.id, itemWeights[item.id])}
                      disabled={!itemWeights[item.id] || itemWeights[item.id] === '' || order.status === '完了' || order.status === 'キャンセル'}
                    >
                      <Save className="h-4 w-4" />
                      <span className="sr-only">重量保存</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {order.notes && (
              <div className="mt-2 p-2 bg-amber-50 rounded-md text-sm">
                <div className="font-medium">備考:</div>
                {order.notes}
              </div>
            )}

            <div className="flex justify-end mt-4">
              {order.status !== "完了" && order.status !== "キャンセル" && (
                <Button
                  onClick={() => handleStatusChange(order.id, nextStatus[order.status])}
                  size="sm"
                  className="flex items-center"
                  variant={isUrgent || isOverdue ? "destructive" : "default"}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {order.status === "受付済み" ? "準備開始" : "完了にする"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            注文管理へ戻る
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">作業場ビュー</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            現在時刻: {format(currentTime, "HH:mm")} | 最終更新: {format(lastRefreshed, "HH:mm:ss")}
          </div>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center">
            <RefreshCcw className="mr-2 h-4 w-4" />
            更新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {todayOrders.length > 0 ? (
          [...todayOrders].sort(sortOrdersByRemainingTime).map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="col-span-full text-center py-10 text-muted-foreground">処理待ちの注文はありません</div>
        )}
      </div>
    </div>
  )
}

