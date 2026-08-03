import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Plus, Check, X, ChevronLeft, ChevronDown, Trash2, Save, Edit3, Copy } from "lucide-react";
import { WORKOUT_TEMPLATES, SECTION_CONFIG } from "@shared/workoutTemplates";
import { useLocation } from "wouter";

// Build exercise catalog grouped by section type from all templates
const EXERCISE_CATALOG: { type: string; label: string; exercises: { name: string; desc: string }[] }[] = (() => {
  const groups: Record<string, { name: string; desc: string }[]> = {};
  for (const tmpl of WORKOUT_TEMPLATES) {
    for (const session of [tmpl.sessionA, tmpl.sessionB].filter(Boolean) as any[]) {
      for (const section of ["warmup", "main", "cooldown"] as const) {
        for (const ex of session[section] || []) {
          if (!groups[section]) groups[section] = [];
          if (!groups[section].find(e => e.name === ex.name)) {
            groups[section].push({ name: ex.name, desc: ex.desc });
          }
        }
      }
    }
  }
  return Object.entries(groups).map(([type, exercises]) => ({
    type,
    label: SECTION_CONFIG[type as keyof typeof SECTION_CONFIG]?.label || type,
    exercises,
  }));
})();

import { toast } from "sonner";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface SetData {
  weight?: number;
  reps?: number;
  duration?: number;
  distance?: number;
  unit?: string; // "kg", "lb", or custom string
  done?: boolean;
  targetReps?: string;
  isBodyweight?: boolean;
  isTimed?: boolean;
  isDistance?: boolean;
  fromHistory?: boolean; // true if weight/reps auto-imported from last session
}

interface ExerciseData {
  name: string;
  desc?: string;
  exerciseType?: string;
  reps?: string;
  sets: SetData[];
}

interface SessionData {
  title: string;
  type?: string;
  durationMin?: number;
  restTime?: string;
  exercises: ExerciseData[];
}

const UNIT_OPTIONS = ["kg", "lb", "bodyweight", "自定义"];

