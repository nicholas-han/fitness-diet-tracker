import { Activity, ClipboardCheck, Dumbbell, History, LayoutDashboard, Settings, ShoppingCart, Utensils } from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ClipboardCheck, label: "Plan", path: "/plan" },
  { icon: Activity, label: "Log", path: "/log" },
  { icon: Utensils, label: "Nutrition", path: "/nutrition" },
  { icon: History, label: "History", path: "/history" },
  { icon: ClipboardCheck, label: "Review", path: "/review" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  return <div className="min-h-screen bg-background text-foreground"><header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur"><div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6"><button onClick={() => setLocation("/")} className="flex items-center gap-2 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Dumbbell className="h-4 w-4" /></span><span className="hidden text-sm font-semibold sm:block">Personal Fitness OS</span></button><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" />Local-first</div></div></header><div className="mx-auto flex max-w-7xl"><aside className="hidden min-h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border/60 p-4 md:block"><nav className="space-y-1">{navItems.map(item => { const Icon = item.icon; const active = location === item.path; return <button key={item.path} onClick={() => setLocation(item.path)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm ${active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</nav><div className="mt-8 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground"><p className="font-medium text-foreground">Phase 0</p><p className="mt-1">重建习惯，记录趋势。</p></div></aside><main className="min-w-0 flex-1 px-4 sm:px-6">{children}</main></div><nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 pb-safe backdrop-blur md:hidden"><div className="grid h-16 grid-cols-5">{navItems.slice(0, 5).map(item => { const Icon = item.icon; const active = location === item.path; return <button key={item.path} onClick={() => setLocation(item.path)} className={`flex flex-col items-center justify-center gap-1 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}><Icon className="h-5 w-5" />{item.label}</button>; })}</div></nav></div>;
}
