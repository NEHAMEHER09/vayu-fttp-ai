import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, BarChart3, GitCompare, Sparkles } from "lucide-react";
import CostCards from "@/components/CostCards";
import CostBreakdownChart from "@/components/CostBreakdownChart";
import AIInsights from "@/components/AIInsights";
import SectionHeading from "@/components/SectionHeading";
import { calculateCost, formatCurrency } from "@/lib/costCalculator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const AnalysisPage = () => {
  // Shared single-input form
  const [premises, setPremises] = useState(500);
  const [distance, setDistance] = useState(50);
  const [workersA, setWorkersA] = useState(10);
  const [workersB, setWorkersB] = useState(25);

  const [showCost, setShowCost] = useState(true);
  const [showScenario, setShowScenario] = useState(true);

  const baseCoords = { lat: 19.076, lng: 72.8777 };
  const destCoords = { lat: 19.076 + distance * 0.009, lng: 72.8777 + distance * 0.009 };

  // PART 1 — Cost Analysis (uses workersA as primary team)
  const result = useMemo(
    () =>
      calculateCost({
        source: baseCoords,
        destination: destCoords,
        premisesCount: premises,
        workers: workersA,
        wagePerDay: 800,
        workingDays: 30,
        deploymentType: "underground",
        arpu: 500,
      }),
    [premises, distance, workersA]
  );

  const barData = result
    ? [
        { name: "Fiber", cost: result.breakdown.fiber, fill: "hsl(168,72%,38%)" },
        { name: "Equipment", cost: result.breakdown.equipment, fill: "hsl(210,80%,50%)" },
        { name: "Labour", cost: result.breakdown.labour, fill: "hsl(38,92%,50%)" },
        { name: "Civil", cost: result.breakdown.civil, fill: "hsl(280,60%,50%)" },
      ]
    : [];

  // PART 2 — Scenario Comparison
  const scenarios = useMemo(() => {
    const underground10 = calculateCost({ source: baseCoords, destination: destCoords, premisesCount: premises, workers: workersA, wagePerDay: 800, workingDays: 30, deploymentType: "underground", arpu: 500 });
    const aerial10 = calculateCost({ source: baseCoords, destination: destCoords, premisesCount: premises, workers: workersA, wagePerDay: 800, workingDays: 30, deploymentType: "aerial", arpu: 500 });
    const underground25 = calculateCost({ source: baseCoords, destination: destCoords, premisesCount: premises, workers: workersB, wagePerDay: 800, workingDays: 30, deploymentType: "underground", arpu: 500 });
    const aerial25 = calculateCost({ source: baseCoords, destination: destCoords, premisesCount: premises, workers: workersB, wagePerDay: 800, workingDays: 30, deploymentType: "aerial", arpu: 500 });
    return [
      { name: `UG / ${workersA}W`, ...underground10 },
      { name: `Aerial / ${workersA}W`, ...aerial10 },
      { name: `UG / ${workersB}W`, ...underground25 },
      { name: `Aerial / ${workersB}W`, ...aerial25 },
    ].filter((s) => s.totalCost !== undefined);
  }, [distance, premises, workersA, workersB]);

  const chartData = scenarios.map((s) => ({
    name: s.name,
    "Total Cost": s.totalCost,
    Revenue: s.revenue,
    Profit: s.profit,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Cost Intelligence &amp; Scenario Analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter your project parameters once — instantly see cost estimation, scenario comparison, AI insights and profit analysis.
        </p>
      </div>

      {/* Unified Input */}
      <div className="glass-card p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
            Distance: <span className="text-foreground font-mono font-bold">{distance} km</span>
          </label>
          <input type="range" min={1} max={500} value={distance} onChange={(e) => setDistance(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
            Premises: <span className="text-foreground font-mono font-bold">{premises}</span>
          </label>
          <input type="range" min={1} max={5000} value={premises} onChange={(e) => setPremises(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
            Team A: <span className="text-foreground font-mono font-bold">{workersA} workers</span>
          </label>
          <input type="range" min={5} max={50} value={workersA} onChange={(e) => setWorkersA(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium block mb-2">
            Team B: <span className="text-foreground font-mono font-bold">{workersB} workers</span>
          </label>
          <input type="range" min={5} max={50} value={workersB} onChange={(e) => setWorkersB(Number(e.target.value))} className="w-full accent-primary" />
        </div>
      </div>

      {/* PART 1: COST ANALYSIS */}
      <div className="glass-card p-5">
        <button
          onClick={() => setShowCost((v) => !v)}
          className="w-full flex items-center justify-between mb-4"
        >
          <SectionHeading icon={BarChart3} title="Cost Analysis" subtitle="Material, labour, deployment & total cost breakdown" />
          {showCost ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showCost && result && (
          <div className="space-y-6 animate-fade-in">
            <CostCards result={result} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostBreakdownChart breakdown={result.breakdown} />
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Cost Comparison</h3>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,89%)" />
                      <XAxis dataKey="name" tick={{ fill: "hsl(220,9%,46%)", fontSize: 12 }} axisLine={false} />
                      <YAxis tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,89%)", borderRadius: "8px", color: "hsl(222,47%,11%)", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                      <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                        {barData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <AIInsights result={result} premisesCount={premises} />
          </div>
        )}
      </div>

      {/* PART 2: SCENARIO ANALYSIS */}
      <div className="glass-card p-5">
        <button
          onClick={() => setShowScenario((v) => !v)}
          className="w-full flex items-center justify-between mb-4"
        >
          <SectionHeading icon={GitCompare} title="Scenario Analysis" subtitle="Underground vs Aerial · Workforce · Time · Profit" />
          {showScenario ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showScenario && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 overflow-x-auto">
              <SectionHeading icon={GitCompare} title="Side-by-Side Comparison" subtitle="Key metrics across all scenarios" />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Metric</th>
                    {scenarios.map((s) => (
                      <th key={s.name} className="text-right py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Total Cost", key: "totalCost" as const },
                    { label: "Material Cost", key: "materialCost" as const },
                    { label: "Labour Cost", key: "labourCost" as const },
                    { label: "Deploy Cost", key: "deploymentCost" as const },
                    { label: "Revenue (5Y)", key: "revenue" as const },
                    { label: "Profit", key: "profit" as const },
                    { label: "Margin", key: "profitMargin" as const },
                    { label: "Duration", key: "durationDays" as const },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 text-foreground font-medium">{row.label}</td>
                      {scenarios.map((s) => (
                        <td key={s.name} className="py-2.5 text-right font-mono text-sm">
                          <span className={row.key === "profit" ? (((s as any)[row.key] || 0) >= 0 ? "text-success" : "text-destructive") : "text-foreground"}>
                            {row.key === "profitMargin"
                              ? `${((s as any)[row.key] || 0).toFixed(1)}%`
                              : row.key === "durationDays"
                              ? `${(s as any)[row.key] || 0}d`
                              : formatCurrency((s as any)[row.key] || 0)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Cost vs Revenue vs Profit</h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,89%)" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} axisLine={false} />
                    <YAxis tick={{ fill: "hsl(220,9%,46%)", fontSize: 11 }} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,89%)", borderRadius: "8px", color: "hsl(222,47%,11%)", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(220,9%,46%)" }} />
                    <Bar dataKey="Total Cost" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Revenue" fill="hsl(210,80%,50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="hsl(142,70%,40%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPage;
