import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import { FitnessStoreProvider, useFitnessStore } from "./lib/localStore";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Plan = lazy(() => import("./pages/Plan"));
const Log = lazy(() => import("./pages/Log"));
const Nutrition = lazy(() => import("./pages/Nutrition"));
const Review = lazy(() => import("./pages/Review"));
const Settings = lazy(() => import("./pages/Settings"));
const HistoryPage = lazy(() => import("./pages/History"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RiceCupPrompt() {
  const { state, update, hydrated } = useFitnessStore();
  const [location] = useLocation();
  if (!hydrated || location === "/settings" || state.settings.riceCupGrams !== undefined || state.settings.riceCupPromptDismissed) return null;
  return <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-card p-3 shadow-lg"><div className="min-w-0 flex-1"><p className="text-sm font-medium">校准电饭煲米杯</p><p className="mt-1 text-xs text-muted-foreground">填写一杯生米的克数，Log 才能准确换算杯数。</p></div><input aria-label="米饭一杯生重" type="number" min="1" placeholder="克" className="w-20 rounded border border-input bg-background px-2 py-1.5 text-sm" onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value > 0) update(current => ({ ...current, settings: { ...current.settings, riceCupGrams: value, riceCupPromptDismissed: true } })); }} /><button type="button" onClick={() => update(current => ({ ...current, settings: { ...current.settings, riceCupPromptDismissed: true } }))} className="text-xs text-muted-foreground">稍后</button></div>;
}

function Router() { return <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">正在加载…</div>}><Switch><Route path="/" component={Dashboard} /><Route path="/plan" component={Plan} /><Route path="/log" component={Log} /><Route path="/nutrition" component={Nutrition} /><Route path="/history" component={HistoryPage} /><Route path="/review" component={Review} /><Route path="/settings" component={Settings} /><Route path="/workout" component={Plan} /><Route path="/diet" component={Nutrition} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch></Suspense>; }
export default function App() { return <ErrorBoundary><FitnessStoreProvider><TooltipProvider><Toaster /><RiceCupPrompt /><AppLayout><Router /></AppLayout></TooltipProvider></FitnessStoreProvider></ErrorBoundary>; }
