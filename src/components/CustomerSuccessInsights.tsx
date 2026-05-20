import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, Clock, MapPin, Cable, IndianRupee, Percent, Trophy, AlertTriangle, Lightbulb, Building2, BarChart3, Target, CheckCircle2 } from "lucide-react";

type CustomerHistory = {
  customer: string;
  project: string;
  distance: string;
  deploymentType: string;
  projectCost: string;
  revenue: string;
  profit: string;
  profitMargin: number;
  duration: string;
  durationDays: number;
  challenges: string[];
  aiRecommendations: string[];
  finalOutcome: string;
  roiInsight: string;
  aiInsight: string;
  successScore: number;
  costNumeric: number;
  revenueNumeric: number;
  profitNumeric: number;
};

const HISTORIES: CustomerHistory[] = [
  {
    customer: "Urban Fiber Networks",
    project: "Hyderabad → Bengaluru",
    distance: "575 KM",
    deploymentType: "Underground Fiber",
    projectCost: "₹4.8 Cr",
    revenue: "₹6.2 Cr",
    profit: "₹1.4 Cr",
    profitMargin: 22,
    duration: "48 Days",
    durationDays: 48,
    challenges: ["High trenching cost", "Labour allocation imbalance", "Delayed material delivery"],
    aiRecommendations: ["Optimize workforce distribution", "Reduce trench overlap", "Use phased deployment strategy"],
    finalOutcome: "Deployment cost reduced by 18% and project completed ahead of schedule.",
    roiInsight: "Higher profitability achieved through AI-driven optimization.",
    aiInsight: "This customer reduced deployment cost by 18% using AI optimization.",
    successScore: 92,
    costNumeric: 4.8, revenueNumeric: 6.2, profitNumeric: 1.4,
  },
  {
    customer: "MetroLink Broadband",
    project: "Mumbai → Pune",
    distance: "150 KM",
    deploymentType: "Aerial Fiber",
    projectCost: "₹1.3 Cr",
    revenue: "₹2.1 Cr",
    profit: "₹80 L",
    profitMargin: 28,
    duration: "21 Days",
    durationDays: 21,
    challenges: ["Weather-related deployment delays", "Pole infrastructure availability"],
    aiRecommendations: ["Switch from underground to aerial deployment", "Optimize labour shifts", "Use predictive maintenance checkpoints"],
    finalOutcome: "Deployment completed 25% faster with improved profit margin.",
    roiInsight: "Reduced operational cost significantly.",
    aiInsight: "This deployment achieved higher ROI using aerial fibre strategy.",
    successScore: 95,
    costNumeric: 1.3, revenueNumeric: 2.1, profitNumeric: 0.8,
  },
  {
    customer: "NextGen Telecom",
    project: "Delhi → Jaipur",
    distance: "280 KM",
    deploymentType: "Hybrid Deployment",
    projectCost: "₹2.6 Cr",
    revenue: "₹3.8 Cr",
    profit: "₹1.2 Cr",
    profitMargin: 31,
    duration: "34 Days",
    durationDays: 34,
    challenges: ["Uneven terrain conditions", "Material wastage", "Time estimation mismatch"],
    aiRecommendations: ["Balanced labour allocation", "Optimized material utilization", "Dynamic deployment scheduling"],
    finalOutcome: "Improved deployment efficiency and reduced resource wastage.",
    roiInsight: "AI planning improved overall business returns.",
    aiInsight: "Labour optimization reduced project duration by 12 days.",
    successScore: 94,
    costNumeric: 2.6, revenueNumeric: 3.8, profitNumeric: 1.2,
  },
  {
    customer: "SkyWave Communications",
    project: "Chennai → Coimbatore",
    distance: "500 KM",
    deploymentType: "Underground + Aerial Hybrid",
    projectCost: "₹4.1 Cr",
    revenue: "₹5.7 Cr",
    profit: "₹1.6 Cr",
    profitMargin: 27,
    duration: "42 Days",
    durationDays: 42,
    challenges: ["Terrain complexity", "Workforce scheduling conflicts", "Budget overruns"],
    aiRecommendations: ["Hybrid deployment optimization", "Smart workforce scheduling", "Real-time cost monitoring"],
    finalOutcome: "Budget stabilized and deployment completed efficiently.",
    roiInsight: "Profitability improved through deployment optimization.",
    aiInsight: "Hybrid deployment lifted profit margin to 27% with stabilized budget control.",
    successScore: 91,
    costNumeric: 4.1, revenueNumeric: 5.7, profitNumeric: 1.6,
  },
];

const MiniStat = ({ icon: Icon, label, value, tone = "primary" }: any) => (
  <div className={`p-2.5 rounded-lg bg-${tone}/8 border border-${tone}/15`}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className={`w-3 h-3 text-${tone}`} />
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
    </div>
    <p className={`text-sm font-bold font-mono text-${tone}`}>{value}</p>
  </div>
);

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">₹{value} Cr</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 bg-${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);

