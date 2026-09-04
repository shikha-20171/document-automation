"use client";

import React, { useState } from "react";
import {
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Rows,
  Columns,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (markdownTable: string) => void;
}

export default function TableBuilderModal({
  isOpen,
  onClose,
  onInsertTable,
}: TableBuilderModalProps) {
  const [headers, setHeaders] = useState<string[]>(["Component / Item", "Specification / Variable", "Amount / Value"]);
  const [rows, setRows] = useState<string[][]>([
    ["Basic Salary", "Base Monthly CTC", "{{basic_salary}}"],
    ["House Rent Allowance (HRA)", "40% of Basic", "{{hra}}"],
    ["Special Allowance", "Discretionary allowance", "{{special_allowance}}"],
    ["Total Annual CTC", "Gross Target Compensation", "{{total_salary}}"],
  ]);
  const [hasHeader, setHasHeader] = useState(true);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const newRow = Array(headers.length).fill("");
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rowIndex));
  };

  const handleAddColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setRows(rows.map((row) => [...row, ""]));
  };

  const handleDeleteColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, idx) => idx !== colIndex));
    setRows(rows.map((row) => row.filter((_, idx) => idx !== colIndex)));
  };

  const handleHeaderChange = (idx: number, val: string) => {
    const newHeaders = [...headers];
    newHeaders[idx] = val;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = val;
    setRows(newRows);
  };

  const loadPreset = (type: "salary" | "sla" | "invoice") => {
    if (type === "salary") {
      setHeaders(["Salary Component", "Basis / Breakdown", "Annual Amount"]);
      setRows([
        ["Basic Salary", "50% of Total CTC", "{{basic_salary}}"],
        ["House Rent Allowance (HRA)", "50% of Basic", "{{hra}}"],
        ["Special Allowance", "Performance Allowance", "{{special_allowance}}"],
        ["Total Annual Gross CTC", "All Inclusive", "{{total_salary}}"],
      ]);
    } else if (type === "sla") {
      setHeaders(["Service Level Item", "Target Metric", "SLA Penalty"]);
      setRows([
        ["System Availability", "99.9% Uptime", "5% Service Credit"],
        ["Critical Issue Response", "< 30 Minutes", "Escalation to VP"],
        ["Data Backup Frequency", "Daily Automated", "Zero-Loss Guarantee"],
      ]);
    } else {
      setHeaders(["Item Description", "Qty", "Unit Price", "Total"]);
      setRows([
        ["Software License Enterprise Tier", "1", "{{contract_value}}", "{{contract_value}}"],
        ["Implementation & Training", "1", "Included", "Included"],
        ["Annual Support & SLA", "1", "Included", "Included"],
      ]);
    }
  };

  const generateMarkdownTable = (): string => {
    let md = "\n";
    if (hasHeader) {
      md += `| ${headers.join(" | ")} |\n`;
      md += `| ${headers.map(() => ":---").join(" | ")} |\n`;
    }
    rows.forEach((row) => {
      md += `| ${row.join(" | ")} |\n`;
    });
    md += "\n";
    return md;
  };

  const handleInsert = () => {
    const md = generateMarkdownTable();
    onInsertTable(md);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#274690]/10 flex items-center justify-center text-[#274690]">
              <TableIcon size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Interactive Table Builder</h2>
              <p className="text-xs text-slate-500">Configure rows, columns, and variables before inserting into canvas.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 py-2.5 bg-blue-50/40 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#274690] text-[11px] uppercase tracking-wider">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset("salary")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#274690] font-bold rounded-lg border border-blue-200 transition text-[11px]"
            >
              💰 Salary Breakdown
            </button>
            <button
              type="button"
              onClick={() => loadPreset("sla")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#274690] font-bold rounded-lg border border-blue-200 transition text-[11px]"
            >
              📋 SLA Matrix
            </button>
            <button
              type="button"
              onClick={() => loadPreset("invoice")}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#274690] font-bold rounded-lg border border-blue-200 transition text-[11px]"
            >
              🧾 Quotation / Pricing
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddRow}
              className="h-7 text-[11px] font-bold rounded-lg gap-1"
            >
              <Rows size={13} /> Add Row
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddColumn}
              className="h-7 text-[11px] font-bold rounded-lg gap-1"
            >
              <Columns size={13} /> Add Column
            </Button>
          </div>
        </div>

        {/* Grid Editor */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
            <table className="w-full text-xs">
              {hasHeader && (
                <thead className="bg-slate-100/80 border-b border-slate-200">
                  <tr>
                    {headers.map((header, colIdx) => (
                      <th key={colIdx} className="p-2 text-left min-w-[160px]">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={header}
                            onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-800 text-xs focus:border-[#274690] focus:outline-none"
                          />
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete column"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-10 p-2"></th>
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/50 transition">
                    {row.map((cell, colIdx) => (
                      <td key={colIdx} className="p-2">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 text-xs focus:bg-white focus:border-[#274690] focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rowIdx)}
                          className="text-slate-300 hover:text-rose-600 p-1 transition"
                          title="Delete row"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-bold text-slate-600"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleInsert}
            className="rounded-xl bg-[#274690] text-xs font-bold text-white hover:bg-[#1f3561] px-5 h-9"
          >
            Insert Table into Canvas
          </Button>
        </div>
      </div>
    </div>
  );
}
