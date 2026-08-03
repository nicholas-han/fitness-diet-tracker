import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Dumbbell, UtensilsCrossed, Download, History as HistoryIcon, Calendar, ChevronDown, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"workout" | "diet">("workout");
  const [, setLocation] = useLocation();
  const { data: workoutLogs, isLoading: workoutLoading } = trpc.workout.list.useQuery({ limit: 50 });
  const { data: dietLogs, isLoading: dietLoading } = trpc.diet.list.useQuery({ limit: 50 });
  const { data: exportData, refetch: refetchExport } = trpc.data.export.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    try {
      const result = await refetchExport();
      const data = result.data;
      if (!data) return;

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitness-diet-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("数据已导出");
    } catch (e: any) {
      toast.error("导出失败");
    }
  };

  const getWeekday = (dateStr: string) => {
    const days = ["日", "一", "二", "三", "四", "五", "六"];
    return days[new Date(dateStr).getDay()];
  };

  // Group workout logs by date
  const groupedWorkouts = useMemo(() => {
    if (!workoutLogs) return [];
    const groups: Record<string, typeof workoutLogs> = {};
    for (const log of workoutLogs) {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    }
    // Sort dates descending
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, logs]) => ({ date, logs }));
  }, [workoutLogs]);

  // Group diet logs by date
  const groupedDiets = useMemo(() => {
    if (!dietLogs) return [];
    const groups: Record<string, typeof dietLogs> = {};
    for (const log of dietLogs) {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, logs]) => ({ date, logs }));
  }, [dietLogs]);

  const handleEditWorkout = (date: string) => {
    setLocation(`/workout?date=${date}`);
  };

  const handleEditDiet = (date: string) => {
    setLocation(`/diet?date=${date}`);
  };

  return (
    <div className="flex flex-col gap-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">历史记录</h1>
          <p className="text-sm text-muted-foreground">查看所有训练和饮食记录</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-card border border-border/40 rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-1.5 tap-feedback hover:border-primary/30 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">导出 JSON</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("workout")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-all tap-feedback ${
            activeTab === "workout" ? "bg-card text-foreground card-shadow" : "text-muted-foreground"
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          训练 ({workoutLogs?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab("diet")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-all tap-feedback ${
            activeTab === "diet" ? "bg-card text-foreground card-shadow" : "text-muted-foreground"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          饮食 ({dietLogs?.length ?? 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === "workout" ? (
        workoutLoading ? (
          <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
        ) : groupedWorkouts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {groupedWorkouts.map(({ date, logs }) => (
              <div key={date} className="flex flex-col gap-2">
                {/* Date header */}
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{date}</span>
                  <span className="text-xs text-muted-foreground">周{getWeekday(date)}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{logs.length} 项训练</span>
                </div>

                {/* Workout logs under this date */}
                {logs.map((log) => {
                  const data = log.data as any;
                  const totalExercises = data?.sessions?.reduce((sum: number, s: any) => sum + (s.exercises?.length || 0), 0) || 0;
                  const totalSets = data?.sessions?.reduce((sum: number, s: any) =>
                    sum + s.exercises?.reduce((ss: number, e: any) => ss + (e.sets?.length || 0), 0), 0) || 0;
                  const doneSets = data?.sessions?.reduce((sum: number, s: any) =>
                    sum + s.exercises?.reduce((ss: number, e: any) => ss + (e.sets?.filter((set: any) => set.done).length || 0), 0), 0) || 0;

                  return (
                    <div
                      key={log.id}
                      className="bg-card rounded-2xl p-4 card-shadow border border-border/40 cursor-pointer tap-feedback hover:border-primary/30 transition-colors"
                      onClick={() => handleEditWorkout(date)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{log.templateTitle}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            log.category === "main" ? "bg-primary/10 text-primary" :
                            log.category === "core" ? "bg-orange-500/10 text-orange-500" :
                            "bg-blue-500/10 text-blue-500"
                          }`}>
                            {log.category === "main" ? "主训练" : log.category === "core" ? "核心" : "有氧"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.completed === "completed" ? "bg-green-500/15 text-green-500" :
                            log.completed === "in_progress" ? "bg-yellow-500/15 text-yellow-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {log.completed === "completed" ? "已完成" : log.completed === "in_progress" ? "进行中" : "待开始"}
                          </span>
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{totalExercises} 项 / {totalSets} 组</span>
                        <span>{doneSets}/{totalSets} 组完成</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <HistoryIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">暂无训练记录</p>
          </div>
        )
      ) : (
        dietLoading ? (
          <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
        ) : groupedDiets.length > 0 ? (
          <div className="flex flex-col gap-4">
            {groupedDiets.map(({ date, logs }) => (
              <div key={date} className="flex flex-col gap-2">
                {/* Date header */}
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{date}</span>
                  <span className="text-xs text-muted-foreground">周{getWeekday(date)}</span>
                </div>

                {/* Diet logs under this date */}
                {logs.map((log) => {
                  const data = log.data as any;
                  return (
                    <div
                      key={log.id}
                      className="bg-card rounded-2xl p-4 card-shadow border border-border/40 cursor-pointer tap-feedback hover:border-primary/30 transition-colors"
                      onClick={() => handleEditDiet(date)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{log.templateLabel}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.dayType === "training" ? "bg-orange-500/15 text-orange-500" : "bg-blue-500/15 text-blue-500"
                          }`}>
                            {log.dayType === "training" ? "健身日" : "休息日"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{data?.dayTotalKcal || 0} kcal</span>
                            <span>P{data?.macros?.protein || 0}g</span>
                          </div>
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <HistoryIcon className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">暂无饮食记录</p>
          </div>
        )
      )}
    </div>
  );
}
