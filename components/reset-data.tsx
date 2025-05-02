"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function ResetData() {
  const { toast } = useToast()
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = () => {
    setIsResetting(true)
    try {
      // ローカルストレージのデータをクリア
      localStorage.removeItem("butcher-shop-orders")
      localStorage.removeItem("butcher-shop-completed-orders")

      toast({
        title: "データをリセットしました",
        description: "すべての注文データが削除されました。",
      })

      // 1秒後にホームページにリダイレクト
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("データのリセットに失敗しました:", error)
      toast({
        title: "エラーが発生しました",
        description: "データのリセットに失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            データリセット
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">すべての注文データをリセットします。この操作は元に戻せません。</p>
          <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
            <p className="font-medium">警告:</p>
            <p className="text-sm">リセット後、すべての注文データが削除されます。</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/")}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
            {isResetting ? "リセット中..." : "データをリセットする"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

