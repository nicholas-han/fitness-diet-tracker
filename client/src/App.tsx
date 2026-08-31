import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Plan from "./pages/Plan";
import Log from "./pages/Log";
import Nutrition from "./pages/Nutrition";
import Review from "./pages/Review";
import Settings from "./pages/Settings";
import HistoryPage from "./pages/History";
import NotFound from "./pages/NotFound";
import { FitnessStoreProvider } from "./lib/localStore";

function Router() { return <Switch><Route path="/" component={Dashboard} /><Route path="/plan" component={Plan} /><Route path="/log" component={Log} /><Route path="/nutrition" component={Nutrition} /><Route path="/history" component={HistoryPage} /><Route path="/review" component={Review} /><Route path="/settings" component={Settings} /><Route path="/workout" component={Plan} /><Route path="/diet" component={Nutrition} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>; }
export default function App() { return <ErrorBoundary><FitnessStoreProvider><TooltipProvider><Toaster /><AppLayout><Router /></AppLayout></TooltipProvider></FitnessStoreProvider></ErrorBoundary>; }
