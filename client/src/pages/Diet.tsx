import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { UtensilsCrossed, Plus, X, ChevronLeft, Trash2, Save, Edit3, Flame, Egg, Milk } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface IngredientDetail {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DietData {
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
  dayType?: string;
}

export default function DietPage() {
  const today = useMemo(() => getTodayStr(), []);
  const [location] = useLocation();
  const urlDate = useMemo(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const d = params.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today;
  }, [location, today]);
  const [selectedDate, setSelectedDate] = useState(urlDate);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localData, setLocalData] = useState<DietData | null>(null);

  const { data: templates, isLoading: templatesLoading } = trpc.diet.templates.useQuery();
  const { data: dietLog, isLoading: logLoading, refetch } = trpc.diet.getByDate.useQuery({ date: selectedDate });
  const claimMutation = trpc.diet.claim.useMutation();
  const updateMutation = trpc.diet.update.useMutation();
  const deleteMutation = trpc.diet.delete.useMutation();
  const utils = trpc.useUtils();

  const handleClaim = async (templateId: string) => {
    try {
      await claimMutation.mutateAsync({ date: selectedDate, templateId });
      toast.success("餐单模板已认领");
      setShowTemplates(false);
      refetch();
      utils.diet.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "认领失败");
    }
  };

  const handleDelete = async () => {
    if (!dietLog) return;
    if (!confirm("确认删除今日饮食记录？")) return;
    try {
      await deleteMutation.mutateAsync({ id: dietLog.id });
      toast.success("已删除饮食记录");
      refetch();
      utils.diet.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const startEdit = () => {
    setLocalData(JSON.parse(JSON.stringify(dietLog?.data)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setLocalData(null);
  };

  const saveEdit = async () => {
    if (!dietLog || !localData) return;
    try {
      await updateMutation.mutateAsync({ id: dietLog.id, data: localData });
      toast.success("饮食记录已保存");
      setEditing(false);
      setLocalData(null);
      refetch();
      utils.diet.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    }
  };

  const updateField = (path: string, value: any) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const recalcTotals = (data: DietData): DietData => {
    const allItems = [data.rice, ...data.hardyVeg, data.meat, data.greenVeg];
    const totalKcal = allItems.reduce((s, i) => s + (i.kcal || 0), 0);
    const protein = allItems.reduce((s, i) => s + (i.protein || 0), 0);
    const carbs = allItems.reduce((s, i) => s + (i.carbs || 0), 0);
    const fat = allItems.reduce((s, i) => s + (i.fat || 0), 0);
    const eggsKcal = data.dayType === "training" ? 390 : 234;
    const dayTotalKcal = 305 + eggsKcal + totalKcal;
    const dayDeficit = 2259 - dayTotalKcal;
    return {
      ...data,
      totalKcal: Math.round(totalKcal),
      macros: { protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) },
      dayTotalKcal: Math.round(dayTotalKcal),
      dayDeficit: Math.round(dayDeficit),
    };
  };

  const updateIngredient = (key: string, field: string, value: string) => {
    const numFields = ["kcal", "protein", "carbs", "fat"];
    const valueToUse = numFields.includes(field) ? (value === "" ? 0 : parseFloat(value)) : value;
    setLocalData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = key.split(".");
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = valueToUse;
      return recalcTotals(next);
    });
  };

  const updateHardyVeg = (idx: number, field: string, value: string) => {
    const numFields = ["kcal", "protein", "carbs", "fat"];
    const valueToUse = numFields.includes(field) ? (value === "" ? 0 : parseFloat(value)) : value;
    setLocalData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.hardyVeg[idx][field] = valueToUse;
      return recalcTotals(next);
    });
  };

  const addHardyVeg = () => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.hardyVeg.push({ name: "", amount: "100g", kcal: 0, protein: 0, carbs: 0, fat: 0 });
      return recalcTotals(next);
    });
  };

  const removeHardyVeg = (idx: number) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.hardyVeg.splice(idx, 1);
      return recalcTotals(next);
    });
  };

  const displayData: DietData | null = editing ? localData : (dietLog?.data as any) || null;

  // Ingredient row component
  const IngredientRow = ({ label, ingredient, path, onEdit }: {
    label: string;
    ingredient: IngredientDetail;
    path: string;
    onEdit: (field: string, value: string) => void;
  }) => (
    <div className="bg-card rounded-xl p-3 border border-border/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={ingredient.name}
            onChange={(e) => onEdit("name", e.target.value)}
            disabled={!editing}
            className="flex-1 bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm disabled:opacity-70"
          />
          <input
            type="text"
            value={ingredient.amount}
            onChange={(e) => onEdit("amount", e.target.value)}
            disabled={!editing}
            className="w-24 bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm text-center disabled:opacity-70"
          />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { key: "kcal", label: "kcal", color: "text-orange-500" },
            { key: "protein", label: "蛋白", color: "text-blue-500" },
            { key: "carbs", label: "碳水", color: "text-green-500" },
            { key: "fat", label: "脂肪", color: "text-yellow-500" },
          ].map((m) => (
            <div key={m.key} className="flex flex-col items-center">
              {editing ? (
                <input
                  type="number"
                  inputMode="decimal"
                  value={ingredient[m.key as keyof IngredientDetail] as number}
                  onChange={(e) => onEdit(m.key, e.target.value)}
                  className="w-full bg-muted/50 border border-border/40 rounded-lg px-1 py-1 text-xs text-center"
                />
              ) : (
                <span className={`text-sm font-semibold ${m.color}`}>{ingredient[m.key as keyof IngredientDetail] as number}</span>
              )}
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">饮食</h1>
          <p className="text-sm text-muted-foreground">{selectedDate}</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-card border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground"
        />
      </div>

      {/* Content */}
      {logLoading ? (
        <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
      ) : dietLog && !showTemplates ? (
        <div className="flex flex-col gap-4">
          {/* Diet header */}
          <div className="bg-card rounded-2xl p-5 card-shadow border border-border/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">{dietLog.templateLabel}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full ${
                dietLog.dayType === "training" ? "bg-orange-500/15 text-orange-500" : "bg-blue-500/15 text-blue-500"
              }`}>
                {dietLog.dayType === "training" ? "健身日" : "休息日"}
              </span>
            </div>
            {displayData && (
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center bg-muted/30 rounded-lg py-2">
                  <span className="text-lg font-bold text-orange-500">{displayData.dayTotalKcal}</span>
                  <span className="text-[10px] text-muted-foreground">全天 kcal</span>
                </div>
                <div className="flex flex-col items-center bg-muted/30 rounded-lg py-2">
                  <span className="text-lg font-bold text-blue-500">{displayData.macros?.protein}</span>
                  <span className="text-[10px] text-muted-foreground">蛋白 g</span>
                </div>
                <div className="flex flex-col items-center bg-muted/30 rounded-lg py-2">
                  <span className="text-lg font-bold text-green-500">{displayData.macros?.carbs}</span>
                  <span className="text-[10px] text-muted-foreground">碳水 g</span>
                </div>
                <div className="flex flex-col items-center bg-muted/30 rounded-lg py-2">
                  <span className="text-lg font-bold text-yellow-500">{displayData.macros?.fat}</span>
                  <span className="text-[10px] text-muted-foreground">脂肪 g</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={saveEdit} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback">
                  <Save className="h-4 w-4" /> 保存
                </button>
                <button onClick={cancelEdit} className="px-4 bg-muted text-muted-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback">
                  <X className="h-4 w-4" /> 取消
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit} className="flex-1 bg-card border border-border/40 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback hover:border-primary/30">
                  <Edit3 className="h-4 w-4" /> 编辑
                </button>
                <button onClick={handleDelete} className="px-4 bg-card border border-border/40 rounded-xl py-2.5 text-sm font-medium text-destructive flex items-center justify-center tap-feedback hover:border-destructive/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Fixed daily items */}
          {displayData && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">固定加餐</h3>
              <div className="bg-card rounded-xl p-3 border border-border/40 flex items-center gap-3">
                <Milk className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">全脂牛奶 500ml</p>
                  <p className="text-xs text-muted-foreground">305 kcal · P16 · C24 · F18</p>
                </div>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/40 flex items-center gap-3">
                <Egg className="h-5 w-5 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">煮鸡蛋 {dietLog.dayType === "training" ? "5 个" : "3 个"}</p>
                  <p className="text-xs text-muted-foreground">
                    {dietLog.dayType === "training" ? "390 kcal · P31.5 · C3 · F26.5" : "234 kcal · P18.9 · C1.8 · F15.9"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rice cooker meal ingredients */}
          {displayData && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">电饭锅一锅蒸（午+晚）</h3>

              {/* Rice */}
              <IngredientRow
                label="主食"
                ingredient={displayData.rice}
                path="rice"
                onEdit={(f, v) => updateIngredient("rice", f, v)}
              />

              {/* Hardy veg */}
              {displayData.hardyVeg.map((veg, idx) => (
                <div key={idx} className="relative">
                  <IngredientRow
                    label={`耐煮蔬菜 ${idx + 1}`}
                    ingredient={veg}
                    path={`hardyVeg.${idx}`}
                    onEdit={(f, v) => updateHardyVeg(idx, f, v)}
                  />
                  {editing && (
                    <button
                      onClick={() => removeHardyVeg(idx)}
                      className="absolute top-2 right-2 text-destructive tap-feedback"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {editing && (
                <button
                  onClick={addHardyVeg}
                  className="text-sm text-primary flex items-center gap-1 tap-feedback py-1"
                >
                  <Plus className="h-4 w-4" /> 添加耐煮蔬菜
                </button>
              )}

              {/* Meat */}
              <IngredientRow
                label="蛋白质"
                ingredient={displayData.meat}
                path="meat"
                onEdit={(f, v) => updateIngredient("meat", f, v)}
              />

              {/* Green veg */}
              <IngredientRow
                label="绿叶菜"
                ingredient={displayData.greenVeg}
                path="greenVeg"
                onEdit={(f, v) => updateIngredient("greenVeg", f, v)}
              />

              {/* Seasoning */}
              <div className="bg-card rounded-xl p-3 border border-border/40">
                <span className="text-xs text-muted-foreground font-medium">调味料</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {displayData.seasoning?.map((s, idx) => (
                    <span key={idx} className="text-xs bg-muted/50 px-2 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>

              {/* Tips */}
              {displayData.tips && (
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                  <p className="text-xs text-muted-foreground">{displayData.tips}</p>
                </div>
              )}

              {/* Meal totals */}
              <div className="bg-card rounded-xl p-4 border border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">一锅蒸营养合计</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold">{displayData.totalKcal}</span>
                    <span className="text-[10px] text-muted-foreground">kcal</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-blue-500">{displayData.macros?.protein}</span>
                    <span className="text-[10px] text-muted-foreground">蛋白 g</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-green-500">{displayData.macros?.carbs}</span>
                    <span className="text-[10px] text-muted-foreground">碳水 g</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-yellow-500">{displayData.macros?.fat}</span>
                    <span className="text-[10px] text-muted-foreground">脂肪 g</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">全天总摄入</span>
                  <span className="text-sm font-bold">{displayData.dayTotalKcal} kcal</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">热量缺口</span>
                  <span className="text-sm font-bold text-green-500">{displayData.dayDeficit} kcal</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Template selection */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">选择餐单模板</h2>
            {dietLog && (
              <button onClick={() => setShowTemplates(false)} className="text-sm text-muted-foreground flex items-center gap-1 tap-feedback">
                <ChevronLeft className="h-4 w-4" /> 返回
              </button>
            )}
          </div>
          {templatesLoading ? (
            <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
          ) : (
            <div className="flex flex-col gap-3">
              {templates?.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleClaim(t.id)}
                  disabled={claimMutation.isPending}
                  className="bg-card rounded-2xl p-5 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.emoji}</span>
                      <h3 className="text-base font-semibold">{t.label}</h3>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      t.dayType === "training" ? "bg-orange-500/15 text-orange-500" : "bg-blue-500/15 text-blue-500"
                    }`}>
                      {t.dayType === "training" ? "健身日" : "休息日"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.dayTotalKcal} kcal/天</span>
                    <span>P{t.macros.protein}g</span>
                    <span>C{t.macros.carbs}g</span>
                    <span>F{t.macros.fat}g</span>
                  </div>
                  {t.tips && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{t.tips}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