export default function WorkoutPage() {
  const today = useMemo(() => getTodayStr(), []);
  const [location] = useLocation();
  // Read date from URL query param (e.g. /workout?date=2026-08-03)
  const urlDate = useMemo(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const d = params.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today;
  }, [location, today]);
  const [selectedDate, setSelectedDate] = useState(urlDate);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localData, setLocalData] = useState<any>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [collapsedLogs, setCollapsedLogs] = useState<Set<number>>(new Set());
  const [showExercisePicker, setShowExercisePicker] = useState<number | null>(null); // sessionIdx when picker open

  const { data: templates, isLoading: templatesLoading } = trpc.workout.templates.useQuery();
  const { data: workoutLogs, isLoading: logLoading, refetch } = trpc.workout.getByDate.useQuery({ date: selectedDate });
  const claimMutation = trpc.workout.claim.useMutation();
  const updateMutation = trpc.workout.update.useMutation();
  const deleteMutation = trpc.workout.delete.useMutation();
  const utils = trpc.useUtils();

  const toggleCollapse = (logId: number) => {
    setCollapsedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) next.delete(logId);
      else next.add(logId);
      return next;
    });
  };

  const handleClaim = async (templateId: string) => {
    try {
      await claimMutation.mutateAsync({ date: selectedDate, templateId });
      toast.success("训练模板已认领");
      setShowTemplates(false);
      refetch();
      utils.workout.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "认领失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此训练记录？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("已删除训练记录");
      refetch();
      utils.workout.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const startEdit = (log: any) => {
    setEditingId(log.id);
    setLocalData(JSON.parse(JSON.stringify(log.data)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setLocalData(null);
  };

  const saveEdit = async (logId: number) => {
    if (!localData) return;
    try {
      await updateMutation.mutateAsync({ id: logId, data: localData });
      toast.success("训练记录已保存");
      setEditingId(null);
      setLocalData(null);
      refetch();
      utils.workout.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    }
  };

  const updateSet = (sessionIdx: number, exIdx: number, setIdx: number, field: string, value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises[exIdx].sets[setIdx][field] = numValue;
      // Clear fromHistory flag when user manually edits weight or reps
      if (field === "weight" || field === "reps") {
        next.sessions[sessionIdx].exercises[exIdx].sets[setIdx].fromHistory = false;
      }
      return next;
    });
  };

  const updateSetUnit = (sessionIdx: number, exIdx: number, setIdx: number, value: string) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises[exIdx].sets[setIdx].unit = value;
      next.sessions[sessionIdx].exercises[exIdx].sets[setIdx].fromHistory = false;
      return next;
    });
  };

  const toggleSetDone = (sessionIdx: number, exIdx: number, setIdx: number) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises[exIdx].sets[setIdx].done = !next.sessions[sessionIdx].exercises[exIdx].sets[setIdx].done;
      return next;
    });
  };

  const addSet = (sessionIdx: number, exIdx: number) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const ex = next.sessions[sessionIdx].exercises[exIdx];
      const lastSet = ex.sets[ex.sets.length - 1] || {};
      ex.sets.push({
        weight: lastSet.weight || 0,
        reps: lastSet.reps || 0,
        unit: lastSet.unit || "kg",
        done: false,
      });
      return next;
    });
  };

  const removeSet = (sessionIdx: number, exIdx: number, setIdx: number) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises[exIdx].sets.splice(setIdx, 1);
      return next;
    });
  };

  const duplicateSet = (sessionIdx: number, exIdx: number, setIdx: number) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      const ex = next.sessions[sessionIdx].exercises[exIdx];
      const copy = { ...ex.sets[setIdx], done: false };
      ex.sets.splice(setIdx + 1, 0, copy);
      return next;
    });
  };

  const addExercise = (sessionIdx: number, name: string, desc?: string) => {
    if (!name.trim()) return;
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises.push({
        name: name.trim(),
        desc: desc || "",
        exerciseType: "main",
        reps: "",
        sets: [{ weight: 0, reps: 0, unit: "kg", done: false }],
      });
      return next;
    });
    setNewExerciseName("");
    setShowExercisePicker(null);
  };

  const removeExercise = (sessionIdx: number, exIdx: number) => {
    setLocalData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.sessions[sessionIdx].exercises.splice(exIdx, 1);
      return next;
    });
  };

  const toggleSetDoneInline = async (log: any, sessionIdx: number, exIdx: number, setIdx: number) => {
    // Toggle done state directly on the log data and auto-save
    const newData = JSON.parse(JSON.stringify(log.data));
    const set = newData.sessions[sessionIdx].exercises[exIdx].sets[setIdx];
    set.done = !set.done;
    try {
      await updateMutation.mutateAsync({ id: log.id, data: newData });
      refetch();
    } catch (e: any) {
      toast.error(e.message || "更新失败");
    }
  };

  const markComplete = async (log: any) => {
    try {
      // Auto-mark all sets as done
      const newData = JSON.parse(JSON.stringify(log.data));
      if (newData?.sessions) {
        for (const session of newData.sessions) {
          if (session?.exercises) {
            for (const ex of session.exercises) {
              if (ex?.sets) {
                for (const set of ex.sets) {
                  set.done = true;
                }
              }
            }
          }
        }
      }
      await updateMutation.mutateAsync({ id: log.id, data: newData, completed: "completed" });
      toast.success("训练已完成！");
      refetch();
      utils.workout.list.invalidate();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  };

  const hasWorkouts = workoutLogs && workoutLogs.length > 0;

  return (
    <div className="flex flex-col gap-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">训练</h1>
          <p className="text-sm text-muted-foreground">{selectedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasWorkouts && !showTemplates && (
            <button
              onClick={() => setShowTemplates(true)}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1 tap-feedback"
            >
              <Plus className="h-4 w-4" /> 添加训练
            </button>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-card border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Content */}
      {logLoading ? (
        <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
      ) : showTemplates || !hasWorkouts ? (
        /* Template selection */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {hasWorkouts ? "添加训练模板" : "选择训练模板"}
            </h2>
            {hasWorkouts && (
              <button onClick={() => setShowTemplates(false)} className="text-sm text-muted-foreground flex items-center gap-1 tap-feedback">
                <ChevronLeft className="h-4 w-4" /> 返回
              </button>
            )}
          </div>
          {hasWorkouts && (
            <p className="text-xs text-muted-foreground">可在同一天添加多个训练（如力量训练 + 有氧训练）</p>
          )}
          {templatesLoading ? (
            <div className="h-40 bg-card rounded-2xl animate-pulse border border-border/40" />
          ) : (
            <div className="flex flex-col gap-3">
              {templates?.map((t) => {
                const sessionA = t.sessionA as any;
                const sessionB = t.sessionB as any;
                const exCount = (sessionA?.warmup?.length || 0) + (sessionA?.main?.length || 0) + (sessionA?.cooldown?.length || 0) +
                  (sessionB?.warmup?.length || 0) + (sessionB?.main?.length || 0) + (sessionB?.cooldown?.length || 0);
                return (
                  <button
                    key={t.id}
                    onClick={() => handleClaim(t.id)}
                    disabled={claimMutation.isPending}
                    className="bg-card rounded-2xl p-5 card-shadow border border-border/40 text-left tap-feedback hover:border-primary/30 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold">{t.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.category === "main" ? "bg-primary/15 text-primary" :
                        t.category === "core" ? "bg-orange-500/15 text-orange-500" :
                        "bg-blue-500/15 text-blue-500"
                      }`}>
                        {t.category === "main" ? "主训练" : t.category === "core" ? "核心" : "有氧"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded-full ${
                        t.intensity === "high" ? "bg-red-500/10 text-red-500" :
                        t.intensity === "medium" ? "bg-orange-500/10 text-orange-500" :
                        "bg-green-500/10 text-green-500"
                      }`}>
                        {t.intensity === "high" ? "高强度" : t.intensity === "medium" ? "中强度" : "低强度"}
                      </span>
                      <span>{exCount} 个项目</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Multiple workout logs */
        <div className="flex flex-col gap-5">
          {workoutLogs?.map((log) => {
            const isEditing = editingId === log.id;
            const displayData = isEditing ? localData : log.data;
            const sessions: SessionData[] = displayData?.sessions || [];

            return (
              <div key={log.id} className="flex flex-col gap-4">
                {/* Workout header (clickable to collapse/expand) */}
                <div
                  className="bg-card rounded-2xl p-5 card-shadow border border-border/40 cursor-pointer tap-feedback"
                  onClick={() => !isEditing && toggleCollapse(log.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${
                        collapsedLogs.has(log.id) ? "" : "rotate-180"
                      }`} />
                      <h2 className="text-xl font-bold">{log.templateTitle}</h2>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      log.intensity === "high" ? "bg-red-500/15 text-red-500" :
                      log.intensity === "medium" ? "bg-orange-500/15 text-orange-500" :
                      "bg-green-500/15 text-green-500"
                    }`}>
                      {log.intensity === "high" ? "高强度" : log.intensity === "medium" ? "中强度" : "低强度"}
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      log.category === "main" ? "bg-primary/10 text-primary" :
                      log.category === "core" ? "bg-orange-500/10 text-orange-500" :
                      "bg-blue-500/10 text-blue-500"
                    }`}>
                      {log.category === "main" ? "主训练" : log.category === "core" ? "核心" : "有氧"}
                    </span>
                  </div>
                </div>

                {/* Action buttons per log (always visible) */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(log.id)} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback">
                        <Save className="h-4 w-4" /> 保存
                      </button>
                      <button onClick={cancelEdit} className="px-4 bg-muted text-muted-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback">
                        <X className="h-4 w-4" /> 取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(log)} className="flex-1 bg-card border border-border/40 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback hover:border-primary/30">
                        <Edit3 className="h-4 w-4" /> 编辑
                      </button>
                      {log.completed !== "completed" && (
                        <button onClick={() => markComplete(log)} className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 tap-feedback">
                          <Check className="h-4 w-4" /> 完成
                        </button>
                      )}
                      <button onClick={() => handleDelete(log.id)} className="px-4 bg-card border border-border/40 rounded-xl py-2.5 text-sm font-medium text-destructive flex items-center justify-center tap-feedback hover:border-destructive/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Sessions (collapsible) */}
                {!collapsedLogs.has(log.id) && sessions.map((session, sIdx) => (
                  <div key={sIdx} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                      <h3 className="text-base font-semibold">{session.title}</h3>
                      {session.durationMin && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {session.durationMin} 分钟
                        </span>
                      )}
                    </div>

                    {session.exercises.map((ex, eIdx) => {
                      const allSetsDone = ex.sets.length > 0 && ex.sets.every((s: SetData) => s.done);
                      return (
                      <div key={eIdx} className={`bg-card rounded-2xl p-4 card-shadow border transition-colors ${
                        allSetsDone && !isEditing ? "border-green-500/30 bg-green-500/5" : "border-border/40"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-semibold ${allSetsDone && !isEditing ? "text-green-500" : ""}`}>{ex.name}</h4>
                          <div className="flex items-center gap-2">
                            {ex.reps && !isEditing && (
                              <span className="text-xs text-muted-foreground">目标: {ex.reps}</span>
                            )}
                            {isEditing && (
                              <button onClick={() => removeExercise(sIdx, eIdx)} className="text-destructive tap-feedback">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {ex.desc && !isEditing && (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ex.desc}</p>
                        )}
                          {!ex.desc && <div className="mb-3" />}

                        {/* Sets */}
                        <div className="flex flex-col gap-2">
                          {ex.sets.map((set, setIdx) => (
                            <div key={setIdx} className={`flex items-center gap-2 transition-opacity ${
                              set.done && !isEditing ? "opacity-50" : ""
                            }`}>
                              <span className="text-xs text-muted-foreground w-8">#{setIdx + 1}</span>

                              {/* Weight (for strength exercises) */}
                              {(!set.isTimed && !set.isDistance) && (
                                <div className="flex-1 flex items-center gap-1">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      step={2.5}
                                      value={set.weight || ""}
                                      onChange={(e) => updateSet(sIdx, eIdx, setIdx, "weight", e.target.value)}
                                      placeholder="0"
                                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm text-center"
                                    />
                                  ) : (
                                    <span className={`flex-1 text-sm text-center ${set.fromHistory ? "text-muted-foreground/50" : ""}`}>{set.weight || 0}</span>
                                  )}
                                  {/* Unit selector */}
                                  {isEditing ? (
                                    <select
                                      value={UNIT_OPTIONS.includes(set.unit || "kg") ? set.unit || "kg" : "自定义"}
                                      onChange={(e) => {
                                        if (e.target.value === "自定义") {
                                          const custom = prompt("输入自定义单位", set.unit || "");
                                          if (custom) updateSetUnit(sIdx, eIdx, setIdx, custom);
                                        } else {
                                          updateSetUnit(sIdx, eIdx, setIdx, e.target.value);
                                        }
                                      }}
                                      className="bg-muted/50 border border-border/40 rounded-lg px-1 py-1.5 text-xs text-center"
                                    >
                                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u === "bodyweight" ? "自重" : u}</option>)}
                                    </select>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{set.unit || "kg"}</span>
                                  )}
                                </div>
                              )}

                              {/* Duration (for timed exercises) */}
                              {set.isTimed && (
                                <div className="flex-1 flex items-center gap-1">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={set.duration || ""}
                                      onChange={(e) => updateSet(sIdx, eIdx, setIdx, "duration", e.target.value)}
                                      placeholder="0"
                                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm text-center"
                                    />
                                  ) : (
                                    <span className="flex-1 text-sm text-center">{set.duration || 0}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">秒</span>
                                </div>
                              )}

                              {/* Distance (for distance exercises) */}
                              {set.isDistance && (
                                <div className="flex-1 flex items-center gap-1">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={set.distance || ""}
                                      onChange={(e) => updateSet(sIdx, eIdx, setIdx, "distance", e.target.value)}
                                      placeholder="0"
                                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm text-center"
                                    />
                                  ) : (
                                    <span className="flex-1 text-sm text-center">{set.distance || 0}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">m</span>
                                </div>
                              )}

                              {/* Target reps hint (non-editing) */}
                              {set.targetReps && !isEditing && (
                                <span className="text-[10px] text-muted-foreground/60 w-20 text-center truncate">{set.targetReps}</span>
                              )}

                              {/* Reps (for strength/bodyweight exercises) */}
                              {!set.isTimed && !set.isDistance && (
                                <div className="flex-1 flex items-center gap-1">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={set.reps || ""}
                                      onChange={(e) => updateSet(sIdx, eIdx, setIdx, "reps", e.target.value)}
                                      placeholder="0"
                                      className="w-full bg-muted/50 border border-border/40 rounded-lg px-2 py-1.5 text-sm text-center"
                                    />
                                  ) : (
                                    <span className={`flex-1 text-sm text-center ${set.fromHistory ? "text-muted-foreground/50" : ""}`}>{set.reps || 0}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground">次</span>
                                </div>
                              )}

                              {/* Done toggle / remove */}
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => duplicateSet(sIdx, eIdx, setIdx)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center tap-feedback bg-muted/50 text-muted-foreground hover:bg-muted"
                                    title="复制此组"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => toggleSetDone(sIdx, eIdx, setIdx)}
                                    className={`h-7 w-7 rounded-lg flex items-center justify-center tap-feedback ${
                                      set.done ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => removeSet(sIdx, eIdx, setIdx)} className="text-destructive tap-feedback px-1">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleSetDoneInline(log, sIdx, eIdx, setIdx)}
                                  className={`h-8 w-8 rounded-lg flex items-center justify-center tap-feedback transition-colors ${
                                    set.done ? "bg-green-500/20 text-green-500" : "bg-muted/50 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
                                  }`}
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}

                          {isEditing && (
                            <button
                              onClick={() => addSet(sIdx, eIdx)}
                              className="text-xs text-primary flex items-center gap-1 mt-1 tap-feedback"
                            >
                              <Plus className="h-3 w-3" /> 添加一组
                            </button>
                          )}
                        </div>
                      </div>
                    );
                    })}

                    {/* Add exercise */}
                    {isEditing && (
                      <div className="mt-2">
                        {showExercisePicker === sIdx ? (
                          <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col gap-2">
                            {/* Manual text input at top */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addExercise(sIdx, newExerciseName)}
                                placeholder="手动输入训练项目名称…"
                                className="flex-1 bg-muted/50 border border-border/40 rounded-lg px-3 py-2 text-sm"
                              />
                              <button
                                onClick={() => addExercise(sIdx, newExerciseName)}
                                className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium tap-feedback"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            {/* Divider */}
                            <div className="flex items-center gap-2 py-1">
                              <div className="h-px bg-border/40 flex-1" />
                              <span className="text-[10px] text-muted-foreground">或从列表选择</span>
                              <div className="h-px bg-border/40 flex-1" />
                            </div>
                            {/* Two-level exercise list */}
                            <div className="max-h-48 overflow-y-auto flex flex-col gap-2">
                              {EXERCISE_CATALOG.map(group => (
                                <div key={group.type}>
                                  <div className={`text-xs font-semibold mb-1 ${SECTION_CONFIG[group.type as keyof typeof SECTION_CONFIG]?.color || ""}`}>
                                    {group.label}
                                  </div>
                                  {group.exercises.map(ex => (
                                    <button
                                      key={ex.name}
                                      onClick={() => addExercise(sIdx, ex.name, ex.desc)}
                                      className="w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-muted/50 tap-feedback flex items-center gap-2"
                                    >
                                      <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                                      <span>{ex.name}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => setShowExercisePicker(null)}
                              className="text-xs text-muted-foreground text-center py-1 tap-feedback"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowExercisePicker(sIdx)}
                            className="w-full border border-dashed border-border/40 rounded-xl py-2.5 text-sm text-muted-foreground flex items-center justify-center gap-1.5 tap-feedback hover:border-primary/30 hover:text-primary"
                          >
                            <Plus className="h-4 w-4" /> 添加训练项目
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
