import { Filter, RotateCcw, Search, Sparkles, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { DashboardFilters, SaleTransaction } from "../types";

interface FiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (newFilters: DashboardFilters) => void;
  transactions: SaleTransaction[];
  onApplyPresetSlicer: (type: "high-margin" | "volume-sales" | "enterprise-focus" | "online-only" | "clear") => void;
  activeSlicer: string | null;
}

export default function Filters({
  filters,
  onFiltersChange,
  transactions,
  onApplyPresetSlicer,
  activeSlicer
}: FiltersProps) {
  // Extract dynamic list values based on loaded list content
  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category))).filter(Boolean).sort();
  const uniqueRegions = Array.from(new Set(transactions.map((t) => t.region))).filter(Boolean).sort();
  const uniqueChannels = Array.from(new Set(transactions.map((t) => t.salesChannel))).filter(Boolean).sort();
  const uniqueSegments = Array.from(new Set(transactions.map((t) => t.customerSegment))).filter(Boolean).sort();

  const handleFieldChange = (key: keyof DashboardFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      startDate: "",
      endDate: "",
      category: "",
      region: "",
      salesChannel: "",
      customerSegment: "",
      searchTerm: "",
    });
    onApplyPresetSlicer("clear");
  };

  return (
    <div id="filters-panel" className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">Query Demographics & Slicers</h2>
        </div>
        
        {/* Preset Slicer Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Slicers:
          </span>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              activeSlicer === "high-margin"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => onApplyPresetSlicer("high-margin")}
          >
            🔥 High Margin (&gt;60%)
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              activeSlicer === "volume-sales"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => onApplyPresetSlicer("volume-sales")}
          >
            📦 High Volume (&gt;5 Unit)
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              activeSlicer === "enterprise-focus"
                ? "bg-sky-50 border-sky-300 text-sky-700 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => onApplyPresetSlicer("enterprise-focus")}
          >
            💼 Enterprise/B2B
          </button>
          <button
            type="button"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              activeSlicer === "online-only"
                ? "bg-amber-50 border-amber-300 text-amber-700 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => onApplyPresetSlicer("online-only")}
          >
            🌐 Online Channels
          </button>
          {(activeSlicer || Object.values(filters).some(Boolean)) && (
            <button
              type="button"
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              onClick={handleClearAll}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filtes
            </button>
          )}
        </div>
      </div>

      {/* Grid Filter Form Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-3 h-3" /> Search Product
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by name..."
              className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 pl-8 pr-3.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
              value={filters.searchTerm}
              onChange={(e) => handleFieldChange("searchTerm", e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Dynamic Category dropdown */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Product Category
          </label>
          <select
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.category}
            onChange={(e) => handleFieldChange("category", e.target.value)}
          >
            <option value="">All Categories ({uniqueCategories.length})</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Region dropdown */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Sales Territory / Region
          </label>
          <select
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.region}
            onChange={(e) => handleFieldChange("region", e.target.value)}
          >
            <option value="">All Markets ({uniqueRegions.length})</option>
            {uniqueRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Partner / Channel dropdown */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Sales Channel
          </label>
          <select
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.salesChannel}
            onChange={(e) => handleFieldChange("salesChannel", e.target.value)}
          >
            <option value="">All Commerce Sinks ({uniqueChannels.length})</option>
            {uniqueChannels.map((chn) => (
              <option key={chn} value={chn}>
                {chn}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic segment dropdown */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
            Customer Demographics
          </label>
          <select
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.customerSegment}
            onChange={(e) => handleFieldChange("customerSegment", e.target.value)}
          >
            <option value="">All Clientele Types ({uniqueSegments.length})</option>
            {uniqueSegments.map((seg) => (
              <option key={seg} value={seg}>
                {seg}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filters start */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date Range From
          </label>
          <input
            type="date"
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.startDate}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
          />
        </div>

        {/* Date filter end */}
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date Range To
          </label>
          <input
            type="date"
            className="w-full text-xs text-slate-700 bg-slate-50/50 border border-slate-300 rounded-lg py-2 px-2.5 focus:border-indigo-500 focus:bg-white focus:outline-none transition-colors"
            value={filters.endDate}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
          />
        </div>

        {/* Informative counts display */}
        <div className="flex items-end justify-end">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg w-full text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Filtered Records</span>
            <span className="text-sm font-extrabold text-slate-800 tracking-tight">
              {transactions.length.toLocaleString()} rows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
