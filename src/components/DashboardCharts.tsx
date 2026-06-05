import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { SaleTransaction } from "../types";
import { TrendingUp, PieChart as PieIcon, Award, DollarSign } from "lucide-react";

interface DashboardChartsProps {
  transactions: SaleTransaction[];
}

// Preset standard months sequence to anchor chronology cleanly
const MONTHS_ORDER = [
  "Jul 25", "Aug 25", "Sep 25", "Oct 25", "Nov 25", "Dec 25",
  "Jan 26", "Feb 26", "Mar 26", "Apr 26", "May 26"
];

const COLORS_SERIES = ["#6366f1", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];

export default function DashboardCharts({ transactions }: DashboardChartsProps) {
  
  // 1. Group by Month Chronologically
  const monthlyAggregates: Record<string, { revenue: number; profit: number; units: number }> = {};
  MONTHS_ORDER.forEach(m => {
    monthlyAggregates[m] = { revenue: 0, profit: 0, units: 0 };
  });

  transactions.forEach((t) => {
    const d = new Date(t.date);
    if (!isNaN(d.getTime())) {
      const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (monthlyAggregates[label] !== undefined) {
        monthlyAggregates[label].revenue += t.revenue;
        monthlyAggregates[label].profit += t.profit;
        monthlyAggregates[label].units += t.quantity;
      } else {
        // Fallback for imported data out of standard bounds
        monthlyAggregates[label] = {
          revenue: t.revenue,
          profit: t.profit,
          units: t.quantity
        };
      }
    }
  });

  const timelineData = Object.entries(monthlyAggregates).map(([period, metrics]) => ({
    period,
    revenue: Math.round(metrics.revenue),
    profit: Math.round(metrics.profit),
    units: metrics.units
  })).sort((a, b) => {
    const idxA = MONTHS_ORDER.indexOf(a.period);
    const idxB = MONTHS_ORDER.indexOf(b.period);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    return new Date(a.period).getTime() - new Date(b.period).getTime();
  });

  // 2. Group by Category
  const categoryMap: Record<string, { name: string; revenue: number; profit: number }> = {};
  transactions.forEach((t) => {
    const cat = t.category || "General";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, revenue: 0, profit: 0 };
    }
    categoryMap[cat].revenue += t.revenue;
    categoryMap[cat].profit += t.profit;
  });
  const categoryData = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

  // 3. Group by Product (Top 5 Name)
  const productMap: Record<string, { name: string; revenue: number; profit: number; units: number }> = {};
  transactions.forEach((t) => {
    const prod = t.productName;
    if (!productMap[prod]) {
      productMap[prod] = { name: prod, revenue: 0, profit: 0, units: 0 };
    }
    productMap[prod].revenue += t.revenue;
    productMap[prod].profit += t.profit;
    productMap[prod].units += t.quantity;
  });
  const topProductsData = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Formatter custom tooltip
  const currencyFormatter = (value: any) => {
    return [`$${Number(value).toLocaleString()}`, undefined];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Time-Series Trend Line (2/3 width on wide screens) */}
      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-left flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Monthly Revenue & Profit Pipeline</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">CHRONOLOGICAL RANGE</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + "k" : val}`} />
              <Tooltip formatter={currencyFormatter} contentStyle={{ background: "#1e293b", borderRadius: "10px", color: "#fff", border: "none", fontSize: "11px" }} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Area name="Gross Revenue" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area name="Net Profit Margin" type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Contribution Share (1/3 width) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-left flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Classification Contribution</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">SECTOR SHARE</span>
        </div>

        <div className="h-56 relative flex items-center justify-center">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  nameKey="name"
                  dataKey="revenue"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_SERIES[index % COLORS_SERIES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={currencyFormatter} contentStyle={{ background: "#1e293b", borderRadius: "8px", color: "#fff", border: "none", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-slate-400">No category metrics loaded</span>
          )}
          
          {/* Legend center card absolute */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Groups</span>
            <span className="text-xl font-extrabold text-slate-800">{categoryData.length} sectors</span>
          </div>
        </div>

        {/* Categories Legends mapping */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {categoryData.slice(0, 4).map((entry, idx) => (
            <div key={entry.name} className="flex items-center gap-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_SERIES[idx % COLORS_SERIES.length] }} />
              <div className="overflow-hidden min-w-0">
                <p className="text-[10px] font-bold text-slate-700 truncate leading-none">{entry.name}</p>
                <p className="text-[9px] text-slate-400 font-medium font-mono leading-relaxed">${Math.round(entry.revenue / 1000)}k</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Products Bar chart ranking */}
      <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm text-left flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Revenue Leaderboard: Top 5 Performing Products</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 font-mono">PRODUCT METRIC</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Ranking Recharts Horizontal Bar */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + "k" : val}`} />
                <YAxis type="category" dataKey="name" stroke="#6366f1" fontSize={9} tickLine={false} width={100} />
                <Tooltip formatter={currencyFormatter} contentStyle={{ background: "#1e293b", borderRadius: "10px", color: "#fff", border: "none", fontSize: "11px" }} />
                <Bar name="Product Revenue" dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboard numeric list with design rhythm */}
          <div className="flex flex-col gap-3">
            {topProductsData.map((item, idx) => {
              const profitMarginRatio = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-5 h-5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-extrabold text-indigo-600 flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.units} license/units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-black text-slate-800">${item.revenue.toLocaleString()}</p>
                    <p className="text-[10px] font-semibold text-emerald-600 font-mono">{profitMarginRatio.toFixed(0)}% Margin</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
