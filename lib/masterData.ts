// 部位の選択肢リスト
export const meatParts = [
  { value: "rosu", label: "ロース" },
  { value: "bara", label: "バラ" },
  { value: "momo", label: "モモ" },
  { value: "kata-rosu", label: "肩ロース" },
  { value: "hire", label: "ヒレ" },
  { value: "tan", label: "タン" },
  { value: "harami", label: "ハラミ" },
  { value: "other", label: "その他" },
];

// 商品リスト (これも共通化できるかもしれません)
export const meatProducts = [
  { id: "slice", name: "スライス", unit: "g" },
  { id: "block", name: "ブロック", unit: "g" },
  { id: "organ", name: "ホルモン", unit: "g" },
];

// 冷蔵/冷凍 オプション
export const storageOptions = [
  { value: "refrigerated", label: "冷蔵" },
  { value: "frozen", label: "冷凍" },
];

// 配達方法の選択肢
export const deliveryOptions = [
  { value: "local", label: "地元配達" },
  { value: "hiroshima", label: "広島配達" },
  { value: "sagawa", label: "佐川急便" },
  { value: "yamato", label: "ヤマト運輸" },
  { value: "pickup", label: "店頭受け取り" },
];

// 必要であれば他の共通データもここに追加
