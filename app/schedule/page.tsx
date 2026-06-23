"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PRODUCTION_SLOTS, MACHINES, MACHINE_LABELS, LINE_COLORS, SLOT_STATUS_COLORS } from "@/data/mockData";
import { today } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function fmtDisplay(d: Date, lang: string) {
  return d.toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW", { month: "short", day: "numeric", weekday: "short" });
}

export default function SchedulePage() {
  const { t, lang } = useLang();
  const todayStr = today();
  const [startOffset, setStartOffset] = useState(-2);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(todayStr), startOffset + i);
    return { date: fmtDate(d), display: fmtDisplay(d, lang), isToday: fmtDate(d) === todayStr };
  });

  // Stats
  const totalPlanned = PRODUCTION_SLOTS.reduce((s, sl) => s + sl.plannedQty, 0);
  const totalActual = PRODUCTION_SLOTS.filter(s => s.actualQty !== null).reduce((s, sl) => s + (sl.actualQty ?? 0), 0);
  const doneSlots = PRODUCTION_SLOTS.filter(s => s.status === "done").length;
  const inProgSlots = PRODUCTION_SLOTS.filter(s => s.status === "in-progress").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {lang === "vi" ? "Lịch Sản Xuất" : "生產排程"}
          </h1>
          <p className="text-sm text-slate-500">
            {lang === "vi" ? "Gantt chart – AV / ND / GV tổng hợp" : "甘特圖 – AV / ND / GV 整合"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStartOffset(s => s - 7)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setStartOffset(0)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 transition-colors">
            <Calendar className="w-4 h-4" />
            {lang === "vi" ? "Hôm nay" : "今天"}
          </button>
          <button onClick={() => setStartOffset(s => s + 7)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: lang === "vi" ? "Tổng kế hoạch" : "計劃總量", value: `${totalPlanned.toLocaleString()} kg`, color: "text-slate-700" },
          { label: lang === "vi" ? "Đã thực hiện" : "已完成量", value: `${totalActual.toLocaleString()} kg`, color: "text-blue-600" },
          { label: lang === "vi" ? "Ca đã hoàn thành" : "已完成班次", value: doneSlots, color: "text-green-600" },
          { label: lang === "vi" ? "Đang sản xuất" : "生產中", value: inProgSlots, color: "text-yellow-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: "bg-blue-200 border-blue-400", label: lang === "vi" ? "Kế hoạch" : "計劃" },
          { color: "bg-yellow-200 border-yellow-400", label: lang === "vi" ? "Đang SX" : "進行中" },
          { color: "bg-green-200 border-green-400", label: lang === "vi" ? "Hoàn thành" : "已完成" },
          { color: "bg-red-200 border-red-400", label: lang === "vi" ? "Trễ" : "延遲" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${l.color}`} />
            <span className="text-slate-600">{l.label}</span>
          </div>
        ))}
        <div className="ml-4 flex gap-3">
          {(["AV", "ND", "GV"] as const).map((line) => (
            <div key={line} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${LINE_COLORS[line]}`} />
              <span className="text-slate-600">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left font-medium text-slate-600 border-b border-r border-slate-100 w-48">
                  {lang === "vi" ? "Máy / Dây chuyền" : "機台 / 產線"}
                </th>
                {days.map((d) => (
                  <th
                    key={d.date}
                    colSpan={2}
                    className={`px-2 py-2.5 text-center font-medium border-b border-slate-100 ${d.isToday ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
                  >
                    {d.display}
                    {d.isToday && (
                      <span className="ml-1 text-[10px] bg-blue-600 text-white px-1 rounded">
                        {lang === "vi" ? "Hôm nay" : "今天"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="border-r border-slate-100" />
                {days.map((d) => (
                  <>
                    <th key={`${d.date}-day`} className="px-1 py-1 text-center text-[10px] text-slate-400 font-normal border-r border-slate-50">
                      {t("day")}
                    </th>
                    <th key={`${d.date}-night`} className="px-1 py-1 text-center text-[10px] text-slate-400 font-normal border-r border-slate-100">
                      {t("night")}
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MACHINES.map((machine) => (
                <tr key={machine} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3 border-r border-slate-100">
                    <div className="font-medium text-slate-700">{machine}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {lang === "vi" ? MACHINE_LABELS[machine].en : MACHINE_LABELS[machine].zh}
                    </div>
                  </td>
                  {days.map((d) =>
                    (["day", "night"] as const).map((shift) => {
                      const slot = PRODUCTION_SLOTS.find(
                        (s) => s.date === d.date && s.machine === machine && s.shift === shift
                      );
                      return (
                        <td
                          key={`${d.date}-${shift}`}
                          className={`px-1 py-2 text-center border-r border-slate-50 ${d.isToday ? "bg-blue-50/40" : ""}`}
                        >
                          {slot ? (
                            <div className={`rounded border text-[10px] p-1.5 ${SLOT_STATUS_COLORS[slot.status]}`}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${LINE_COLORS[slot.productLine]}`} />
                                <span className="font-bold">{slot.productLine}</span>
                              </div>
                              <div className="text-[9px] leading-tight truncate max-w-[80px]" title={slot.productName}>
                                {slot.productName.split(" ").slice(-2).join(" ")}
                              </div>
                              <div className="mt-1 font-medium">
                                {slot.actualQty !== null
                                  ? `✓ ${slot.actualQty.toLocaleString()}`
                                  : slot.plannedQty.toLocaleString()}
                                <span className="text-[8px] ml-0.5">kg</span>
                              </div>
                              {slot.actualQty !== null && (
                                <div className="mt-0.5 text-[8px] opacity-70">
                                  {lang === "vi" ? "kh:" : "計:"}
                                  {slot.plannedQty.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-16 rounded border border-dashed border-slate-100" />
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nata Backward Schedule Panel */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4">
        <h3 className="font-semibold text-blue-800 text-sm mb-3">
          {lang === "vi" ? "🌿 Kế Hoạch Nata – Backward Scheduling" : "🌿 椰果計劃 – 反向排程"}
        </h3>
        <p className="text-xs text-blue-600 mb-3">
          {lang === "vi"
            ? "Nhập ngày SX thành phẩm → hệ thống tự tính ngày cấy, thu hoạch, gia nhiệt, cắt"
            : "輸入成品生產日 → 系統自動計算接種、採收、加熱、切割日期"}
        </p>
        <NataCalculator lang={lang} />
      </div>
    </div>
  );
}

function NataCalculator({ lang }: { lang: string }) {
  const [targetDate, setTargetDate] = useState(today());
  const [nuoiDays, setNuoiDays] = useState(18);

  function addD(base: string, n: number) {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
  }
  function subD(base: string, n: number) { return addD(base, -n); }
  function fmt(s: string) { return new Date(s).toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW", { day: "2-digit", month: "2-digit", weekday: "short" }); }

  const catDate = subD(targetDate, nuoiDays + 2 + 1); // cấy
  const thuDate = subD(targetDate, 2 + 1);            // thu hoạch
  const giaNhietDate = subD(targetDate, 2);            // gia nhiệt
  const catHatDate = subD(targetDate, 1);              // cắt hạt

  const isPast = new Date(catDate) < new Date(today());

  const steps = [
    { label: lang === "vi" ? "Cấy vi sinh" : "接種菌種", date: catDate, color: "bg-purple-500" },
    { label: lang === "vi" ? `Nuôi (${nuoiDays} ngày)` : `培養(${nuoiDays}天)`, date: `${fmt(catDate)} → ${fmt(thuDate)}`, color: "bg-blue-500", range: true },
    { label: lang === "vi" ? "Thu hoạch" : "採收", date: thuDate, color: "bg-indigo-500" },
    { label: lang === "vi" ? "Gia nhiệt" : "加熱", date: giaNhietDate, color: "bg-orange-500" },
    { label: lang === "vi" ? "Cắt hạt lựu" : "切粒", date: catHatDate, color: "bg-yellow-500" },
    { label: lang === "vi" ? "SX thành phẩm" : "成品生產", date: targetDate, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">
            {lang === "vi" ? "Ngày SX thành phẩm ND:" : "ND成品預計生產日:"}
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-700 mb-1">
            {lang === "vi" ? "Số ngày nuôi:" : "培養天數:"}
          </label>
          <select
            value={nuoiDays}
            onChange={(e) => setNuoiDays(Number(e.target.value))}
            className="px-3 py-1.5 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {[14, 15, 16, 17, 18, 19, 20, 21].map((n) => (
              <option key={n} value={n}>{n} {lang === "vi" ? "ngày" : "天"}</option>
            ))}
          </select>
        </div>
      </div>

      {isPast && (
        <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
          ⚠️ {lang === "vi"
            ? `Ngày cấy cần là ${fmt(catDate)} – đã qua! Không thể kịp cho ngày SX đã chọn.`
            : `需接種日 ${fmt(catDate)} 已過！無法趕上所選生產日期。`}
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center text-center min-w-[90px]">
              <div className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
                {i + 1}
              </div>
              <div className="text-[10px] font-medium text-slate-700 mt-1">{step.label}</div>
              <div className={`text-[9px] mt-0.5 font-mono ${
                (step.range ? step.date : fmt(step.date as string)) && !step.range && new Date(step.date as string) < new Date(today())
                  ? "text-red-500 font-bold"
                  : "text-slate-500"
              }`}>
                {step.range ? step.date : fmt(step.date as string)}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="text-slate-300 text-lg mb-3">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
