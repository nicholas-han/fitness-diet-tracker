import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Home, Dumbbell, UtensilsCrossed, History, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { CSSProperties } from "react";

const navItems = [
  { icon: Home, label: "首页", path: "/" },
  { icon: Dumbbell, label: "训练", path: "/workout" },
  { icon: UtensilsCrossed, label: "饮食", path: "/diet" },
  { icon: History, label: "历史", path: "/history" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-8 max-w-sm w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-primary" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-center">
                Fitness & Diet Tracker
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                登录后开始记录你的训练与饮食
              </p>
            </div>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar - minimal, only on desktop */}
      <header className="hidden md:flex items-center justify-between px-6 h-14 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Fitness Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 border">
              <AvatarFallback className="text-xs font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6 max-w-2xl mx-auto w-full px-4 sm:px-6">
        {children}
      </main>

      {/* Bottom navigation - mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        <div className="bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-lg border-t border-border/40">
          <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => (window.location.href = item.path)}
                  className="flex flex-col items-center justify-center gap-1 flex-1 h-full tap-feedback"
                  style={{ "--ease-out": "cubic-bezier(0.23, 1, 0.32, 1)" } as CSSProperties}
                >
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 ${
                    isActive ? "bg-primary/10" : ""
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors duration-200 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop sidebar nav */}
      <nav className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 bg-card/90 backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-lg border border-border/40 rounded-full px-2 py-2 card-shadow">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => (window.location.href = item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 tap-feedback ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
