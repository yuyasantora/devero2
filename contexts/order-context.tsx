"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ストレージキー定義
const STORAGE_KEY = "butcher-shop-orders"
const COMPLETED_ORDERS_KEY = "butcher-shop-completed-orders" // 完了注文用のキー

// 注文アイテムの型定義
export type OrderItem = {
  name: string
  quantity: number
  unit: string
  cutType?: string
}

// 注文の型定義
export type Order = {
  id: string
  customer: string
  phone: string
  items: OrderItem[]
  total: number
  status: string
  date: string
  pickupTime: string
  notes?: string
}

// コンテキストの型定義
type OrderContextType = {
  orders: Order[]
  completedOrders: Order[] // 完了済み注文リスト
  addOrder: (order: Omit<Order, "id">) => void
  updateOrderStatus: (id: string, status: string) => void
  getCompletedOrders: () => Order[] // 完了済み注文の取得メソッド
}

// コンテキスト作成
const OrderContext = createContext<OrderContextType | undefined>(undefined)

// Contextを使用するためのカスタムフック
export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}

// Providerコンポーネント
export function OrderProvider({ children }: { children: ReactNode }) {
  // 状態の初期化
  const [orders, setOrders] = useState<Order[]>([])
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]) // 完了済み注文
  const [isInitialized, setIsInitialized] = useState(false)

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // 通常の注文を読み込み
        const savedOrders = localStorage.getItem(STORAGE_KEY)
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders))
        }
        
        // 完了済み注文を読み込み
        const savedCompletedOrders = localStorage.getItem(COMPLETED_ORDERS_KEY)
        if (savedCompletedOrders) {
          setCompletedOrders(JSON.parse(savedCompletedOrders))
        }
      } catch (error) {
        console.error("Failed to load orders from localStorage:", error)
      }
      setIsInitialized(true)
    }
  }, [])

  // 注文データが変更されたらローカルストレージに保存
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    }
  }, [orders, isInitialized])
  
  // 完了済み注文が変更されたらローカルストレージに保存
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(COMPLETED_ORDERS_KEY, JSON.stringify(completedOrders))
    }
  }, [completedOrders, isInitialized])

  // 新規注文を追加する関数
  const addOrder = (order: Omit<Order, "id">) => {
    // 新しい注文IDを生成
    const newId = `ORD-${String(orders.length + 1).padStart(3, "0")}`

    // 新しい注文を作成
    const newOrder: Order = {
      ...order,
      id: newId,
      // 各アイテムにcutTypeがない場合はデフォルト値を設定
      items: order.items.map((item) => ({
        ...item,
        cutType: item.cutType || "",
      })),
    }

    // 注文リストに追加
    setOrders((prevOrders) => {
      const updatedOrders = [...prevOrders, newOrder]
      console.log("注文が追加されました:", newOrder)
      console.log("更新後の注文リスト:", updatedOrders)
      return updatedOrders
    })
  }

  // 注文ステータスを更新する関数
  const updateOrderStatus = (id: string, status: string) => {
    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
        if (order.id === id) {
          // ステータスが「完了」になった場合
          if (status === "完了") {
            const completedOrder = { ...order, status };
            
            // 完了済み注文リストに追加
            setCompletedOrders(prev => {
              // 既に同じIDの注文が存在しないことを確認
              if (!prev.some(o => o.id === id)) {
                return [...prev, completedOrder];
              }
              return prev;
            });
          }
          return { ...order, status };
        }
        return order;
      });
      return updatedOrders;
    });
  }
  
  // 完了済み注文を取得する関数
  const getCompletedOrders = () => {
    return completedOrders;
  }

  return (
    <OrderContext.Provider value={{ orders, completedOrders, addOrder, updateOrderStatus, getCompletedOrders }}>
      {children}
    </OrderContext.Provider>
  )
}

