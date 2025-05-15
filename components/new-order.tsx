"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Plus, ArrowLeft, Minus, CalendarIcon, Check, ChevronsUpDown, UserSearch, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useOrders } from "@/contexts/order-context"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ja } from 'date-fns/locale'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// ▼▼▼ 共通データインポート ▼▼▼
import { meatParts, meatProducts, storageOptions, deliveryOptions } from "@/lib/masterData"; // パスはプロジェクト構成に合わせて調整
// ▲▲▲ 共通データインポート ▲▲▲

// 時間帯オプション
const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

// 数量プリセット
const quantityPresets = [100, 200, 300, 500, 1000]

// ★ OrderItemInput 型に part を追加
type OrderItemInput = {
  productId: string
  quantity: number
  cutType: string
  unit: 'g' | '枚'
  storageType: 'refrigerated' | 'frozen'
  part: string // 部位
}

// 顧客の好み設定の型定義
type CustomerPreference = {
  phone: string;
  preferences: {
    [productId: string]: string; // 商品IDと切り方の対応
  };
}

// ★ ファイル内の meatParts, meatProducts, storageOptions, deliveryOptions の直接定義は削除する

interface SearchedCustomer {
  id: string;
  name: string;
  phone: string;
}

export default function NewOrder() {
  const router = useRouter()
  const { addOrder } = useOrders()
  const { toast } = useToast()
  const [customerName, setCustomerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string>("12:00")
  const [deliveryMethod, setDeliveryMethod] = useState<string>("pickup")
  // ★ orderItems の初期値に part を追加 (デフォルト: 空文字)
  const [orderItems, setOrderItems] = useState<OrderItemInput[]>([
    { productId: "", quantity: 0, cutType: "", unit: "g", storageType: "refrigerated", part: "" },
  ])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customerPreferences, setCustomerPreferences] = useState<CustomerPreference[]>([])

  // オートコンプリート用 state
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false)
  const [searchedCustomers, setSearchedCustomers] = useState<SearchedCustomer[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)

  // 顧客情報入力時に過去の好みを取得
  useEffect(() => {
    // 電話番号が入力されたら保存されている好みを読み込む
    if (phoneNumber.length >= 5) {
      loadCustomerPreferences(phoneNumber);
    }
  }, [phoneNumber]);

  // 顧客の好みを読み込む関数
  const loadCustomerPreferences = (phone: string) => {
    // ローカルストレージから取得する
    const savedPreferences = localStorage.getItem('customerPreferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences) as CustomerPreference[];
      setCustomerPreferences(preferences);
      
      // この顧客の好みがあれば、それを適用
      const customerPref = preferences.find(p => p.phone === phone);
      if (customerPref) {
        // 現在選択されている商品に対して好みの切り方を適用
        const updatedItems = orderItems.map(item => {
          if (item.productId && customerPref.preferences[item.productId]) {
            return { ...item, cutType: customerPref.preferences[item.productId] };
          }
          return item;
        });
        setOrderItems(updatedItems);
      }
    }
  };

  // 商品選択時に好みの切り方を自動適用
  const handleProductSelect = (index: number, productId: string) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], productId };
    
    // この顧客のこの商品に対する好みがあれば適用
    const customerPref = customerPreferences.find(p => p.phone === phoneNumber);
    if (customerPref && customerPref.preferences[productId]) {
      newItems[index].cutType = customerPref.preferences[productId];
    }
    
    setOrderItems(newItems);
  };

  // 顧客の好みを保存する関数
  const saveCustomerPreferences = () => {
    if (!phoneNumber) return;
    
    // 現在の好み設定を取得
    const savedPreferences = localStorage.getItem('customerPreferences');
    let preferences: CustomerPreference[] = savedPreferences 
      ? JSON.parse(savedPreferences) 
      : [];
    
    // この顧客の設定があるか確認
    const customerIndex = preferences.findIndex(p => p.phone === phoneNumber);
    
    // 今回の注文内容から好みを抽出
    const newPreferences: {[productId: string]: string} = {};
    orderItems.forEach(item => {
      if (item.productId) {
        newPreferences[item.productId] = item.cutType;
      }
    });
    
    if (customerIndex >= 0) {
      // 既存の顧客設定を更新
      preferences[customerIndex].preferences = {
        ...preferences[customerIndex].preferences,
        ...newPreferences
      };
    } else {
      // 新規顧客として追加
      preferences.push({
        phone: phoneNumber,
        preferences: newPreferences
      });
    }
    
    // 保存
    localStorage.setItem('customerPreferences', JSON.stringify(preferences));
  };

  // 商品を追加 (part のデフォルトも設定)
  const addItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 0, cutType: "", unit: "g", storageType: "refrigerated", part: "" }])
  }

  // 商品を削除
  const removeItem = (index: number) => {
    const newItems = [...orderItems]
    newItems.splice(index, 1)
    setOrderItems(newItems)
  }

  // 商品を更新 (part も扱える)
  const updateItem = (index: number, field: keyof OrderItemInput, value: string | number) => {
    const newItems = [...orderItems]
    if (field === 'storageType') {
        newItems[index] = { ...newItems[index], [field]: value as 'refrigerated' | 'frozen' };
    } else {
        newItems[index] = { ...newItems[index], [field]: value };
    }
    setOrderItems(newItems)
  }

  // 顧客名入力ハンドラ (Popover内のCommandInput用)
  const handleSearchQueryChange = (search: string) => {
    setCustomerSearchQuery(search);
  };

  // 既存顧客選択ハンドラ
  const handleExistingCustomerSelect = (customer: SearchedCustomer) => {
    setCustomerName(customer.name);
    setPhoneNumber(customer.phone);
    setCustomerSearchQuery(customer.name);
    setOpenCustomerPopover(false);
    setSearchedCustomers([]);
  };

  // ★ 新規顧客として登録するハンドラ
  const handleNewCustomerSelect = () => {
    if (customerSearchQuery.trim() === "") return; // 何も入力されていなければ何もしない

    setCustomerName(customerSearchQuery.trim());
    setPhoneNumber(""); // 新規顧客なので電話番号はクリア
    setOpenCustomerPopover(false);
    setSearchedCustomers([]);
    setCustomerSearchQuery(customerSearchQuery.trim()); // 選択された名前を保持（表示用）
    toast({
      title: "新規顧客",
      description: `「${customerSearchQuery.trim()}」さんを新規顧客として扱います。電話番号を入力してください。`,
    });
  };

  // ★ 新規登録オプションを表示するかどうかの判定
  const showNewCustomerOption =
    customerSearchQuery.trim() !== "" &&
    !isSearchingCustomers &&
    !searchedCustomers.some(
      (customer) => customer.name.toLowerCase() === customerSearchQuery.trim().toLowerCase()
    );

  // 注文を送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // 入力バリデーション
      if (!customerName || !phoneNumber) {
        toast({
          title: "エラー",
          description: "顧客情報を入力してください",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (orderItems.some((item) => !item.productId)) {
        toast({
          title: "エラー",
          description: "すべての商品を選択してください",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!deliveryMethod) {
        toast({
          title: "エラー",
          description: "配達方法を選択してください",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (!selectedDate) {
        toast({ title: "エラー", description: "日付を選択してください", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // --- ▼▼▼ データベースへの顧客保存処理を追加 ▼▼▼ ---
      if (customerName && phoneNumber) {
        // ここで Prisma を使って顧客情報をDBに保存する処理を呼び出す
        // 例: API ルートを呼び出す場合
        try {
          const response = await fetch('/api/customers', { // APIルートのエンドポイント例
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customerName, phone: phoneNumber }),
          });
          if (!response.ok) {
            throw new Error('顧客情報の保存に失敗しました');
          }
          console.log("顧客情報をデータベースに保存/確認しました。");
        } catch (dbError) {
          console.error("顧客情報の保存中にエラー:", dbError);
          toast({ title: "データベースエラー", description: "顧客情報の保存に失敗しました。", variant: "destructive" });
          // エラー時に処理を中断するかどうかは要件による
          // setIsSubmitting(false);
          // return;
        }
      } else {
         console.warn("顧客名または電話番号が入力されていないため、DB保存をスキップします。");
      }
      // --- ▲▲▲ ここまで追加 ▲▲▲ ---

      // 顧客の好みを保存
      saveCustomerPreferences();

      // 選択された日付をフォーマット
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      // 注文データを作成
      const orderData = {
        customer: customerName,
        phone: phoneNumber,
        items: orderItems.map((item) => {
          const product = meatProducts.find((p) => p.id === item.productId)
          return {
            id: `${Date.now()}-${item.productId}-${Math.random().toString(16).slice(2)}`,
            name: product?.name || "",
            quantity: item.quantity,
            unit: item.unit,
            cutType: item.cutType,
            storageType: item.storageType,
            part: item.part,
            actualWeight: undefined,
          }
        }),
        status: "受付済み",
        date: formattedDate,
        pickupTime: time,
        deliveryMethod: deliveryMethod,
        notes,
      }

      console.log("注文データを追加します:", orderData)

      // 注文を追加
      addOrder(orderData as any)

      // 成功メッセージを表示
      toast({
        title: "注文が作成されました",
        description: "注文リストに追加されました",
      })

      // 少し待ってから注文一覧ページに戻る
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push("/")
    } catch (error) {
      console.error("注文の追加処理全体でエラー:", error)
      toast({
        title: "エラーが発生しました",
        description: "注文の作成に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 簡易的なdebounce useEffect (lodashを使わない場合)
  useEffect(() => {
    if (customerSearchQuery.trim().length < 1) {
      setSearchedCustomers([]);
      return;
    }
    const timerId = setTimeout(async () => {
      setIsSearchingCustomers(true);
      try {
        const response = await fetch(`/api/customers/search?name=${encodeURIComponent(customerSearchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSearchedCustomers(data.customers || []);
      } catch (error) {
        console.error("顧客検索APIエラー:", error);
        setSearchedCustomers([]);
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 500); // 500msの遅延

    return () => clearTimeout(timerId);
  }, [customerSearchQuery]);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">新規注文</h1>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 顧客情報 */}
          <Card>
            <CardHeader>
              <CardTitle>顧客情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerNameInput">お名前</Label>
                <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomerPopover}
                      className="w-full justify-between font-normal h-9"
                      onClick={() => {
                         setOpenCustomerPopover(!openCustomerPopover);
                         if (!openCustomerPopover) { // ポップオーバーを開くとき
                            setCustomerSearchQuery(customerName); // 現在の顧客名で検索クエリを初期化
                         }
                      }}
                    >
                      {customerName || <span className="text-muted-foreground"></span>}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder=""
                        value={customerSearchQuery}
                        onValueChange={handleSearchQueryChange}
                        className="h-9"
                        id="customerNameInput"
                        autoComplete="off"
                      />
                      <CommandList>
                        {isSearchingCustomers && <CommandEmpty>検索中...</CommandEmpty>}
                        {!isSearchingCustomers && searchedCustomers.length === 0 && customerSearchQuery.trim() !== "" && !showNewCustomerOption && (
                          <CommandEmpty>該当なし</CommandEmpty>
                        )}
                        {!isSearchingCustomers && searchedCustomers.length === 0 && customerSearchQuery.trim() === "" && (
                          <CommandEmpty>お名前を入力してください</CommandEmpty>
                        )}
                        <CommandGroup>
                          {searchedCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => handleExistingCustomerSelect(customer)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", customerName === customer.name ? "opacity-100" : "opacity-0")} />
                              <div>
                                <div>{customer.name}</div>
                                <div className="text-xs text-muted-foreground">{customer.phone}</div>
                              </div>
                            </CommandItem>
                          ))}
                          {/* ▼ 新規顧客として登録オプション ▼ */}
                          {showNewCustomerOption && (
                            <CommandItem
                              key="new-customer-option" // ユニークなキー
                              onSelect={handleNewCustomerSelect}
                              className="text-blue-600 hover:text-blue-700" // スタイルは任意
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              「{customerSearchQuery.trim()}」を新規顧客として登録
                            </CommandItem>
                          )}
                          {/* ▲ 新規顧客として登録オプション ▲ */}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">電話番号</Label>
                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required autoComplete="tel-national"/>
              </div>
            </CardContent>
          </Card>

          {/* ▼▼▼ 日付選択 ▼▼▼ */}
          <Card>
            <CardHeader>
              <CardTitle>
                {deliveryMethod === 'pickup' ? '受け取り日' : '配達希望日'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "yyyy年 M月 d日 (E)", { locale: ja }) : <span>日付を選択</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={ja}
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          {/* ▲▲▲ 日付選択ここまで ▲▲▲ */}

          {/* 受け取り/配達希望時間 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {deliveryMethod === 'pickup' ? '受け取り時間' : '配達希望時間'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time">
                  {deliveryMethod === 'pickup' ? '時間' : '希望時間'}
                </Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="時間を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ▼▼▼ 配達方法選択 ▼▼▼ */}
          <Card>
            <CardHeader>
              <CardTitle>配達方法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">方法を選択</Label>
                <Select value={deliveryMethod} onValueChange={setDeliveryMethod} required>
                  <SelectTrigger id="deliveryMethod">
                    <SelectValue placeholder="配達方法を選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>配達オプション</SelectLabel>
                      {deliveryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {deliveryMethod !== 'pickup' && (
                <p className="text-xs text-muted-foreground">
                  配達時間は目安となります。交通状況により遅れる場合があります。
                </p>
              )}
            </CardContent>
          </Card>
          {/* ▲▲▲ 配達方法選択ここまで ▲▲▲ */}

        </div>

        {/* 注文内容 */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>注文内容</CardTitle>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              商品を追加
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {orderItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50/80">
                  {/* 上段: 部位、商品、数量、単位 */}
                  <div className="flex flex-col md:flex-row gap-4 items-start mb-3">
                    {/* ▼ 部位選択 (flex-1 を適用) ▼ */}
                    <div className="flex-1 space-y-1"> {/* md:w-[130px] を flex-1 に変更 */}
                      <Label htmlFor={`part-${index}`}>部位</Label>
                      <Select
                        value={item.part}
                        onValueChange={(value) => updateItem(index, "part", value)}
                      >
                        <SelectTrigger id={`part-${index}`} className="h-9">
                          <SelectValue placeholder="部位を選択..." />
                        </SelectTrigger>
                        <SelectContent>
                          {meatParts.map(partOption => (
                            <SelectItem key={partOption.value} value={partOption.value}>
                              {partOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* ▲ 部位選択ここまで ▲ */}

                    {/* ▼ 商品選択 (flex-1 を適用) ▼ */}
                    <div className="flex-1 space-y-1"> {/* md:w-[130px] を flex-1 に変更 */}
                      <Label htmlFor={`product-${index}`}>商品タイプ</Label>
                      <Select value={item.productId} onValueChange={(value) => handleProductSelect(index, value)}>
                        <SelectTrigger id={`product-${index}`} className="h-9">
                          <SelectValue placeholder="タイプを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="slice">スライス</SelectItem>
                          <SelectItem value="block">ブロック</SelectItem>
                          <SelectItem value="organ">ホルモン</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* ▲ 商品選択ここまで ▲ */}

                    {/* 数量 (変更なし - この幅が固定されているため、上記2つが残りを分け合う) */}
                    <div className="w-full md:w-auto space-y-1">
                      <Label htmlFor={`quantity-${index}`}>数量</Label>
                      <div className="flex items-center space-x-1">
                        <Input
                          id={`quantity-${index}`} type="number" min="1"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => { const nv = parseInt(e.target.value, 10); updateItem(index, "quantity", isNaN(nv) || nv < 1 ? 0 : nv); }}
                          className="text-center w-20 rounded-md h-9"
                          placeholder="例: 100"
                        />
                        <Select value={item.unit} onValueChange={(value: 'g' | '枚') => updateItem(index, "unit", value)} >
                          <SelectTrigger id={`unit-${index}`} className="w-[65px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent> <SelectItem value="g">g</SelectItem> <SelectItem value="枚">枚</SelectItem> </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* 下段: 切り方、冷蔵/冷凍、削除ボタン (変更なし) */}
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* 切り方は flex-1 のまま */}
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={`cutType-${index}`}>切り方</Label>
                      <Input
                        id={`cutType-${index}`} value={item.cutType}
                        onChange={(e) => updateItem(index, "cutType", e.target.value)}
                        placeholder="例: 焼肉用、薄切り、指定なし"
                        className="h-9"
                      />
                    </div>
                    {/* 状態（冷蔵/冷凍） */}
                    <div className="w-full md:w-[120px] space-y-1">
                      <Label htmlFor={`storageType-${index}`}>状態</Label>
                      <Select
                        value={item.storageType}
                        onValueChange={(value: 'refrigerated' | 'frozen') => updateItem(index, "storageType", value)}
                      >
                        <SelectTrigger id={`storageType-${index}`} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {storageOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* 削除ボタン */}
                    <div className="w-full md:w-auto flex items-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={orderItems.length === 1}
                        className={cn("text-red-500 hover:text-red-700 h-9 w-9", orderItems.length === 1 && "opacity-50 cursor-not-allowed")} >
                        <Trash2 className="h-4 w-4" /> <span className="sr-only">削除</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 備考 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="特別な要望や指示があればこちらに記入してください"
            />
          </CardContent>
        </Card>

        {/* 注文サマリーと送信ボタン */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>注文サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderItems.map((item, index) => {
                const product = meatProducts.find((p) => p.id === item.productId)
                if (!product) return null
                const storageLabel = storageOptions.find(opt => opt.value === item.storageType)?.label || '';
                const partLabel = meatParts.find(p => p.value === item.part)?.label || '';
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {product.name}
                      {partLabel ? ` (${partLabel})` : ''}
                      {' '}({item.quantity}{item.unit}
                      {item.cutType ? `・${item.cutType}` : ''}
                      {storageLabel ? `・${storageLabel}` : ''})
                    </span>
                  </div>
                )
              })}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{deliveryMethod === 'pickup' ? '受取日' : '配達希望日'}</span>
                <span>{selectedDate ? format(selectedDate, "yyyy/MM/dd (E)", { locale: ja }) : '未選択'}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>配達方法</span>
                <span>{deliveryOptions.find(opt => opt.value === deliveryMethod)?.label || '未選択'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "処理中..." : "注文を確定する"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

