import { trpc } from "@/lib/trpc";
import { Dumbbell, UtensilsCrossed, Flame, TrendingUp, Plus, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getWeekday(): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[new Date().getDay()];
}

export default function Home() {
  const today = useMemo(() => getTodayStr(), []);
  const weekday = useMemo(() => getWeekday(), []);
  const [, setLocation] = useLocation();

  const { data: workoutLogs, isLoading: workoutLoading } = trpc.workout.getByDate.useQuery({ date: today });
  const { data: dietLog, isLoading: dietLoading } = trpc.diet.getByDate.useQuery({ date: today });
  const { data: workoutHistory } = trpc.workout.list.useQuery({ limit: 30 });
  const { data: dietHistory } = trpc.diet.list.useQuery({ limit: 30 });

  const streak = useMemo(() => {
    if (!workoutHistory && !dietHistory) return 0;
    const allDates = new Set<string>();
    [...(workoutHistory ?? []), ...(dietHistory ?? [])].forEach(log => allDates.add(log.date));

    let count = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if (allDates.has(dateStr)) {
        count++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [workoutHistory, dietHistory]);

  const totalRecords = (workoutHistory?.length ?? 0) + (dietHistory?.length ?? 0);
  const dietData = dietLog?.data as any;
  const hasWorkouts = workoutLogs && workoutLogs.length > 0;

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{weekday}</span>
          <span>·</span>
          <span>{today}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">今日概览</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl p-4 card-shadow border border-border/40">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground font-medium">连续记录</span>
          </div>
          <p className="text-2xl font-bold">{streak}<span className="text-sm text-muted-foreground ml-1">天</span></p>
        </div>
        <div className="bg-card rounded-2xl p-4 card-shadow border border-border/40">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">训练次数</span>
          </div>
          <p className="text-2xl font-bold">{workoutHistory?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 card-shadow border border-border/40">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">总记录</span>
          </div>
          <p className="text-2xl font-bold">{totalRecords}</p>
        </div>
      </div>

      {/* Today's Workout */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            今日训练
          </h2>
          <button onClick={() => setLocation("/workout")} className="text-sm text-primary flex items-center gap-1 tap-feedback">
            <Plus className="h-4 w-4" />
            {hasWorkouts ? "添加" : "认领训练"}
          </button>
        </div>
        {workoutLoading ? (
          <div className="h-24 bg-card rounded-2xl animate-pulse border border-border/40" />
        ) : hasWorkouts ? (
          <div className="flex flex-col gap-2">
            {workoutLogs!.map((wl) => (
              <button
                key={wl.id}
                onClick={() => setLocation("/workout")}
                className="bg-card rounded-2xl p-5 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{wl.templateTitle}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      wl.intensity === "high" ? "bg-red-500/15 text-red-500" :
                      wl.intensity === "medium" ? "bg-orange-500/15 text-orange-500" :
                      "bg-green-500/15 text-green-500"
                    }`}>
                      {wl.intensity === "high" ? "高强度" : wl.intensity === "medium" ? "中强度" : "低强度"}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    wl.completed === "completed" ? "bg-green-500/15 text-green-500" :
                    wl.completed === "in_progress" ? "bg-yellow-500/15 text-yellow-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {wl.completed === "completed" ? "已完成" : wl.completed === "in_progress" ? "进行中" : "待开始"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    wl.category === "main" ? "bg-primary/10 text-primary" :
                    wl.category === "core" ? "bg-orange-500/10 text-orange-500" :
                    "bg-blue-500/10 text-blue-500"
                  }`}>
                    {wl.category === "main" ? "主训练" : wl.category === "core" ? "核心" : "有氧"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setLocation("/workout")}
            className="bg-card rounded-2xl p-5 card-shadow border border-dashed border-border/60 text-left tap-feedback hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">认领今日训练模板</p>
                <p className="text-xs">选择一个训练日模板开始记录</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Today's Diet */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            今日饮食
          </h2>
          {!dietLog && (
            <button onClick={() => setLocation("/diet")} className="text-sm text-primary flex items-center gap-1 tap-feedback">
              <Plus className="h-4 w-4" />
              认领餐单
            </button>
          )}
        </div>
        {dietLoading ? (
          <div className="h-24 bg-card rounded-2xl animate-pulse border border-border/40" />
        ) : dietLog ? (
          <button
            onClick={() => setLocation("/diet")}
            className="bg-card rounded-2xl p-5 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{dietLog.templateLabel}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  dietLog.dayType === "training" ? "bg-orange-500/15 text-orange-500" : "bg-blue-500/15 text-blue-500"
                }`}>
                  {dietLog.dayType === "training" ? "健身日" : "休息日"}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            {dietData && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{dietData.dayTotalKcal} kcal</span>
                <span>P {dietData.macros?.protein}g</span>
                <span>C {dietData.macros?.carbs}g</span>
                <span>F {dietData.macros?.fat}g</span>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={() => setLocation("/diet")}
            className="bg-card rounded-2xl p-5 card-shadow border border-dashed border-border/60 text-left tap-feedback hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">认领今日餐单模板</p>
                <p className="text-xs">选择一个饮食日模板开始记录</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">快捷操作</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLocation("/workout")}
            className="bg-card rounded-2xl p-4 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors"
          >
            <Dumbbell className="h-6 w-6 text-primary mb-2" />
            <p className="text-sm font-medium">训练记录</p>
            <p className="text-xs text-muted-foreground">查看模板、认领训练</p>
          </button>
          <button
            onClick={() => setLocation("/diet")}
            className="bg-card rounded-2xl p-4 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors"
          >
            <UtensilsCrossed className="h-6 w-6 text-primary mb-2" />
            <p className="text-sm font-medium">饮食记录</p>
            <p className="text-xs text-muted-foreground">查看模板、认领餐单</p>
          </button>
        </div>
      </div>
    </div>
  );
}
