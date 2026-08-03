// Meal templates extracted from the original menuData.ts
// These are immutable templates that users claim for specific dates

export interface IngredientDetail {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealTemplate {
  id: string;
  label: string;
  emoji: string;
  dayType: "training" | "rest";
  rice: IngredientDetail;
  hardyVeg: IngredientDetail[];
  meat: IngredientDetail;
  greenVeg: IngredientDetail;
  seasoning: string[];
  tips: string;
  totalKcal: number;
  macros: { protein: number; carbs: number; fat: number };
  dayTotalKcal: number;
  dayDeficit: number;
}

// ─────────────────────────────────────────────────────────────
// Nutrition Profile (Conservative Estimate)
// Male, 32y, 188cm, 76kg, 18% BF
// BMR (Katch-McArdle): 1716 kcal
// Sedentary TDEE: 2059 kcal (×1.2)
// Training extra: ~200 kcal/day avg (4 sessions/week)
// Conservative TDEE: 2259 kcal
// Target intake: 1759 kcal (500 deficit)
//
// Fixed daily inputs:
//   Milk 500ml: 305 kcal, P16, C24, F18
//   Training day eggs (5): 390 kcal, P31.5, C3, F26.5
//   Rest day eggs (3): 234 kcal, P18.9, C1.8, F15.9
//
// Rice cooker meal (one pot = lunch + dinner):
//   Training day: Rice 200g, Chicken 250g, Oil 5g → 1122 kcal, P94.5, C157, F10.5
//   Rest day:     Rice 200g, Chicken 300g, Oil 10g → 1234 kcal, P110, C157, F16
//
// Training day total: 1818 kcal, deficit 442 kcal, P142g
// Rest day total:     1773 kcal, deficit 486 kcal, P145g
// ─────────────────────────────────────────────────────────────

// Training day ingredients
const riceT: IngredientDetail = {
  name: "白米饭", amount: "200g（生米）", kcal: 700, protein: 14, carbs: 150, fat: 2,
};
const chickenT: IngredientDetail = {
  name: "鸡胸肉", amount: "250g（生重）", kcal: 333, protein: 77.5, carbs: 0, fat: 3,
};
const oilT: IngredientDetail = {
  name: "食用油", amount: "5g（半汤匙）", kcal: 45, protein: 0, carbs: 0, fat: 5,
};

// Rest day ingredients
const riceR: IngredientDetail = {
  name: "白米饭", amount: "200g（生米）", kcal: 700, protein: 14, carbs: 150, fat: 2,
};
const chickenR: IngredientDetail = {
  name: "鸡胸肉", amount: "300g（生重）", kcal: 399, protein: 93, carbs: 0, fat: 3.6,
};
const oilR: IngredientDetail = {
  name: "食用油", amount: "10g（1汤匙）", kcal: 90, protein: 0, carbs: 0, fat: 10,
};

const soySauce: IngredientDetail = {
  name: "生抽", amount: "15ml（1汤匙）", kcal: 15, protein: 1, carbs: 1, fat: 0,
};
const salt: IngredientDetail = {
  name: "盐", amount: "2g（少许）", kcal: 0, protein: 0, carbs: 0, fat: 0,
};

function makeMeal(
  id: string,
  label: string,
  emoji: string,
  dayType: "training" | "rest",
  hardyVegDetails: IngredientDetail[],
  greenVegName: string,
  greenVegKcal: number,
  greenVegP: number,
  greenVegC: number,
  greenVegF: number,
  tips: string
): MealTemplate {
  const baseRice = dayType === "training" ? riceT : riceR;
  const baseChicken = dayType === "training" ? chickenT : chickenR;
  const baseOil = dayType === "training" ? oilT : oilR;

  const greenVeg: IngredientDetail = {
    name: greenVegName, amount: "100g", kcal: greenVegKcal, protein: greenVegP, carbs: greenVegC, fat: greenVegF,
  };
  const everything = [baseRice, baseChicken, ...hardyVegDetails, baseOil, soySauce, salt, greenVeg];
  const totalKcal = everything.reduce((s, i) => s + i.kcal, 0);
  const protein = everything.reduce((s, i) => s + i.protein, 0);
  const carbs = everything.reduce((s, i) => s + i.carbs, 0);
  const fat = everything.reduce((s, i) => s + i.fat, 0);

  const eggsKcal = dayType === "training" ? 390 : 234;
  const dayTotalKcal = 305 + eggsKcal + totalKcal;
  const dayDeficit = 2259 - dayTotalKcal;

  return {
    id, label, emoji, dayType,
    rice: baseRice,
    hardyVeg: hardyVegDetails,
    meat: baseChicken,
    greenVeg,
    seasoning: ["盐 2g", dayType === "training" ? "食用油 5g" : "食用油 10g", "生抽 15ml"],
    tips,
    totalKcal: Math.round(totalKcal),
    macros: { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) },
    dayTotalKcal: Math.round(dayTotalKcal),
    dayDeficit: Math.round(dayDeficit),
  };
}

