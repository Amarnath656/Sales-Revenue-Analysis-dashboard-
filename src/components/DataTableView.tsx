import { useState } from "react";
import { ArrowUpDown, Download, Search, FileJson, FileSpreadsheet, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { SaleTransaction } from "../types";

interface DataTableViewProps {
  transactions: SaleTransaction[];
}

type SortField = "date" | "revenue" | "profit" | "quantity" | "productName";
type SortOrder = "asc" | "desc";

export default function DataTableView({ transactions }: DataTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Sorting
  const sortedTransactions = [...transactions].sort((a, b) => {
    let result = 0;
    if (sortField === "date") {
      result = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortField === "productName") {
      result = a.productName.localeCompare(b.productName);
    } else {
      result = (a[sortField] as number) - (b[sortField] as number);
    }
    return sortOrder === "asc" ? result : -result;
  });

  // Pagination bounds
  const totalRows = sortedTransactions.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedRows = sortedTransactions.slice(indexOfFirstRow, indexOfLastRow);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const changePage = (direction: "prev" | "next") => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Exporters: Export Current View as CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["Id", "Date", "Product", "Category", "Region", "Channel", "Qty", "UnitPrice", "UnitCost", "Revenue", "Profit", "Segment"];
    const csvContent = [
      headers.join(","),
      ...transactions.map(t => [
        t.id,
        t.date,
        `"${t.productName.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.region}"`,
        `"${t.salesChannel}"`,
        t.quantity,
        t.price,
        t.cost,
        t.revenue,
        t.profit,
        `"${t.customerSegment}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Filtered_Sales_Export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exporters: Export Current View as JSON
  const handleExportJSON = () => {
    if (transactions.length === 0) return;
    const jsonString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Filtered_Sales_Export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="data-table-panel" className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
      {/* Table Header controls */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-sm">Ledger Row Inspection</h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
            {transactions.length} matched
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Export Results:</span>
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-none hover:shadow-sm"
            onClick={handleExportCSV}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel/CSV
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-none hover:shadow-sm"
            onClick={handleExportJSON}
          >
            <FileJson className="w-3.5 h-3.5 text-amber-600" /> JSON File
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider select-none">
              <th className="py-3 px-4 text-center w-20">Tx ID</th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("date")}>
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("productName")}>
                <div className="flex items-center gap-1">
                  Product Name
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Market Region</th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => handleSort("quantity")}>
                <div className="flex items-center gap-1 justify-end">
                  Qty
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right font-semibold" onClick={() => handleSort("revenue")}>
                <div className="flex items-center gap-1 justify-end">
                  Gross Rev
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right text-emerald-600 font-semibold" onClick={() => handleSort("profit")}>
                <div className="flex items-center gap-1 justify-end">
                  Margin (Prof)
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((t, idx) => {
                const marginPercent = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;
                return (
                  <tr key={t.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-400 font-semibold">{t.id}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">{t.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 text-left">{t.productName}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-left">{t.region}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">{t.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      ${t.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-left whitespace-nowrap max-w-[120px]">
                      <div className="flex flex-col items-end">
                        <span className="font-extrabold text-emerald-600">
                          ${t.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {marginPercent.toFixed(0)}% margin
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-medium font-sans">
                  No core row-level matches discovered matching active slicers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control footer bar */}
      {totalRows > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs bg-slate-50">
          <div className="flex items-center gap-2.5 justify-center sm:justify-start">
            <span className="text-slate-500 font-medium">Rows display:</span>
            <select
              className="border border-slate-300 rounded px-1.5 py-1 text-slate-700 bg-white"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
            </select>
            <span className="text-slate-400 font-medium">
              Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, totalRows)} of {totalRows}
            </span>
          </div>

          <div className="flex items-center gap-1 justify-center sm:justify-end">
            <button
              type="button"
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border transition-all ${
                currentPage === 1
                  ? "border-slate-200 text-slate-300 cursor-not-allowed"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => changePage("prev")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3.5 py-1.5 font-bold text-slate-800 bg-slate-200/50 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border transition-all ${
                currentPage === totalPages
                  ? "border-slate-200 text-slate-300 cursor-not-allowed"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => changePage("next")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
