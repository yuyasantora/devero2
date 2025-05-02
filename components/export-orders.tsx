"use client"

import { useState, useEffect } from "react"
import { useOrders } from "@/contexts/order-context"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import { Download, Calendar } from "lucide-react"

export default function ExportOrders() {
  const { completedOrders } = useOrders()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  // 本日の完了済み注文のみをフィルタリング
  const getTodayCompletedOrders = () => {
    const today = format(new Date(), "yyyy-MM-dd")
    return completedOrders.filter(order => order.date === today)
  }

  // すべての完了済み注文を取得
  const getAllCompletedOrders = () => {
    return completedOrders
  }

  // 注文データをExcelにエクスポート
  const exportToExcel = (orders: any[], fileName: string) => {
    try {
      setIsExporting(true)

      // エクスポート用のデータを整形
      const exportData = orders.map(order => {
        // 商品情報を一つの文字列にまとめる
        const itemsDetail = order.items.map(item => 
          `${item.name} ${item.quantity}${item.unit} (${item.cutType || "未指定"})`
        ).join(" / ")

        return {
          '注文ID': order.id,
          '日付': order.date,
          '顧客名': order.customer,
          '電話番号': order.phone,
          '受取時間': order.pickupTime,
          '商品詳細': itemsDetail,
          '合計金額': `¥${order.total.toLocaleString()}`,
          'ステータス': order.status,
          '備考': order.notes || ''
        }
      })

      // WorkSheetを作成
      const ws = XLSX.utils.json_to_sheet(exportData)

      // 列幅の設定
      const colWidths = [
        { wch: 10 }, // 注文ID
        { wch: 12 }, // 日付
        { wch: 15 }, // 顧客名
        { wch: 15 }, // 電話番号
        { wch: 10 }, // 受取時間
        { wch: 50 }, // 商品詳細
        { wch: 12 }, // 合計金額
        { wch: 10 }, // ステータス
        { wch: 20 }, // 備考
      ]
      ws['!cols'] = colWidths

      // WorkBookを作成
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '注文データ')

      // ファイルとして保存
      XLSX.writeFile(wb, `${fileName}.xlsx`)

      toast({
        title: "エクスポート完了",
        description: "注文データをExcelファイルに保存しました",
      })
    } catch (error) {
      console.error("エクスポートエラー:", error)
      toast({
        title: "エラーが発生しました",
        description: "エクスポートに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 今日の注文をエクスポート
  const exportTodayOrders = () => {
    const todayOrders = getTodayCompletedOrders()
    if (todayOrders.length === 0) {
      toast({
        title: "エクスポートできません",
        description: "今日の完了済み注文データがありません",
        variant: "destructive",
      })
      return
    }
    
    const today = format(new Date(), "yyyyMMdd")
    exportToExcel(todayOrders, `注文データ_${today}`)
  }

  // すべての注文をエクスポート
  const exportAllOrders = () => {
    const allOrders = getAllCompletedOrders()
    if (allOrders.length === 0) {
      toast({
        title: "エクスポートできません",
        description: "完了済み注文データがありません",
        variant: "destructive",
      })
      return
    }
    
    exportToExcel(allOrders, `全注文データ_${format(new Date(), "yyyyMMdd")}`)
  }

  // 自動エクスポート機能
  useEffect(() => {
    // 営業終了時間を確認する関数
    const checkForAutomaticExport = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // 例: 19:00に自動エクスポート（営業終了時間に合わせて調整）
      if (hours === 19 && minutes === 0) {
        const todayOrders = getTodayCompletedOrders();
        if (todayOrders.length > 0) {
          const today = format(new Date(), "yyyyMMdd");
          exportToExcel(todayOrders, `自動エクスポート_${today}`);
          
          toast({
            title: "自動エクスポート完了",
            description: "本日の注文データが自動的にエクスポートされました",
          });
        }
      }
    };
    
    // 1分ごとに時間をチェック
    const interval = setInterval(checkForAutomaticExport, 60000);
    
    // クリーンアップ
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-2">
      <Button 
        onClick={exportTodayOrders} 
        disabled={isExporting}
        className="flex items-center"
      >
        <Calendar className="mr-2 h-4 w-4" />
        今日の注文をエクスポート
      </Button>
      
      <Button 
        onClick={exportAllOrders} 
        disabled={isExporting}
        variant="outline"
        className="flex items-center"
      >
        <Download className="mr-2 h-4 w-4" />
        全ての完了済み注文をエクスポート
      </Button>
    </div>
  )
}