export const MEAL_TEMPLATES: MealTemplate[] = [
  // ── 健身日 1-4 ──
  makeMeal(
    "training_1", "健身日 1", "💪",
    "training",
    [
      { name: "白萝卜", amount: "100g", kcal: 16, protein: 0.6, carbs: 3.4, fat: 0 },
      { name: "胡萝卜", amount: "100g", kcal: 32, protein: 0.9, carbs: 7.6, fat: 0.2 },
    ],
    "菠菜", 24, 2.6, 2.8, 0.3,
    "白萝卜切薄片更易入味，与鸡肉的油脂融合后汤汁鲜甜。"
  ),
  makeMeal(
    "training_2", "健身日 2", "🔥",
    "training",
    [
      { name: "莲藕", amount: "100g", kcal: 47, protein: 1.2, carbs: 11.5, fat: 0.2 },
      { name: "胡萝卜", amount: "100g", kcal: 32, protein: 0.9, carbs: 7.6, fat: 0.2 },
    ],
    "生菜", 13, 1.3, 1.8, 0.2,
    "莲藕切薄片铺在米上，蒸出来粉糯带脆，口感层次丰富。"
  ),
  makeMeal(
    "training_3", "健身日 3", "⚡",
    "training",
    [
      { name: "南瓜", amount: "100g", kcal: 22, protein: 0.7, carbs: 5.3, fat: 0.1 },
      { name: "香菇", amount: "100g", kcal: 26, protein: 2.2, carbs: 5.2, fat: 0.3 },
    ],
    "油菜", 23, 1.8, 2.7, 0.5,
    "南瓜自带甜味，蒸出来米饭染上金黄色，香菇提鲜效果一流。"
  ),
  makeMeal(
    "training_4", "健身日 4", "🏋️",
    "training",
    [
      { name: "白萝卜", amount: "100g", kcal: 16, protein: 0.6, carbs: 3.4, fat: 0 },
      { name: "豆角", amount: "100g", kcal: 31, protein: 1.4, carbs: 6.7, fat: 0.1 },
    ],
    "空心菜", 19, 2.2, 2.2, 0.2,
    "豆角掰成小段铺在米饭上，蒸出来软烂入味，训练后补充碳水效果很好。"
  ),
  // ── 非健身日 1-3 ──
  makeMeal(
    "rest_1", "非健身日 1", "🌿",
    "rest",
    [
      { name: "冬瓜", amount: "100g", kcal: 11, protein: 0.4, carbs: 2.6, fat: 0 },
      { name: "白萝卜", amount: "100g", kcal: 16, protein: 0.6, carbs: 3.4, fat: 0 },
    ],
    "小白菜", 13, 1.2, 1.6, 0.2,
    "冬瓜水分多，蒸饭时可适当减少加水量，让米饭粒粒分明。"
  ),
  makeMeal(
    "rest_2", "非健身日 2", "🍃",
    "rest",
    [
      { name: "冬瓜", amount: "100g", kcal: 11, protein: 0.4, carbs: 2.6, fat: 0 },
      { name: "胡萝卜", amount: "100g", kcal: 32, protein: 0.9, carbs: 7.6, fat: 0.2 },
    ],
    "芥兰", 19, 1.6, 2.0, 0.3,
    "休息日可以切几片姜铺在鸡肉上去腥，蒸出来更香。"
  ),
  makeMeal(
    "rest_3", "非健身日 3", "🌙",
    "rest",
    [
      { name: "莲藕", amount: "100g", kcal: 47, protein: 1.2, carbs: 11.5, fat: 0.2 },
      { name: "香菇", amount: "100g", kcal: 26, protein: 2.2, carbs: 5.2, fat: 0.3 },
    ],
    "菠菜", 24, 2.6, 2.8, 0.3,
    "莲藕和香菇搭配鸡胸肉，鲜味叠加，是休息日最丰盛的一餐。"
  ),
];

