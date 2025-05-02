"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, Plus, Clock, CheckCircle, AlertTriangle, ClipboardList, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/contexts/order-context"
import { format, parse, differenceInMinutes } from "date-fns"
import ExportOrders from "@/components/export-orders"
import { useToast } from "@/hooks/use-toast"

const statusColors: Record<string, string> = {
  受付済み: "bg-blue-100 text-blue-800",
  準備中: "bg-yellow-100 text-yellow-800",
  完了: "bg-green-100 text-green-800",
  キャンセル: "bg-red-100 text-red-800",
}

const statusIcons = {
  受付済み: <ClipboardList className="h-4 w-4 mr-1" />,
  準備中: <Clock className="h-4 w-4 mr-1" />,
  完了: <CheckCircle className="h-4 w-4 mr-1" />,
  キャンセル: <AlertTriangle className="h-4 w-4 mr-1" />,
}

export default function OrderManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const { orders, updateOrderStatus, clearOrders } = useOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("すべて")
  const [dateFilter, setDateFilter] = useState("すべて")
  const [displayOrders, setDisplayOrders] = useState(orders)
  const [currentTime, setCurrentTime] = useState(null)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    setLastRefreshed(new Date())
    setIsMounted(true)
  }, [])

  // 画面更新用の関数
  const handleRefresh = () => {
    setCurrentTime(new Date())
    setLastRefreshed(new Date())
    // 必要に応じてデータの再取得処理をここに追加
  }

  // 30秒ごとに自動更新
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefresh()
    }, 30000)
    
    return () => clearInterval(timer)
  }, [])

  // ordersが変更されたら表示用の状態も更新
  useEffect(() => {
    console.log("注文管理画面: 注文リストが更新されました", orders)
    setDisplayOrders(orders)
  }, [orders])

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

  // Filter orders based on search term and filters
  const filteredOrders = displayOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone.includes(searchTerm)

    const matchesStatus = statusFilter === "すべて" || order.status === statusFilter
    const matchesDate = dateFilter === "すべて" || order.date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  // Get unique dates for the filter
  const uniqueDates = Array.from(new Set(displayOrders.map((order) => order.date)))

  // ステータス変更ハンドラー
  const handleStatusChange = (id: string, status: string) => {
    updateOrderStatus(id, status)
  }

  // ダッシュボード用のサマリーデータを計算
  const pendingOrders = orders.filter((order) => order.status === "受付済み").length
  const inProgressOrders = orders.filter((order) => order.status === "準備中").length
  const completedOrders = orders.filter((order) => order.status === "完了").length
  const cancelledOrders = orders.filter((order) => order.status === "キャンセル").length

  // 緊急注文（1時間以内）の数を計算
  const urgentOrders = orders.filter((order) => {
    const remainingTime = calculateRemainingTime(order.pickupTime)
    return remainingTime <= 60 && remainingTime > 0 && order.status !== "完了" && order.status !== "キャンセル"
  }).length

  // ステータス別の注文数を計算
  const statusCounts = {
    all: orders.length,
    pending: orders.filter(order => order.status === "受付済み").length,
    inProgress: orders.filter(order => order.status === "準備中").length,
    completed: orders.filter(order => order.status === "完了").length,
  }

  // リセット処理用の関数を追加
  const handleResetOrders = () => {
    // 確認ダイアログを表示
    if (window.confirm("本当にすべての注文データをリセットしますか？この操作は元に戻せません。")) {
      if (typeof clearOrders === 'function') {
        try {
          clearOrders(); // useOrders から提供されたリセット関数を実行
          toast({
            title: "リセット完了",
            description: "すべての注文データが削除されました。",
          });
          // 必要に応じて画面を再描画するために state を更新するなどの処理を追加
          // (例: setDisplayOrders([]) など。useOrders の実装による)
        } catch (error) {
          console.error("注文のリセット中にエラー:", error);
          toast({
            title: "リセット失敗",
            description: "注文のリセット中にエラーが発生しました。",
            variant: "destructive",
          });
        }
      } else {
        // clearOrders 関数が useOrders から提供されていない場合のエラー処理
        console.error("clearOrders 関数が order-context で提供されていません。");
        toast({
          title: "設定エラー",
          description: "リセット機能が正しく設定されていません。",
          variant: "destructive",
        });
      }
    }
  };

  if (!isMounted) {
    return null // or a placeholder
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ディブロ注文管理</h1>
          <p className="text-muted-foreground mt-1">ディブロの注文を管理します</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="text-sm text-muted-foreground self-center mr-2">
            最終更新: {format(lastRefreshed, "HH:mm:ss")}
          </div>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center">
            <RefreshCcw className="mr-2 h-4 w-4" />
            更新
          </Button>
          <Button variant="outline" onClick={() => router.push("/workspace")}>
            <Clock className="mr-2 h-4 w-4" />
            作業場ビュー
          </Button>
          <Button onClick={() => router.push("/new-order")}>
            <Plus className="mr-2 h-4 w-4" />
            新規注文
          </Button>
          <Button variant="outline" onClick={handleResetOrders} className="text-red-500 hover:text-red-700">
            <AlertTriangle className="mr-2 h-4 w-4" />
            リセット
          </Button>
        </div>
      </div>

      {/* ダッシュボードサマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">受付済み</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">準備中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressOrders}件</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">完了</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}件</div>
          </CardContent>
        </Card>
      </div>

      {urgentOrders > 0 && (
        <Card className="mb-6 border-red-500 bg-red-50">
          <CardContent className="p-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="font-medium text-red-700">緊急注文が {urgentOrders}件 あります（受取まで1時間以内）</span>
            <Button variant="destructive" size="sm" className="ml-auto" onClick={() => router.push("/workspace")}>
              作業場ビューで確認
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>注文フィルター</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="注文番号、顧客名、電話番号で検索..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータスで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="すべて">すべてのステータス</SelectItem>
                <SelectItem value="受付済み">
                  <div className="flex items-center">
                    {statusIcons["受付済み"]}
                    受付済み
                  </div>
                </SelectItem>
                <SelectItem value="準備中">
                  <div className="flex items-center">
                    {statusIcons["準備中"]}
                    準備中
                  </div>
                </SelectItem>
                <SelectItem value="完了">
                  <div className="flex items-center">
                    {statusIcons["完了"]}
                    完了
                  </div>
                </SelectItem>
                <SelectItem value="キャンセル">
                  <div className="flex items-center">
                    {statusIcons["キャンセル"]}
                    キャンセル
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="日付で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="すべて">すべての日付</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>注文一覧 ({filteredOrders.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>注文番号</TableHead>
                <TableHead>顧客情報</TableHead>
                <TableHead className="hidden md:table-cell">注文内容</TableHead>
                <TableHead className="hidden md:table-cell">受取時間</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const remainingTime = calculateRemainingTime(order.pickupTime)
                  const isUrgent =
                    remainingTime <= 60 && remainingTime > 0 && order.status !== "完了" && order.status !== "キャンセル"
                  const isOverdue = remainingTime < 0 && order.status !== "完了" && order.status !== "キャンセル"

                  return (
                    <TableRow key={order.id} className={`${isUrgent || isOverdue ? "bg-red-50 hover:bg-red-100" : "hover:bg-muted/50"} transition-colors`}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-muted-foreground">{order.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {order.items.map((item, index) => (
                            <li key={item.id ?? index}>
                              {item.name} ({item.quantity}
                              {item.unit}
                              {item.cutType ? `・${item.cutType}` : ""})
                              {typeof item.actualWeight === 'number' && item.actualWeight >= 0 && (
                                <span className="text-xs text-green-700 font-medium ml-1.5 italic">
                                  (実: {item.actualWeight}{item.unit})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col">
                          <div>{order.pickupTime}</div>
                          {(isUrgent || isOverdue) && (
                            <div className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
                              {formatRemainingTime(remainingTime)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || "bg-gray-100"} variant="outline">
                          <div className="flex items-center">
                            {statusIcons[order.status]}
                            {order.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">メニューを開く</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>アクション</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>詳細を表示</DropdownMenuItem>
                            <DropdownMenuItem>編集する</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>ステータス変更</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "受付済み")}>
                              <div className="flex items-center">
                                {statusIcons["受付済み"]}
                                受付済み
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "準備中")}>
                              <div className="flex items-center">
                                {statusIcons["準備中"]}
                                準備中
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "完了")}>
                              <div className="flex items-center">
                                {statusIcons["完了"]}
                                完了
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "キャンセル")}>
                              <div className="flex items-center">
                                {statusIcons["キャンセル"]}
                                キャンセル
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    該当する注文がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* エクスポート機能を追加 */}
      <div className="mb-6">
        <ExportOrders />
      </div>
    </div>
  )
}