const HistoryCard = ({ h, index, expanded, onToggle }: { h: CustomerHistory; index: number; expanded: boolean; onToggle: () => void }) => {
  const max = Math.max(h.costNumeric, h.revenueNumeric, h.profitNumeric);
  return (
    <div className="relative pl-8 animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
      {/* Timeline dot */}
      <div className="absolute left-0 top-5 flex flex-col items-center">
        <div className="w-4 h-4 rounded-full bg-primary border-4 border-background shadow-[0_0_0_2px_hsl(var(--primary)/0.4)]" />
      </div>

      <div className="glass-card overflow-hidden transition-all duration-300 hover:border-primary/40">
        {/* Card header */}
        <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground">{h.customer}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> {h.successScore}% Success
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-info/15 text-info font-medium">{h.deploymentType}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {h.project} · <Cable className="w-3 h-3" /> {h.distance}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end mr-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit Margin</p>
            <p className="text-lg font-bold font-mono text-success">{h.profitMargin}%</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Expandable body */}
        <div className={`grid transition-all duration-500 ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4">
              {/* AI insight banner */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-info/10 border border-primary/20 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground italic">"{h.aiInsight}"</p>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniStat icon={IndianRupee} label="Project Cost" value={h.projectCost} tone="warning" />
                <MiniStat icon={TrendingUp} label="Revenue" value={h.revenue} tone="info" />
                <MiniStat icon={Trophy} label="Profit" value={h.profit} tone="success" />
                <MiniStat icon={Clock} label="Duration" value={h.duration} tone="primary" />
              </div>

              {/* Cost vs Revenue vs Profit chart */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Cost vs Revenue vs Profit</p>
                </div>
                <Bar label="Project Cost" value={h.costNumeric} max={max} color="warning" />
                <Bar label="Revenue Generated" value={h.revenueNumeric} max={max} color="info" />
                <Bar label="Profit Earned" value={h.profitNumeric} max={max} color="success" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Challenges */}
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Challenges Faced</p>
                  </div>
                  <ul className="space-y-1.5">
                    {h.challenges.map((c, i) => (
                      <li key={i} className="text-xs text-foreground flex gap-1.5">
                        <span className="text-destructive">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Recommendations */}
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/15">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-warning" />
                    <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider">AI Recommendations</p>
                  </div>
                  <ul className="space-y-1.5">
                    {h.aiRecommendations.map((r, i) => (
                      <li key={i} className="text-xs text-foreground flex gap-1.5">
                        <span className="text-warning">✓</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Outcome + ROI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/8 border border-success/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-success" />
                    <p className="text-[11px] font-semibold text-success uppercase tracking-wider">Final Outcome</p>
                  </div>
                  <p className="text-xs text-foreground">{h.finalOutcome}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/8 border border-info/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3.5 h-3.5 text-info" />
                    <p className="text-[11px] font-semibold text-info uppercase tracking-wider">ROI Improvement</p>
                  </div>
                  <p className="text-xs text-foreground">{h.roiInsight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerSuccessInsights = () => {
  const [expanded, setExpanded] = useState<number | null>(0);

  const totalProjects = HISTORIES.length;
  const avgMargin = (HISTORIES.reduce((s, h) => s + h.profitMargin, 0) / totalProjects).toFixed(1);
  const totalRevenue = HISTORIES.reduce((s, h) => s + h.revenueNumeric, 0).toFixed(1);
  const totalProfit = HISTORIES.reduce((s, h) => s + h.profitNumeric, 0).toFixed(1);

  return (
    <div className="glass-card p-5 space-y-5">
      {/* Section Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Customer Success Insights
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real deployment outcomes from previous telecom customers · AI-driven business intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-success/15 text-success font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 93% Avg Success
          </span>
        </div>
      </div>

      {/* Top Analytics Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-primary/8 border border-primary/15">
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Customers</p>
          </div>
          <p className="text-xl font-bold font-mono text-primary">{totalProjects}</p>
          <p className="text-[10px] text-muted-foreground">Enterprise deployments</p>
        </div>
        <div className="p-3 rounded-xl bg-info/8 border border-info/15">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-info" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Revenue</p>
          </div>
          <p className="text-xl font-bold font-mono text-info">₹{totalRevenue} Cr</p>
          <p className="text-[10px] text-muted-foreground">Across all projects</p>
        </div>
        <div className="p-3 rounded-xl bg-success/8 border border-success/15">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-success" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Profit</p>
          </div>
          <p className="text-xl font-bold font-mono text-success">₹{totalProfit} Cr</p>
          <p className="text-[10px] text-muted-foreground">Combined earnings</p>
        </div>
        <div className="p-3 rounded-xl bg-warning/8 border border-warning/15">
          <div className="flex items-center gap-1.5 mb-1">
            <Percent className="w-3.5 h-3.5 text-warning" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Avg Profit Margin</p>
          </div>
          <p className="text-xl font-bold font-mono text-warning">{avgMargin}%</p>
          <p className="text-[10px] text-muted-foreground">AI-optimized</p>
        </div>
      </div>

      {/* Timeline of customer histories */}
      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
        <div className="space-y-4">
          {HISTORIES.map((h, i) => (
            <HistoryCard key={h.customer} h={h} index={i} expanded={expanded === i} onToggle={() => setExpanded(expanded === i ? null : i)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerSuccessInsights;