export const NUTRITION_PROFILE = {
  gender: "男",
  age: 32,
  height: "188 cm",
  weight: "76 kg",
  bodyFat: "18%",
  goal: "减脂至 14%",
  trainingFreq: "每周 3-4 次",
  bmrKatch: 1716,
  bmrMifflin: 1780,
  bmrNote: "Katch-McArdle（基于瘦体重）",
  tdeeSedentary: 2059,
  tdeeConservative: 2259,
  tdeeStandard: 2660,
  tdeeNote: "保守估算：久坐 TDEE + 训练日均消耗",
  targetCalories: 1759,
  deficit: 500,
  milk: { name: "全脂牛奶 500ml", kcal: 305, protein: 16, carbs: 24, fat: 18 },
  eggsTraining: { name: "煮鸡蛋 5 个（健身日）", kcal: 390, protein: 31.5, carbs: 3, fat: 26.5 },
  eggsRest: { name: "煮鸡蛋 3 个（非健身日）", kcal: 234, protein: 18.9, carbs: 1.8, fat: 15.9 },
  trainingPot: {
    kcal: 1122, protein: 94.5, carbs: 157, fat: 10.5,
    rice: "200g", chicken: "250g", oil: "5g",
  },
  trainingDay: { kcal: 1818, protein: 142, carbs: 184, fat: 55, deficit: 442 },
  restPot: {
    kcal: 1234, protein: 110, carbs: 157, fat: 16.1,
    rice: "200g", chicken: "300g", oil: "10g",
  },
  restDay: { kcal: 1773, protein: 145, carbs: 183, fat: 50, deficit: 486 },
  note: "保守估算 TDEE 2259 kcal（久坐 2059 + 训练日均 200）。一锅蒸饭分午晚两餐。牛奶和鸡蛋为固定加餐，大米/油盐酱油自行储备。",
};

export const COOKING_STEPS = [
  { step: 1, title: "洗米加水", desc: "将 200g 大米淘洗干净，按米和水 1:1.2 的比例加入清水。" },
  { step: 2, title: "铺耐煮菜", desc: "将切好的耐煮蔬菜（各 100g）均匀铺在米上。" },
  { step: 3, title: "铺鸡肉", desc: "健身日 250g / 非健身日 300g 鸡胸肉切块铺在蔬菜上方，撒 2g 盐和食用油（健身日 5g / 非健身日 10g）。" },
  { step: 4, title: "启动蒸煮", desc: "按下电饭锅煮饭键，开始蒸煮。普通煮饭程序约 25-30 分钟。" },
  { step: 5, title: "放绿叶菜", desc: "电饭锅跳起后打开盖子，将 100g 绿叶菜铺在米饭上面。" },
  { step: 6, title: "余热焖熟", desc: "盖上盖子，利用余热焖 5 分钟左右，绿叶菜即可熟透。" },
  { step: 7, title: "调味拌匀", desc: "打开盖子，加入 15ml 生抽，将所有食材和米饭混合均匀，分成午晚两餐。" },
];
