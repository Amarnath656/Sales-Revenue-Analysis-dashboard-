import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, CheckCircle, AlertTriangle, FileText, Sparkles, HelpCircle } from "lucide-react";
import { SaleTransaction } from "../types";

interface FileImporterProps {
  onDataImported: (data: SaleTransaction[], filename: string) => void;
}

export default function FileImporter({ onDataImported }: FileImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  
  // Header mapping state
  const [mapping, setMapping] = useState({
    date: "",
    productName: "",
    category: "",
    region: "",
    salesChannel: "",
    quantity: "",
    price: "",
    cost: "",
    customerSegment: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseFileContent = (text: string, ext: string) => {
    setError(null);
    setSuccess(null);
    setRawText(text);

    if (ext === "json") {
      try {
        const parsed = JSON.parse(text);
        let items: any[] = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed.records && Array.isArray(parsed.records)) {
          items = parsed.records;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          items = parsed.data;
        } else {
          throw new Error("JSON file must contain an array of transaction objects.");
        }

        if (items.length === 0) {
          throw new Error("The JSON array is empty.");
        }

        // Intelligently map objects
        const mappedTransactions = mapRawRowsToTransactions(items);
        onDataImported(mappedTransactions, fileName);
        setSuccess(`Successfully imported ${mappedTransactions.length} records from JSON!`);
      } catch (err: any) {
        setError(err.message || "Decoding JSON failed. Please make sure the JSON syntax is correct.");
      }
    } else {
      // CSV/TSV
      const delimiter = ext === "tsv" ? "\t" : ",";
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        setError("The spreadsheet must contain a header row and at least one transaction row.");
        return;
      }

      // Simple CSV Splitter that respects quoted cells
      const splitCSVLine = (line: string, delim: string) => {
        const result: string[] = [];
        let curVal = "";
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(curVal.trim().replace(/^"(.*)"$/, "$1"));
            curVal = "";
          } else {
            curVal += char;
          }
        }
        result.push(curVal.trim().replace(/^"(.*)"$/, "$1"));
        return result;
      };

      const extractedHeaders = splitCSVLine(lines[0], delimiter);
      setHeaders(extractedHeaders);

      // Attempt automatic mapping
      const defaultMapping = {
        date: findBestMatch(extractedHeaders, ["date", "day", "timestamp", "period", "tx_date", "order date", "order_date", "sold"]),
        productName: findBestMatch(extractedHeaders, ["product", "item", "productname", "product_name", "title", "goods", "sku"]),
        category: findBestMatch(extractedHeaders, ["category", "type", "class", "group", "product_category", "dept", "department", "ctgy"]),
        region: findBestMatch(extractedHeaders, ["region", "country", "territory", "city", "state", "location", "zone", "reg"]),
        salesChannel: findBestMatch(extractedHeaders, ["channel", "saleschannel", "sales_channel", "medium", "source", "store", "outlet"]),
        quantity: findBestMatch(extractedHeaders, ["quantity", "qty", "volume", "units", "quantity_sold", "count", "num"]),
        price: findBestMatch(extractedHeaders, ["price", "unitprice", "rate", "revenue", "amount", "unit_price", "sales", "cost_price"]),
        cost: findBestMatch(extractedHeaders, ["cost", "unitcost", "expense", "manufacturing", "cogs", "buy_price", "unit_cost"]),
        customerSegment: findBestMatch(extractedHeaders, ["segment", "customer", "customersegment", "audience", "demographic", "client", "tier"])
      };
      
      setMapping(defaultMapping);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const name = file.name;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    setFileName(name);

    if (ext !== "csv" && ext !== "tsv" && ext !== "json" && ext !== "txt") {
      setError("Supported file formats are: .csv, .tsv, .json, and .txt files.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseFileContent(text, ext);
    };
    reader.readAsText(file);
  };

  const findBestMatch = (headersList: string[], keywords: string[]): string => {
    for (const kw of keywords) {
      const match = headersList.find(h => h.toLowerCase() === kw.toLowerCase() || h.toLowerCase().includes(kw));
      if (match) return match;
    }
    return "";
  };

  const handleApplyMapping = () => {
    try {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const delimiter = ext === "tsv" ? "\t" : ",";
      const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      
      const splitCSVLine = (line: string, delim: string) => {
        const result: string[] = [];
        let curVal = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === delim && !inQuotes) {
            result.push(curVal.trim().replace(/^"(.*)"$/, "$1"));
            curVal = "";
          } else {
            curVal += char;
          }
        }
        result.push(curVal.trim().replace(/^"(.*)"$/, "$1"));
        return result;
      };

      const extractedHeaders = splitCSVLine(lines[0], delimiter);
      const rows: SaleTransaction[] = [];
      let idCounter = 9000;

      for (let i = 1; i < lines.length; i++) {
        const values = splitCSVLine(lines[i], delimiter);
        if (values.length < extractedHeaders.length - 1) continue; // skip incomplete rows

        const getValByHeader = (headerName: string) => {
          if (!headerName) return "";
          const index = extractedHeaders.indexOf(headerName);
          return index !== -1 ? values[index] : "";
        };

        const rawDate = getValByHeader(mapping.date) || new Date().toISOString().split("T")[0];
        // clean date to string format (YYYY-MM-DD or standard)
        let formattedDate = rawDate;
        try {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split("T")[0];
          }
        } catch (_) {}

        const productName = getValByHeader(mapping.productName) || "Imported Item";
        const category = getValByHeader(mapping.category) || "General Category";
        const region = getValByHeader(mapping.region) || "Default Market";
        const salesChannel = getValByHeader(mapping.salesChannel) || "Import Portal";
        const rawQty = parseFloat(getValByHeader(mapping.quantity).replace(/[\$,]/g, "")) || 1;
        const rawPrice = parseFloat(getValByHeader(mapping.price).replace(/[\$,]/g, "")) || 0;
        
        let rawCost = parseFloat(getValByHeader(mapping.cost).replace(/[\$,]/g, "")) || 0;
        // In case cost is empty, fallback to a sensible 45% margin of price
        if (getValByHeader(mapping.cost) === "") {
          rawCost = rawPrice * 0.55;
        }

        const customerSegment = getValByHeader(mapping.customerSegment) || "Commercial Client";

        const revenue = rawQty * rawPrice;
        const profit = revenue - (rawQty * rawCost);

        rows.push({
          id: `IMP-${idCounter++}`,
          date: formattedDate,
          productName,
          category,
          region,
          salesChannel,
          quantity: rawQty,
          price: rawPrice,
          cost: rawCost,
          revenue,
          profit,
          customerSegment
        });
      }

      if (rows.length === 0) {
        throw new Error("Could not parse any valid row with current header configurations.");
      }

      onDataImported(rows, fileName);
      setSuccess(`Successfully loaded ${rows.length} records! Header layouts saved.`);
      setError(null);
      // Clean up headers so form collapse
      setHeaders([]);
    } catch (err: any) {
      setError(err.message || "Failed to project mappings onto dataset template values.");
    }
  };

  const mapRawRowsToTransactions = (items: any[]): SaleTransaction[] => {
    let idCounter = 8000;
    return items.map((item, idx) => {
      const getAttr = (keys: string[], defaultVal: any) => {
        for (const k of keys) {
          if (item[k] !== undefined) return item[k];
          // check lowercased
          const matchedKey = Object.keys(item).find(key => key.toLowerCase() === k.toLowerCase() || key.toLowerCase().includes(k.toLowerCase()));
          if (matchedKey) return item[matchedKey];
        }
        return defaultVal;
      };

      const dateStr = getAttr(["date", "time", "orderDate", "day", "period"], new Date().toISOString().split("T")[0]);
      const productName = getAttr(["productName", "product", "item", "title"], "Anonymous Product");
      const category = getAttr(["category", "type", "class", "group"], "General Group");
      const region = getAttr(["region", "market", "area", "country", "location"], "General Region");
      const salesChannel = getAttr(["channel", "salesChannel", "source", "medium"], "Online Store");
      const quantity = Number(getAttr(["quantity", "qty", "volume", "units"], 1));
      const price = Number(getAttr(["price", "unitPrice", "rate", "cost_price"], 0));
      const cost = Number(getAttr(["cost", "unitCost", "cogs"], price * 0.5));
      const customerSegment = getAttr(["segment", "customerSegment", "client"], "Consumer");

      const revenue = quantity * price;
      const profit = revenue - (quantity * cost);

      return {
        id: item.id || `TX-JSON-${idCounter++}`,
        date: dateStr,
        productName,
        category,
        region,
        salesChannel,
        quantity,
        price,
        cost,
        revenue,
        profit,
        customerSegment
      };
    });
  };

  return (
    <div id="file-importer-container" className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md animate-fade-in">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-sm md:text-base">Custom Excel, CSV & JSON Importer</h2>
        </div>
        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
          CSV / TSV / JSON
        </span>
      </div>

      <div className="p-6">
        {/* Upload Drop Zone */}
        <div 
          id="dropzone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
            dragActive 
              ? "border-indigo-500 bg-indigo-50/40" 
              : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.tsv,.json,.txt"
            onChange={handleFileChange}
          />

          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200 mb-3">
            <Upload className="w-6 h-6 text-indigo-600" />
          </div>

          <p className="text-sm font-semibold text-slate-700">
            Click to upload or drag & drop files here
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-[340px]">
            Accepts exports from Excel/Google Sheets (.csv), Tab delimited (.tsv), or JSON structured files.
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 p-3.5 bg-rose-50/60 border border-rose-100 rounded-lg flex items-start gap-2.5 animate-fade-in text-rose-800 text-xs text-left">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-rose-900">Import Refused</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-lg flex items-start gap-2.5 animate-fade-in text-emerald-800 text-xs text-left">
            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-950">Import Complete</p>
              <p className="mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Column Mapping Form when Headers are discovered */}
        {headers.length > 0 && (
          <div className="mt-6 border border-indigo-100 rounded-xl bg-indigo-50/20 p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-xs md:text-sm">
                Map Spreadsheet Columns to Sales Template
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              We identified headers in your uploaded CSV. Map them to our standardized Sales & Revenue parameters so we can calculate margins and plot accurate charts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(mapping).map((fieldKey) => {
                const label = fieldKey.replace(/([A-Z])/g, " $1");
                const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                
                // Fields that must be parsed
                const isRequired = ["date", "productName", "quantity", "price"].includes(fieldKey);

                return (
                  <div key={fieldKey} className="flex flex-col gap-1 text-left">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      {capitalizedLabel}
                      {isRequired && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      className="text-xs text-slate-700 bg-white border border-slate-300 rounded-lg py-1.5 px-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={(mapping as any)[fieldKey]}
                      onChange={(e) => setMapping(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                    >
                      <option value="">-- Leave Empty / Not Present --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-indigo-100/50 pt-4">
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2"
                onClick={() => setHeaders([])}
              >
                Cancel
              </button>
              <button
                type="button"
                className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-5 py-2.5 shadow-sm hover:shadow transition-shadow"
                onClick={handleApplyMapping}
              >
                Construct Executive Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
