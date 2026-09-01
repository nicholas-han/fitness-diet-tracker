import { useMemo, useState } from "react";
import { Activity, HeartPulse, Scale, Waves } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel, Section, Empty } from "@/components/os-ui";
import { baselineDeviation, movingAverage, rollingAverage, trendChange, useFitnessStore } from "@/lib/localStore";

type HistoryTab = "body" | "recovery" | "training" | "nutrition";

const signed = (value: number | undefined, digits = 1) => value === undefined ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(digits)}`;
const display = (value: number | undefined, suffix = "", digits = 1) => value === undefined ? "—" : `${value.toFixed(digits)}${suffix}`;
const chartValue = (value: number | undefined) => typeof value === "number" ? Math.round(value * 10) / 10 : null;

function HistoryChart({ data, lines }: { data: Array<Record<string, string | number | null>>; lines: Array<{ dataKey: string; color: string; name: string }> }) {
  if (data.length < 2) return <Empty><p className="text-sm">记录至少两次后显示趋势图</p></Empty>;
  return <div className="h-56 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={42} /><Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }} />{lines.map(line => <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.color} strokeWidth={2} dot={{ r: 2 }} connectNulls />)}</LineChart></ResponsiveContainer></div>;
}

export default function HistoryPage() {
  const { state } = useFitnessStore();
  const [tab, setTab] = useState<HistoryTab>("body");
  const sortedBody = useMemo(() => [...state.body].sort((a, b) => b.date.localeCompare(a.date)), [state.body]);
  const sortedRecovery = useMemo(() => [...state.recovery].sort((a, b) => b.date.localeCompare(a.date)), [state.recovery]);
  const sortedActivities = useMemo(() => [...state.activities].sort((a, b) => b.date.localeCompare(a.date)), [state.activities]);
  const recoveryAverageSleep = rollingAverage(state.recovery, 7, entry => entry.sleepHours);
  const bodyChart = useMemo(() => sortedBody.slice().reverse().map(entry => ({ date: entry.date.slice(5), weight: chartValue(entry.weight), waist: chartValue(entry.waist), bodyFat: chartValue(entry.bodyFat) })), [sortedBody]);
  const recoveryChart = useMemo(() => sortedRecovery.slice().reverse().map(entry => ({ date: entry.date.slice(5), sleep: chartValue(entry.sleepHours), hrv: chartValue(entry.hrv), restingHr: chartValue(entry.restingHr), whoop: chartValue(entry.whoopRecovery) })), [sortedRecovery]);

  return <div className="pb-10">
    <PageHeader eyebrow="History" title="历史与趋势" description="滚动平均帮助你看见方向，单日数据只作为上下文。" />
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {(["body", "recovery", "training", "nutrition"] as HistoryTab[]).map(item => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === item ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{item === "body" ? "Body" : item === "recovery" ? "Recovery" : item === "training" ? "Training" : "Nutrition"}</button>)}
    </div>
    {tab === "body" && <div className="space-y-6">
      <Section title="Rolling metrics" meta="以今天为结束日，按日历窗口计算"><div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel><p className="text-xs text-muted-foreground">7 日平均体重</p><p className="mt-1 text-2xl font-semibold">{display(movingAverage(state.body, 7))}</p><p className="text-xs text-muted-foreground">kg</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">14 日变化</p><p className="mt-1 text-2xl font-semibold">{signed(trendChange(state.body, 14, entry => entry.weight))}</p><p className="text-xs text-muted-foreground">kg</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">28 日趋势</p><p className="mt-1 text-2xl font-semibold">{signed(trendChange(state.body, 28, entry => entry.weight))}</p><p className="text-xs text-muted-foreground">kg</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">7 日平均睡眠</p><p className="mt-1 text-2xl font-semibold">{display(recoveryAverageSleep)}</p><p className="text-xs text-muted-foreground">h</p></Panel>
      </div></Section>
      <Section title="Body trends"><Panel><HistoryChart data={bodyChart} lines={[{ dataKey: "weight", color: "var(--chart-1)", name: "体重 kg" }, { dataKey: "waist", color: "var(--chart-2)", name: "腰围 cm" }, { dataKey: "bodyFat", color: "var(--chart-3)", name: "体脂 %" }]} /></Panel></Section>
      <Section title="Body log"><Panel>{sortedBody.length ? <div className="divide-y divide-border/50">{sortedBody.map(entry => <div key={entry.id} className="flex flex-wrap items-center gap-3 py-3 text-sm"><Scale className="h-4 w-4 text-primary" /><span className="w-24 text-muted-foreground">{entry.date}</span><span className="font-medium">{entry.weight ? `${entry.weight} kg` : "—"}</span><span className="text-muted-foreground">{entry.waist ? `腰围 ${entry.waist} cm` : ""}</span><span className="text-muted-foreground">{entry.bodyFat ? `体脂估计 ${entry.bodyFat}%` : ""}</span>{entry.photoRef && <span className="text-xs text-muted-foreground">照片：{entry.photoRef}</span>}</div>)}</div> : <Empty><p className="text-sm">还没有身体数据</p><p className="mt-1 text-xs text-muted-foreground">去 Log 记录第一笔晨起体重。</p></Empty>}</Panel></Section>
    </div>}
    {tab === "recovery" && <div className="space-y-6">
      <Section title="Recovery trends" meta="优先看滚动平均和多日变化"><div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Panel><p className="text-xs text-muted-foreground">睡眠（7 日平均）</p><p className="mt-1 text-2xl font-semibold">{display(rollingAverage(state.recovery, 7, entry => entry.sleepHours), " h")}</p><p className="text-xs text-muted-foreground">趋势 {signed(trendChange(state.recovery, 7, entry => entry.sleepHours))} · 基线 {signed(baselineDeviation(state.recovery, entry => entry.sleepHours))}</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">HRV（7 日平均）</p><p className="mt-1 text-2xl font-semibold">{display(rollingAverage(state.recovery, 7, entry => entry.hrv))}</p><p className="text-xs text-muted-foreground">趋势 {signed(trendChange(state.recovery, 7, entry => entry.hrv))} · 基线 {signed(baselineDeviation(state.recovery, entry => entry.hrv))}</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">静息心率（7 日平均）</p><p className="mt-1 text-2xl font-semibold">{display(rollingAverage(state.recovery, 7, entry => entry.restingHr), " bpm")}</p><p className="text-xs text-muted-foreground">趋势 {signed(trendChange(state.recovery, 7, entry => entry.restingHr))} · 基线 {signed(baselineDeviation(state.recovery, entry => entry.restingHr))}</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">WHOOP Recovery（7 日平均）</p><p className="mt-1 text-2xl font-semibold">{display(rollingAverage(state.recovery, 7, entry => entry.whoopRecovery))}</p><p className="text-xs text-muted-foreground">趋势 {signed(trendChange(state.recovery, 7, entry => entry.whoopRecovery))} · 基线 {signed(baselineDeviation(state.recovery, entry => entry.whoopRecovery))}</p></Panel>
      </div></Section>
      <Section title="Recovery trends chart"><Panel><HistoryChart data={recoveryChart} lines={[{ dataKey: "sleep", color: "var(--chart-1)", name: "睡眠 h" }, { dataKey: "hrv", color: "var(--chart-2)", name: "HRV" }, { dataKey: "whoop", color: "var(--chart-4)", name: "Recovery" }]} /></Panel></Section>
      <Section title="Recovery log"><Panel>{sortedRecovery.length ? <div className="divide-y divide-border/50">{sortedRecovery.map(entry => <div key={entry.id} className="space-y-2 py-3 text-sm"><div className="flex flex-wrap items-center gap-3"><HeartPulse className="h-4 w-4 text-rose-500" /><span className="w-24 text-muted-foreground">{entry.date}</span><span>睡眠 {display(entry.sleepHours, " h")}</span><span>HRV {display(entry.hrv)}</span><span>静息心率 {display(entry.restingHr, " bpm")}</span><span>Recovery {display(entry.whoopRecovery)}</span><span>Strain {display(entry.whoopStrain)}</span><span>VO2max {display(entry.vo2max)}</span></div><div className="flex flex-wrap gap-3 pl-7 text-xs text-muted-foreground"><span>睡眠一致性 {display(entry.sleepConsistency, "%")}</span><span>睡眠质量 {display(entry.sleepQuality, " / 5")}</span><span>疲劳 {display(entry.fatigue, " / 5")}</span><span>酸痛 {display(entry.soreness, " / 5")}</span><span>动力 {display(entry.motivation, " / 5")}</span><span>饥饿 {display(entry.hunger, " / 5")}</span>{entry.notes && <span>备注：{entry.notes}</span>}</div></div>)}</div> : <Empty><p className="text-sm">还没有恢复数据</p><p className="mt-1 text-xs text-muted-foreground">去 Log 记录睡眠、WHOOP 和主观恢复。</p></Empty>}</Panel></Section>
    </div>}
    {tab === "training" && <Section title="Training history"><Panel>{sortedActivities.length ? <div className="divide-y divide-border/50">{sortedActivities.map(activity => <div key={activity.id} className="flex items-center gap-3 py-3 text-sm"><Activity className="h-4 w-4 text-primary" /><span className="w-24 text-muted-foreground">{activity.date}</span><span className="flex-1 font-medium">{activity.title}</span><span className="text-muted-foreground">{activity.durationMin} min {activity.rpe ? `· RPE ${activity.rpe}` : ""}</span></div>)}</div> : <Empty><p className="text-sm">还没有训练记录</p></Empty>}</Panel></Section>}
    {tab === "nutrition" && <Section title="Nutrition history"><Panel>{state.nutrition.length ? <div className="divide-y divide-border/50">{[...state.nutrition].sort((a, b) => b.date.localeCompare(a.date)).map(entry => <div key={entry.id} className="flex items-center gap-3 py-3 text-sm"><Waves className="h-4 w-4 text-amber-500" /><span className="w-24 text-muted-foreground">{entry.date}</span><span className="flex-1">{entry.carbDay} carb day</span><span>P {entry.protein ?? "—"} g</span><span className="text-muted-foreground">{entry.calories ?? "—"} kcal</span></div>)}</div> : <Empty><p className="text-sm">还没有营养记录</p></Empty>}</Panel></Section>}
  </div>;
}
