"use client";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PRODUCTS, INVENTORY } from "@/data/mockData";
import { today, addDays } from "@/lib/utils";
import { Calculator, CheckCircle, XCircle, AlertTriangle, ChevronRight } from "lucide-react";

function fmt(s: string, lang: string) {
  return new Date(s).toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
}

interface AnalysisResult {
  materialReady: string;
  machineReady: string;
  productionDays: number;
  qaDays: number;
  logisticsDays: number;
  earliestDelivery: string;
  feasible: boolean;
  bottleneck: string;
  materialStatus: "available" | "partial" | "need-purchase";
  materialShortfall: number;
}

export default function DeliveryPage() {
  const { t, lang } = useLang();
  const [productCode, setProductCode] = useState("");
  const [qty, setQty] = useState("");
  const [requestedDate, setRequestedDate] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [calculated, setCalculated] = useState(false);

  const todayStr = today();

  function calculate() {
    const product = PRODUCTS.find((p) => p.code === productCode);
    if (!product || !qty || !requestedDate) return;

    const qtyNum = parseFloat(qty);

    // Material check (simplified: find related raw materials in inventory)
    const relatedMaterial = INVENTORY.find((m) => {
      if (product.line === "AV") return m.type === "raw" && m.nameVN.toLowerCase().includes("nha đam");
      if (product.line === "ND") return m.type === "raw" && m.nameVN.toLowerCase().includes("thạch");
      if (product.line === "GV") return m.type === "raw" && m.nameVN.toLowerCase().includes("nước");
      return false;
    });

    const totalStock = relatedMaterial
      ? relatedMaterial.stockWarehouse + relatedMaterial.stockSX1 + relatedMaterial.stockSX2 + relatedMaterial.stockSX4
      : 0;

    const neededRaw = qtyNum / product.yieldRate + product.wastageKg;
    const materialShortfall = Math.max(0, neededRaw - totalStock);

    let materialReady = todayStr;
    let materialStatus: AnalysisResult["materialStatus"] = "available";

    if (materialShortfall > 0) {
      materialStatus = materialShortfall > neededRaw * 0.5 ? "need-purchase" : "partial";
      materialReady = addDays(todayStr, relatedMaterial?.leadTimeDays ?? 14);
    }

    // Machine availability (simplified: assume machine available in 1-3 days based on current schedule)
    const machineDelay = product.machineRequired === "KM07" ? 1 : product.machineRequired === "WM01" ? 2 : product.machineRequired === "GA01" ? 3 : 2;
    const machineReady = addDays(todayStr, machineDelay);

    const startDate = materialReady > machineReady ? materialReady : machineReady;
    const productionDays = Math.ceil((qtyNum / 1000) * product.productionDaysPerTon * 2);
    const qaDays = product.qaDays;
    const logisticsDays = 3;

    const earliestDelivery = addDays(startDate, productionDays + qaDays + logisticsDays);
    const feasible = earliestDelivery <= requestedDate;

    let bottleneck = "";
    if (!feasible) {
      if (materialReady > machineReady && materialShortfall > 0) {
        bottleneck = lang === "vi"
          ? `Thiếu nguyên liệu (${materialShortfall.toFixed(0)} kg), cần ${relatedMaterial?.leadTimeDays ?? 14} ngày để mua`
          : `原料不足(${materialShortfall.toFixed(0)}公斤)，需${relatedMaterial?.leadTimeDays ?? 14}天採購`;
      } else {
        const daysLate = Math.round((new Date(earliestDelivery).getTime() - new Date(requestedDate).getTime()) / 86400000);
        bottleneck = lang === "vi"
          ? `Ngày giao sớm nhất trễ hơn yêu cầu ${daysLate} ngày`
          : `最早交貨日比要求晚${daysLate}天`;
      }
    }

    setResult({
      materialReady,
      machineReady,
      productionDays,
      qaDays,
      logisticsDays,
      earliestDelivery,
      feasible,
      bottleneck,
      materialStatus,
      materialShortfall,
    });
    setCalculated(true);
  }

  const selectedProduct = PRODUCTS.find((p) => p.code === productCode);

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {t("checkDelivery")}
        </h1>
        <p className="text-sm text-slate-500">
          {lang === "vi"
            ? "Nhập thông tin đơn hàng → hệ thống tự phân tích tất cả ràng buộc và tính ngày giao sớm nhất"
            : "輸入訂單資訊 → 系統自動分析所有限制條件並計算最早交期"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-500" />
            {lang === "vi" ? "Thông Tin Đơn Hàng" : "訂單資訊"}
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t("selectProduct")}</label>
            <select
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={productCode}
              onChange={(e) => { setProductCode(e.target.value); setCalculated(false); }}
            >
              <option value="">{lang === "vi" ? "— Chọn sản phẩm —" : "— 請選擇產品 —"}</option>
              {(["AV", "ND", "GV"] as const).map((line) => (
                <optgroup key={line} label={`${line} – ${line === "AV" ? "Nha Đam/蘆薈" : line === "ND" ? "Thạch Dừa/椰果" : "Nước Trái Cây/果汁"}`}>
                  {PRODUCTS.filter((p) => p.line === line).map((p) => (
                    <option key={p.code} value={p.code}>
                      {lang === "vi" ? p.nameVN : p.nameZH} – {p.code}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">{lang === "vi" ? "Mã TW:" : "台灣碼:"}</span><span className="font-mono text-slate-700">{selectedProduct.codeTW}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{lang === "vi" ? "Hiệu suất:" : "良率:"}</span><span className="text-slate-700">{(selectedProduct.yieldRate * 100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{lang === "vi" ? "Hao hụt:" : "損耗:"}</span><span className="text-slate-700">{selectedProduct.wastageKg} kg/lô</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{lang === "vi" ? "Máy:" : "機台:"}</span><span className="text-slate-700">{selectedProduct.machineRequired}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">QA:</span><span className="text-slate-700">{selectedProduct.qaDays} {lang === "vi" ? "ngày" : "天"}</span></div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t("enterQty")}</label>
            <input
              type="number"
              placeholder="5000"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={qty}
              onChange={(e) => { setQty(e.target.value); setCalculated(false); }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t("requestedDate")}</label>
            <input
              type="date"
              min={todayStr}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={requestedDate}
              onChange={(e) => { setRequestedDate(e.target.value); setCalculated(false); }}
            />
          </div>

          <button
            onClick={calculate}
            disabled={!productCode || !qty || !requestedDate}
            className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            {t("calculate")}
          </button>
        </div>

        {/* Result Panel */}
        <div className="space-y-3">
          {calculated && result ? (
            <>
              {/* Verdict */}
              <div className={`rounded-xl p-4 border-2 ${result.feasible ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="flex items-center gap-3">
                  {result.feasible
                    ? <CheckCircle className="w-8 h-8 text-green-500" />
                    : <XCircle className="w-8 h-8 text-red-500" />}
                  <div>
                    <div className={`text-xl font-bold ${result.feasible ? "text-green-700" : "text-red-700"}`}>
                      {result.feasible ? t("feasible") : t("notFeasible")}
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      <span className="font-medium">{t("earliestDate")}:</span>{" "}
                      <span className={`font-bold ${result.feasible ? "text-green-700" : "text-red-700"}`}>
                        {fmt(result.earliestDelivery, lang)}
                      </span>
                    </div>
                    {requestedDate && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {lang === "vi" ? "Yêu cầu:" : "要求:"} {fmt(requestedDate, lang)}
                      </div>
                    )}
                  </div>
                </div>
                {result.bottleneck && (
                  <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-lg p-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-red-700">
                      <span className="font-semibold">{t("bottleneck")}:</span> {result.bottleneck}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <h4 className="font-semibold text-slate-700 text-sm mb-3">
                  {lang === "vi" ? "Phân Tích Từng Ràng Buộc" : "各限制條件分析"}
                </h4>
                <div className="space-y-2.5">
                  {[
                    {
                      label: t("materialReady"),
                      date: result.materialReady,
                      value: result.materialStatus === "available"
                        ? lang === "vi" ? "✓ Đủ tồn kho" : "✓ 庫存充足"
                        : result.materialStatus === "partial"
                        ? lang === "vi" ? "⚠ Thiếu một phần, cần mua thêm" : "⚠ 部分不足，需補購"
                        : lang === "vi" ? "✗ Cần đặt mua toàn bộ" : "✗ 需全部採購",
                      color: result.materialStatus === "available" ? "text-green-600" : "text-red-600",
                      barColor: result.materialStatus === "available" ? "bg-green-500" : "bg-red-500",
                      days: 0,
                    },
                    {
                      label: t("machineReady"),
                      date: result.machineReady,
                      value: lang === "vi" ? `Máy ${selectedProduct?.machineRequired} available` : `${selectedProduct?.machineRequired}機台可用`,
                      color: "text-blue-600",
                      barColor: "bg-blue-500",
                      days: 1,
                    },
                    {
                      label: t("productionTime"),
                      date: addDays(result.materialReady > result.machineReady ? result.materialReady : result.machineReady, result.productionDays),
                      value: `${result.productionDays} ${lang === "vi" ? "ngày SX" : "天生產"}`,
                      color: "text-indigo-600",
                      barColor: "bg-indigo-500",
                      days: result.productionDays,
                    },
                    {
                      label: `${t("qaTime")} (${selectedProduct?.qaDays} ${lang === "vi" ? "ngày" : "天"})`,
                      date: addDays(result.materialReady > result.machineReady ? result.materialReady : result.machineReady, result.productionDays + result.qaDays),
                      value: lang === "vi" ? "Kiểm định chất lượng" : "品質檢驗",
                      color: "text-purple-600",
                      barColor: "bg-purple-500",
                      days: result.qaDays,
                    },
                    {
                      label: `${t("logistics")} (${result.logisticsDays} ${lang === "vi" ? "ngày" : "天"})`,
                      date: result.earliestDelivery,
                      value: lang === "vi" ? "Chuẩn bị container & xuất hàng" : "備貨裝櫃出貨",
                      color: "text-orange-600",
                      barColor: "bg-orange-500",
                      days: result.logisticsDays,
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${step.barColor}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-600">{step.label}</span>
                          <span className="text-xs font-mono text-slate-500">
                            {new Date(step.date).toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW", { day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                        <div className={`text-xs mt-0.5 ${step.color}`}>{step.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Final Arrow */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {t("earliestDate")}:
                    <span className={`ml-2 ${result.feasible ? "text-green-600" : "text-red-600"}`}>
                      {fmt(result.earliestDelivery, lang)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Material Detail */}
              {result.materialShortfall > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                  <div className="font-semibold text-amber-700 mb-1">
                    {lang === "vi" ? "⚠ Chi Tiết Thiếu Nguyên Liệu" : "⚠ 原料不足明細"}
                  </div>
                  <div className="text-amber-700 text-xs space-y-1">
                    <div>{lang === "vi" ? `Cần: ${((parseFloat(qty) / (selectedProduct?.yieldRate ?? 0.9)) + (selectedProduct?.wastageKg ?? 600)).toFixed(0)} kg nguyên liệu thô` : `需要:${((parseFloat(qty) / (selectedProduct?.yieldRate ?? 0.9)) + (selectedProduct?.wastageKg ?? 600)).toFixed(0)}公斤原料`}</div>
                    <div>{lang === "vi" ? `Cần mua thêm: ${result.materialShortfall.toFixed(0)} kg` : `需補購:${result.materialShortfall.toFixed(0)}公斤`}</div>
                    <div>{lang === "vi" ? `Lead time mua: ${INVENTORY.find(m => m.type === "raw")?.leadTimeDays ?? 14} ngày` : `採購前置期:${INVENTORY.find(m => m.type === "raw")?.leadTimeDays ?? 14}天`}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
              <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {lang === "vi"
                  ? "Chọn sản phẩm, nhập số lượng và ngày giao để bắt đầu phân tích"
                  : "請選擇產品、輸入數量和交期後開始分析"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
