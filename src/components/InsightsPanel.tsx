import { useState } from "react";
import { Sparkles, Loader2, BrainCircuit, AlertCircle, FileDown, CheckCircle, Copy, HelpCircle } from "lucide-react";
import { KPIStats } from "../types";

interface InsightsPanelProps {
  presetName: string;
  industry: string;
  kpis: KPIStats;
  topProducts: Array<{ name: string; revenue: number; units: number; price: number }>;
  categoryDistribution: Array<{ name: string; revenue: number; profit: number }>;
  trends: Array<{ date: string; revenue: number }>;
}

export default function InsightsPanel({
  presetName,
  industry,
  kpis,
  topProducts,
  categoryDistribution,
  trends
}: InsightsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [stepMessage, setStepMessage] = useState("");

  const runMockSteps = (callback: () => Promise<void>) => {
    const steps = [
      "Auditing accounting ledger rows...",
      "Validating structural gross margins...",
      "Extrapolating regional sales velocity indices...",
      "Formulating recommendation pathways via Gemini...",
    ];
    let stepIdx = 0;
    setStepMessage(steps[0]);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setStepMessage(steps[stepIdx]);
      }
    }, 1200);

    callback().finally(() => {
      clearInterval(interval);
    });
  };

  const handleGenerateInsights = () => {
    setLoading(true);
    setError(null);
    setReportText("");

    const callApi = async () => {
      try {
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            presetName,
            industry,
            kpis,
            topProducts,
            categoryDistribution,
            trends: trends.slice(-12) // pass last 12 points for trend line analysis
          }),
        });

        const data = await response.json();
        
        if (!response.ok || data.error) {
          throw new Error(data.error || data.details || "Failed to process analytics.");
        }

        setReportText(data.text);
      } catch (err: any) {
        console.error("Audit error:", err);
        setError(err.message || "An unresolved interface mismatch occurred when communicating with Gemini.");
      } finally {
        setLoading(false);
      }
    };

    runMockSteps(callApi);
  };

  const handleCopyToClipboard = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!reportText) return;
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Executive_Revenue_Audit_${presetName.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe and beautiful Client-Side Markdown Parser
  const renderParsedMarkdown = (rawMarkdown: string) => {
    if (!rawMarkdown) return null;

    const lines = rawMarkdown.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Horizontal dividers
      if (trimmed === "---" || trimmed === "===" || trimmed === "===") {
        return <hr key={idx} className="my-6 border-slate-200" />;
      }

      // Main Headers (e.g. # Header)
      if (trimmed.startsWith("# ")) {
        const text = trimmed.slice(2).replace(/\*\*/g, "");
        return (
          <h1 key={idx} className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-6 mb-4 border-b border-slate-200 pb-2">
            {text}
          </h1>
        );
      }

      // Sub-headers (e.g. ## Header or ### Header)
      if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
        const count = trimmed.startsWith("## ") ? 3 : 4;
        const text = trimmed.slice(count).replace(/\*\*/g, "");
        return (
          <h2 key={idx} className="text-sm font-extrabold uppercase tracking-widest text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mt-8 mb-4">
            {text}
          </h2>
        );
      }

      // List Items (e.g. * text or - text)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const text = trimmed.slice(2);
        return (
          <li key={idx} className="ml-5 list-disc text-xs text-slate-600 leading-relaxed py-1 text-left">
            {parseInlineStyles(text)}
          </li>
        );
      }

      // Ordered list items (e.g. 1. text)
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          const num = match[1];
          const text = match[2];
          return (
            <div key={idx} className="flex gap-2 text-xs text-slate-600 leading-relaxed py-1.5 text-left items-start">
              <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md w-5 h-5 flex items-center justify-center shrink-0">
                {num}
              </span>
              <span className="mt-0.5">{parseInlineStyles(text)}</span>
            </div>
          );
        }
      }

      // Normal paragraph
      if (trimmed.length > 0) {
        return (
          <p key={idx} className="text-xs text-slate-600 leading-relaxed mb-4 text-left">
            {parseInlineStyles(trimmed)}
          </p>
        );
      }

      // Empty spacing lines
      return <div key={idx} className="h-2" />;
    });
  };

  // Inline styled text (Bold replacement)
  const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-slate-800">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div id="ai-insights-panel" className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-xl shadow-lg border border-slate-800 overflow-hidden">
      <div className="px-5 py-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <div className="text-left">
            <h2 className="font-extrabold text-sm tracking-tight">CFO AI Business Auditor</h2>
            <p className="text-[10px] text-slate-400 leading-none">Powered by Gemini 3.5 Flash Model Insights</p>
          </div>
        </div>

        {reportText && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors border border-slate-700"
              onClick={handleCopyToClipboard}
              title="Copy markdown report to clipboard"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Report
                </>
              )}
            </button>
            <button
              type="button"
              className="text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 bg-slate-800 hover:bg-slate-700/80 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors border border-indigo-900/50"
              onClick={handleDownloadMarkdown}
              title="Export report in Markdown file"
            >
              <FileDown className="w-3.5 h-3.5 text-indigo-400" /> Download Document
            </button>
          </div>
        )}
      </div>

      <div className="p-6">
        {!reportText && !loading && (
          <div className="py-8 flex flex-col items-center justify-center max-w-sm mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-bold text-sm tracking-wide">Generate CFO Audit Recommendations</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Examine current sales metrics, profit efficiency margins, temporal trends, and top products. Run the AI proxy to formulate high-yield strategic and tactical advice.
            </p>
            <button
              type="button"
              className="mt-5 w-full text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-5 py-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              onClick={handleGenerateInsights}
            >
              <BrainCircuit className="w-4 h-4" /> Analyse Active Segment Metrics
            </button>
          </div>
        )}

        {/* Loading audit state */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
            <h3 className="font-bold text-xs uppercase tracking-widest text-indigo-300">
              Generating Strategic Audit Report
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">{stepMessage}</p>
            
            {/* Mock progresses indicators */}
            <div className="w-48 bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 rounded-full animate-pulse" style={{ width: "85%" }} />
            </div>
          </div>
        )}

        {/* Audit Generation Error */}
        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-xl flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-rose-300 text-xs text-left">Insight Audit Halted</h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 text-left">{error}</p>
              <button
                type="button"
                className="mt-3 text-xs bg-rose-900/40 hover:bg-rose-900/60 border border-rose-800 px-3.5 py-1.5 rounded-lg font-semibold transition-colors text-rose-200"
                onClick={handleGenerateInsights}
              >
                Re-submit Financial Model
              </button>
            </div>
          </div>
        )}

        {/* Executive Report Frame */}
        {reportText && (
          <div className="bg-white text-slate-800 rounded-xl border border-slate-200 p-5 md:p-8 shadow-inner animate-fade-in max-h-[500px] overflow-y-auto mt-2">
            <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Executive Report
                </span>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight mt-2">
                  CFO Revenue Health Analysis
                </h3>
              </div>
              <div className="text-left md:text-right font-mono text-[10px] text-slate-400">
                <p>Audited: {presetName}</p>
                <p>Report Date: {new Date().toISOString().split("T")[0]}</p>
                <p>Industry: {industry}</p>
              </div>
            </div>

            <div className="prose prose-sm prose-indigo font-sans max-w-none text-left">
              {renderParsedMarkdown(reportText)}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 text-center flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                Strategic recommendations are derived algorithmically.
              </p>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3.5 py-1 rounded-lg border border-indigo-200 font-semibold"
                onClick={handleCopyToClipboard}
              >
                {copied ? "Report Copied!" : "Copy Report Content"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
