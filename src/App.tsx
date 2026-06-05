import { useState, useMemo } from "react";
import { PRESET_DATASETS } from "./data/presets";
import { DashboardFilters, SaleTransaction, KPIStats } from "./types";
import KPICards from "./components/KPICards";
import Filters from "./components/Filters";
import DashboardCharts from "./components/DashboardCharts";
import InsightsPanel from "./components/InsightsPanel";
import FileImporter from "./components/FileImporter";
import DataTableView from "./components/DataTableView";
import { Sparkles, Database, BarChart3, ListCollapse, BrainCircuit, Upload } from "lucide-react";

export default function App() {
  // Datasets selection configuration
  const [activePreset, setActivePreset] = useState<"saas" | "retail" | "ev" | "custom">("saas");
  const [customDataName, setCustomDataName] = useState<string>("");
  const [customTransactions, setCustomTransactions] = useState<SaleTransaction[]>([]);

  // Filters State
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: "",
    endDate: "",
    category: "",
    region: "",
    salesChannel: "",
    customerSegment: "",
    searchTerm: "",
  });

  // Hot shortcut slicer state
  const [activeSlicer, setActiveSlicer] = useState<
    "high-margin" | "volume-sales" | "enterprise-focus" | "online-only" | null
  >(null);

  // Tab Navigation: "charts" | "table" | "ai" | "upload"
  const [activeTab, setActiveTab] = useState<"charts" | "table" | "ai" | "upload">("charts");

  // Load the core transactions based on user selection config (Preset vs Uploaded file)
  const currentDatasetTransactions = useMemo(() => {
    if (activePreset === "custom") {
      return customTransactions;
    }
    return PRESET_DATASETS[activePreset].data;
  }, [activePreset, customTransactions]);

  const activeDatasetMeta = useMemo(() => {
    if (activePreset === "custom") {
      return {
        name: customDataName || "Custom Spreadsheet Upload",
        industry: "User-Supplied Trade Operations",
        description: "Real-time client ledger parsed using local Excel/CSV column heuristics projections."
      };
    }
    const preset = PRESET_DATASETS[activePreset];
    return {
      name: preset.name,
      industry: preset.industry,
      description: preset.description
    };
  }, [activePreset, customDataName]);

  // Handle uploaded data callback
  const handleCustomDataImported = (data: SaleTransaction[], filename: string) => {
    setCustomTransactions(data);
    setCustomDataName(filename);
    setActivePreset("custom");
    setActiveTab("charts"); // switch automatically to charts to show results!
    // Reset filters
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
      region: "",
      salesChannel: "",
      customerSegment: "",
      searchTerm: "",
    });
    setActiveSlicer(null);
  };

  // Preset shortcut slicers logic
  const handleApplySlicer = (type: "high-margin" | "volume-sales" | "enterprise-focus" | "online-only" | "clear") => {
    if (type === "clear") {
      setActiveSlicer(null);
    } else {
      setActiveSlicer(type);
    }
  };

  // FILTERED RESULTSET PIPELINE
  const filteredTransactions = useMemo(() => {
    return currentDatasetTransactions.filter((t) => {
      // 1. Term matches (Match against product names)
      if (
        filters.searchTerm &&
        !t.productName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // 2. Category
      if (filters.category && t.category !== filters.category) return false;

      // 3. Region matches
      if (filters.region && t.region !== filters.region) return false;

      // 4. Sales Channel matches
      if (filters.salesChannel && t.salesChannel !== filters.salesChannel) return false;

      // 5. Segment matches
      if (filters.customerSegment && t.customerSegment !== filters.customerSegment) return false;

      // 6. Chronolog date ranges
      if (filters.startDate && new Date(t.date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(t.date) > new Date(filters.endDate)) return false;

      // 7. Active Quick Slicer Rules
      if (activeSlicer === "high-margin") {
        const margin = t.revenue > 0 ? t.profit / t.revenue : 0;
        if (margin < 0.6) return false; // Margin should be >= 60%
      }
      if (activeSlicer === "volume-sales" && t.quantity <= 5) return false;
      if (activeSlicer === "enterprise-focus") {
        const seg = t.customerSegment.toLowerCase();
        const matches = ["enterprise", "b2b", "fleet", "corporate", "government"].some((kw) =>
          seg.includes(kw)
        );
        if (!matches) return false;
      }
      if (activeSlicer === "online-only") {
        const chan = t.salesChannel.toLowerCase();
        const matches = ["online", "web", "self-service", "digital"].some((kw) =>
          chan.includes(kw)
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [currentDatasetTransactions, filters, activeSlicer]);

  // STATS GENERATION CORE
  const calculateKPIStats = (dataList: SaleTransaction[]): KPIStats => {
    const totalRevenue = dataList.reduce((acc, t) => acc + (t.revenue || 0), 0);
    const totalProfit = dataList.reduce((acc, t) => acc + (t.profit || 0), 0);
    const totalUnitsSold = dataList.reduce((acc, t) => acc + (t.quantity || 0), 0);
    const grossMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = dataList.length > 0 ? totalRevenue / dataList.length : 0;
    
    return {
      totalRevenue,
      totalProfit,
      grossMarginPercent,
      totalUnitsSold,
      averageOrderValue,
      transactionCount: dataList.length,
    };
  };

  const activeSegmentKPIs = useMemo(() => {
    return calculateKPIStats(filteredTransactions);
  }, [filteredTransactions]);

  const baselineKPIs = useMemo(() => {
    return calculateKPIStats(currentDatasetTransactions);
  }, [currentDatasetTransactions]);

  // AI-Specific parameters mappings (top performers category / list)
  const categorySummaryForAI = useMemo(() => {
    const map: Record<string, { revenue: number; profit: number }> = {};
    filteredTransactions.forEach((t) => {
      const cat = t.category || "General";
      if (!map[cat]) map[cat] = { revenue: 0, profit: 0 };
      map[cat].revenue += t.revenue;
      map[cat].profit += t.profit;
    });
    return Object.entries(map).map(([name, val]) => ({
      name,
      revenue: Math.round(val.revenue),
      profit: Math.round(val.profit),
    }));
  }, [filteredTransactions]);

  const productSummaryForAI = useMemo(() => {
    const map: Record<string, { revenue: number; units: number; price: number }> = {};
    filteredTransactions.forEach((t) => {
      const prod = t.productName;
      if (!map[prod]) map[prod] = { revenue: 0, units: 0, price: t.price };
      map[prod].revenue += t.revenue;
      map[prod].units += t.quantity;
    });
    return Object.entries(map)
      .map(([name, val]) => ({
        name,
        revenue: Math.round(val.revenue),
        units: val.units,
        price: val.price,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredTransactions]);

  const trendsSummaryForAI = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach((t) => {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
        map[label] = (map[label] || 0) + t.revenue;
      }
    });
    return Object.entries(map).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased text-center flex flex-col justify-start">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white flex items-center justify-center">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">
                Sales & Revenue Analysis
              </h1>
              <p className="text-[10px] md:text-xs text-slate-400 mt-1 font-medium">
                Professional Full-Stack CFO Ledger Intelligence
              </p>
            </div>
          </div>

          {/* Dataset Switch Presets */}
          <div className="flex items-center flex-wrap gap-1.5 self-start md:self-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
              Corporate Model:
            </span>
            <button
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                activePreset === "saas"
                  ? "bg-slate-900 text-white border-slate-800 shadow"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => {
                setActivePreset("saas");
                setActiveSlicer(null);
              }}
            >
              ☁️ SaaS Suite
            </button>
            <button
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                activePreset === "retail"
                  ? "bg-slate-900 text-white border-slate-800 shadow"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => {
                setActivePreset("retail");
                setActiveSlicer(null);
              }}
            >
              👟 B2C Apparel
            </button>
            <button
              type="button"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                activePreset === "ev"
                  ? "bg-slate-900 text-white border-slate-800 shadow"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              onClick={() => {
                setActivePreset("ev");
                setActiveSlicer(null);
              }}
            >
              ⚡ EV Automotive
            </button>

            {customTransactions.length > 0 && (
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                  activePreset === "custom"
                    ? "bg-indigo-600 text-white border-indigo-700 shadow"
                    : "bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                }`}
                onClick={() => {
                  setActivePreset("custom");
                  setActiveSlicer(null);
                }}
              >
                📊 Custom Upload ({customTransactions.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Industry Card Context banner */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-sm">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6366f1] bg-[#6366f1]/10 px-2.5 py-0.5 rounded-full">
                {activePreset === "custom" ? "ACTIVE UPLOAD" : "PRESET MODEL"}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900">
                {activeDatasetMeta.name}
              </h2>
            </div>
            <p className="text-[11px] font-mono font-semibold text-slate-400 mt-1 uppercase leading-none">
              Vertical: {activeDatasetMeta.industry}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {activeDatasetMeta.description}
            </p>
          </div>

          <button
            type="button"
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 px-4 py-2.5 rounded-lg border border-slate-200/80 flex items-center gap-1.5 self-start md:self-auto transition-colors"
            onClick={() => {
              // Reset Filters
              setFilters({
                startDate: "",
                endDate: "",
                category: "",
                region: "",
                salesChannel: "",
                customerSegment: "",
                searchTerm: "",
              });
              setActiveSlicer(null);
            }}
          >
            Clear Active Slicers
          </button>
        </div>

        {/* Financial KPI stats grid */}
        <KPICards stats={activeSegmentKPIs} fullPresetStats={baselineKPIs} />

        {/* Unified Tabs Controller */}
        <div id="navigation-tabs" className="bg-white border border-slate-200/80 rounded-xl p-1 shadow-sm flex items-center justify-start gap-1 w-full max-w-md">
          <button
            type="button"
            className={`flex-1 text-xs font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "charts"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("charts")}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Graphical Slicing
          </button>
          <button
            type="button"
            className={`flex-1 text-xs font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "table"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("table")}
          >
            <ListCollapse className="w-3.5 h-3.5" /> Ledger Rows
          </button>
          <button
            type="button"
            className={`flex-1 text-xs font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "ai"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("ai")}
          >
            <BrainCircuit className="w-3.5 h-3.5" /> CFO AI Audit
          </button>
          <button
            type="button"
            className={`flex-1 text-xs font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "upload"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:bg-slate-100"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-3.5 h-3.5" /> Import Ledger
          </button>
        </div>

        {/* Layout breakdown depending on active view tab */}
        {activeTab === "charts" && (
          <div className="flex flex-col gap-6 text-left">
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              transactions={currentDatasetTransactions}
              onApplyPresetSlicer={handleApplySlicer}
              activeSlicer={activeSlicer}
            />
            <DashboardCharts transactions={filteredTransactions} />
          </div>
        )}

        {activeTab === "table" && (
          <div className="flex flex-col gap-6 text-left animate-fade-in">
            <Filters
              filters={filters}
              onFiltersChange={setFilters}
              transactions={currentDatasetTransactions}
              onApplyPresetSlicer={handleApplySlicer}
              activeSlicer={activeSlicer}
            />
            <DataTableView transactions={filteredTransactions} />
          </div>
        )}

        {activeTab === "ai" && (
          <div className="animate-fade-in">
            <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-500">
              💡 **Active Context Summary**: Analyzing **{filteredTransactions.length.toLocaleString()}** transactions spanning **{categorySummaryForAI.length} categories** with overall active segment gross revenues of **${activeSegmentKPIs.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}**. Updates in your active filters or slicers are immediately fed into the Gemini strategic report!
            </div>
            <InsightsPanel
              presetName={activeDatasetMeta.name}
              industry={activeDatasetMeta.industry}
              kpis={activeSegmentKPIs}
              topProducts={productSummaryForAI}
              categoryDistribution={categorySummaryForAI}
              trends={trendsSummaryForAI}
            />
          </div>
        )}

        {activeTab === "upload" && (
          <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full text-left animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs leading-relaxed">
              📌 **Excel/Google Sheets tip**: Export your spreadsheet file as an **MS-DOS CSV** or **CSV (Comma Delimited) (.csv)** directly from Excel or Google Sheets. The importer automatically scans for header lines and helps you parse product, price, cost, and date metrics instantaneously!
            </div>
            <FileImporter onDataImported={handleCustomDataImported} />
          </div>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-center text-xs text-slate-400">
        <p className="font-mono">
          Sales & Revenue Dashboard &middot; Real-time Executive Ledger Analysis &middot; AI Studio
        </p>
      </footer>
    </div>
  );
}
