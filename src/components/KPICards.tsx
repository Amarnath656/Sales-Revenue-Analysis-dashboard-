import { DollarSign, BarChart2, ShoppingCart, Percent, Tag, Activity } from "lucide-react";
import { KPIStats } from "../types";
import { motion } from "motion/react";

interface KPICardsProps {
  stats: KPIStats;
  fullPresetStats: KPIStats; // For dynamic offset context
}

export default function KPICards({ stats, fullPresetStats }: KPICardsProps) {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(2)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(1)}k`;
    }
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPercentageShare = (subsetVal: number, totalVal: number) => {
    if (totalVal === 0) return 0;
    return (subsetVal / totalVal) * 100;
  };

  const revenueShare = getPercentageShare(stats.totalRevenue, fullPresetStats.totalRevenue);
  const profitShare = getPercentageShare(stats.totalProfit, fullPresetStats.totalProfit);
  const unitShare = getPercentageShare(stats.totalUnitsSold, fullPresetStats.totalUnitsSold);
  const txnShare = getPercentageShare(stats.transactionCount, fullPresetStats.transactionCount);

  const cards = [
    {
      id: "stat-revenue",
      title: "Gross Sales Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtext: stats.totalRevenue === fullPresetStats.totalRevenue 
        ? "100% of available dataset" 
        : `${revenueShare.toFixed(1)}% of total volume`,
      icon: DollarSign,
      color: "from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-100",
      accent: "emerald",
      percentage: revenueShare
    },
    {
      id: "stat-profit",
      title: "Gross Profit Margin",
      value: formatCurrency(stats.totalProfit),
      subtext: `Weighted margin at ${stats.grossMarginPercent.toFixed(1)}%`,
      icon: BarChart2,
      color: "from-indigo-500/10 to-blue-500/5 text-indigo-600 border-indigo-100",
      accent: "indigo",
      percentage: profitShare
    },
    {
      id: "stat-aov",
      title: "Average Order Value",
      value: `$${stats.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: stats.averageOrderValue >= fullPresetStats.averageOrderValue
        ? `+$${(stats.averageOrderValue - fullPresetStats.averageOrderValue).toFixed(2)} vs baseline`
        : `-$${(fullPresetStats.averageOrderValue - stats.averageOrderValue).toFixed(2)} vs baseline`,
      icon: ShoppingCart,
      color: "from-amber-500/10 to-yellow-500/5 text-amber-700 border-amber-100",
      accent: "amber",
      percentage: Math.min(100, (stats.averageOrderValue / (fullPresetStats.averageOrderValue || 1)) * 100)
    },
    {
      id: "stat-volume",
      title: "Total Units Sold",
      value: stats.totalUnitsSold.toLocaleString(),
      subtext: stats.totalUnitsSold === fullPresetStats.totalUnitsSold
        ? "All inventory sales accounted"
        : `${unitShare.toFixed(1)}% of inventory units`,
      icon: Tag,
      color: "from-sky-500/10 to-cyan-500/5 text-sky-600 border-sky-100",
      accent: "sky",
      percentage: unitShare
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            id={card.id}
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={`bg-white border rounded-xl p-5 shadow-sm overflow-hidden relative flex flex-col justify-between border-slate-200 hover:shadow-md transition-all group`}
          >
            {/* Visual gradient backdrop sparkle */}
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-40 blur-2xl rounded-full translate-x-4 -translate-y-4`} />
            
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-medium text-slate-500 tracking-wide">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg bg-gradient-to-tr ${card.color} border flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 z-10 text-left">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                {card.value}
              </h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5 leading-none">
                <Activity className="w-3 h-3 text-slate-400 opacity-60" />
                {card.subtext}
              </p>
            </div>

            {/* Spark Indicator Bar of visual contribution context */}
            <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden z-10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${card.percentage}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className={`h-full bg-slate-800 rounded-full`}
                style={{
                  backgroundColor: 
                    card.accent === "emerald" ? "#10b981" :
                    card.accent === "indigo" ? "#6366f1" :
                    card.accent === "amber" ? "#d97706" : "#0284c7"
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
