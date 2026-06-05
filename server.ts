import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini instance to bypass module load crashes if local key is missing initially.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// 1. Business Insight & Executive Summary endpoint proxying Gemini API
app.post("/api/insights", async (req, res) => {
  try {
    const { 
      presetName, 
      industry, 
      kpis, 
      topProducts, 
      categoryDistribution, 
      trends 
    } = req.body;

    if (!kpis) {
      return res.status(400).json({ error: "Missing required dataset metrics to generate insights." });
    }

    const ai = getGeminiClient();

    // Construct a rich, professional prompting context based on user parameters
    const prompt = `You are an elite Business Intelligence Analyst, CFO, and Revenue Strategist.
Analyze the following corporate sales and revenue dataset:

--- BUSINESS GENERAL CONTEXT ---
Business Division / Preset: ${presetName || "Custom Uploaded Dataset"}
Industry Vertical: ${industry || "General Commercial Trade"}

--- FINANCIAL KPI SUMMARY METRICS ---
- Total Sales Revenue: $${(kpis.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Gross Profit Margin: $${(kpis.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(kpis.grossMarginPercent || 0).toFixed(1)}% efficiency)
- Total Sales Quantity: ${(kpis.totalUnitsSold || 0).toLocaleString()} units
- Average Order Value (AOV): $${(kpis.averageOrderValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Number of Transactions Analysed: ${(kpis.transactionCount || 0).toLocaleString()}

--- TOP PRODUCTS BY REVENUE ---
${(topProducts || []).map((p: any, idx: number) => `${idx + 1}. ${p.name}: $${p.revenue.toLocaleString()} (${p.units} units sold, unit-price: $${p.price.toLocaleString()})`).join("\n")}

--- PERFORMANCE DISTRIBUTION BY PRODUCT CATEGORY ---
${(categoryDistribution || []).map((c: any) => `- ${c.name}: $${c.revenue.toLocaleString()} (accounting for $${c.profit.toLocaleString()} profits)`).join("\n")}

--- SALES & REVENUE TIMELINE HISTORICAL SAMPLE SAMPLES (Dates / Rev) ---
${(trends || []).map((t: any) => `- ${t.date || t.period}: $${t.revenue.toLocaleString()}`).slice(-12).join("\n")}

=== INSIGHT TASK REQUIREMENT ===
Deliver a elegant, comprehensive Executive Audit Report in Markdown. Use direct, impactful, numbers-backed statements.
Break down your response into these exact 4 structured components:

1. **Executive Revenue Health Assessment**
   - Provide a formal diagnosis of the company's fiscal status, profit generation efficiency (${kpis.grossMarginPercent?.toFixed(1)}% margin), and transaction value (AOV: $${kpis.averageOrderValue?.toFixed(2)}). Use exact financial terms.
2. **Historical Revenue Timeline Analysis**
   - Call out notable trajectories, periods of contraction or breakout from the chronological records, plus any visible seasonal effects or trends.
3. **Core Structural Allocations (Categories & Items)**
   - Audit the product revenue distribution. Assess if there is over-dependence on a single product or category, and comment on the profitability balance.
4. **Actionable Growth Initiatives**
   - Deliver exactly 3 concrete, operational directives aimed to maximize AOV, defend/raise the gross profit margins, or exploit high-performing channels.

Be authoritative, crisp, and analytical. Avoid generic advice; refer directly to this business's specific metrics.`;

    const apiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // structured and predictable analysis
      }
    });

    const parsedText = apiResponse.text;
    res.json({ text: parsedText });

  } catch (error: any) {
    console.error("Gemini API server exception:", error);
    res.status(500).json({ 
      error: error.message || "An internal error occurred during business insight generation.",
      details: "Ensure GEMINI_API_KEY is configured in Settings > Secrets." 
    });
  }
});

// 2. Vite Dev Server vs Static Asset Production pipelines
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with HMR disabled...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite's middleware
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist folder...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static frontend assets
    app.use(express.static(distPath));
    
    // SPA Wildcard to forward router matches to index.html
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sales & Revenue Server successfully listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
