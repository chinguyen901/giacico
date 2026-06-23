"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { Search, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface Material {
  id: number;
  code_vn: string;
  code_tw: string | null;
  name_vn: string | null;
  name_zh: string | null;
  type: string;
  unit: string;
  stock_warehouse: number;
  stock_sx1: number;
  stock_sx2: number;
  stock_sx4: number;
  expiry_date: string | null;
  lead_time_days: number;
  origin: string;
  seasonal: boolean;
  supplier: string | null;
}

type TabKey = "all" | "raw" | "semi" | "auxiliary" | "finished";

function getDaysLeft(expiryDate: string | null): number {
  if (!expiryDate) return 999;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp   = new Date(expiryDate);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
}

function getRisk(daysLeft: number, type: string) {
  if (type === "auxiliary" && daysLeft > 180) return "safe";
  if (daysLeft < 0)  return "expired";
  if (daysLeft < 14) return "danger";
  if (daysLeft < 45) return "warning";
  return "safe";
}

const RISK_STYLE: Record<string, string> = {
  expired: "bg-red-200 text-red-900 border-red-300",
  danger:  "bg-red-100 text-red-700 border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  safe:    "bg-green-100 text-green-700 border-green-200",
};

export default function InventoryPage() {
  const { t, lang } = useLang();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "stock">("expiry");

  const tabs: { key: TabKey; labelVi: string; labelZh: string }[] = [
    { key: "all",       labelVi: "Tất cả",        labelZh: "全部" },
    { key: "raw",       labelVi: "Nguyên liệu",   labelZh: "原料" },
    { key: "semi",      labelVi: "Bán thành phẩm", labelZh: "半成品" },
    { key: "auxiliary", labelVi: "Phụ liệu",       labelZh: "輔料" },
    { key: "finished",  labelVi: "Thành phẩm",     labelZh: "成品" },
  ];

  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("type", tab);
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    fetch(`/api/materials?${params}`)
      .then((r) => r.json())
      .then((data) => { setMaterials(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab, search]);

  const sorted = [...materials].sort((a, b) => {
    if (sortBy === "expiry") return getDaysLeft(a.expiry_date) - getDaysLeft(b.expiry_date);
    if (sortBy === "stock") return (b.stock_warehouse + b.stock_sx1 + b.stock_sx2 + b.stock_sx4) - (a.stock_warehouse + a.stock_sx1 + a.stock_sx2 + a.stock_sx4);
    return (lang === "vi" ? (a.name_vn || "") : (a.name_zh || "")).localeCompare(lang === "vi" ? (b.name_vn || "") : (b.name_zh || ""));
  });

  const danger  = materials.filter((m) => { const d = getDaysLeft(m.expiry_date); return getRisk(d, m.type) === "danger" || getRisk(d, m.type) === "expired"; });
  const warning = materials.filter((m) => getRisk(getDaysLeft(m.expiry_date), m.type) === "warning");
  const safe    = materials.filter((m) => getRisk(getDaysLeft(m.expiry_date), m.type) === "safe");

  const typeLabels: Record<string, { vi: string; zh: string; color: string }> = {
    raw:       { vi: "Nguyên liệu", zh: "原料",   color: "bg-green-100 text-green-700" },
    semi:      { vi: "BTP",         zh: "半成品", color: "bg-blue-100 text-blue-700" },
    auxiliary: { vi: "Phụ liệu",    zh: "輔料",   color: "bg-purple-100 text-purple-700" },
    finished:  { vi: "Thành phẩm",  zh: "成品",   color: "bg-orange-100 text-orange-700" },
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {lang === "vi" ? "Quản Lý Tồn Kho & Vật Tư" : "庫存與物料管理"}
        </h1>
        <p className="text-sm text-slate-500">
          {lang === "vi" ? "Tổng hợp từ: Kho + SX1 + SX2 + SX4" : "彙整自：倉庫 + 生產一 + 生產二 + 生產四"}
        </p>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: AlertTriangle, color: "red",    count: danger.length,  label: lang === "vi" ? "Nguy hiểm / Hết hạn" : "危險 / 已過期",    sub: lang === "vi" ? "vật tư cần xử lý ngay" : "物料需立即處理" },
          { icon: Clock,         color: "yellow",  count: warning.length, label: lang === "vi" ? "Cần theo dõi" : "需關注",                   sub: lang === "vi" ? "hết hạn trong 14–45 ngày" : "14–45天內到期" },
          { icon: CheckCircle,   color: "green",   count: safe.length,    label: lang === "vi" ? "An toàn" : "安全",                          sub: lang === "vi" ? "vật tư trong hạn" : "在有效期內的物料" },
        ].map((s) => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-200 rounded-xl p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 text-${s.color}-500`} />
              <span className={`text-sm font-semibold text-${s.color}-700`}>{s.label}</span>
            </div>
            <div className={`text-2xl font-bold text-${s.color}-600`}>{loading ? "…" : s.count}</div>
            <div className={`text-xs text-${s.color}-500 mt-0.5`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === tb.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {lang === "vi" ? tb.labelVi : tb.labelZh}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={lang === "vi" ? "Tìm theo mã, tên..." : "搜尋碼或名稱..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="expiry">{lang === "vi" ? "Sắp xếp: Hạn SD" : "排序：效期"}</option>
            <option value="stock">{lang === "vi" ? "Sắp xếp: Tồn kho" : "排序：庫存量"}</option>
            <option value="name">{lang === "vi" ? "Sắp xếp: Tên" : "排序：名稱"}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {lang === "vi" ? "Đang tải dữ liệu…" : "載入中…"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">{t("materialCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("material")}</th>
                  <th className="px-4 py-3 font-medium">{t("type")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("warehouse")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("sx1")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("sx2")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("sx4")}</th>
                  <th className="px-4 py-3 font-medium text-right font-bold">{t("totalStock")}</th>
                  <th className="px-4 py-3 font-medium">{t("expiryDate")}</th>
                  <th className="px-4 py-3 font-medium text-center">{t("riskLevel")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sorted.map((m) => {
                  const daysLeft = getDaysLeft(m.expiry_date);
                  const risk     = getRisk(daysLeft, m.type);
                  const total    = m.stock_warehouse + m.stock_sx1 + m.stock_sx2 + m.stock_sx4;
                  const tl       = typeLabels[m.type];
                  return (
                    <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${risk === "danger" || risk === "expired" ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-blue-600">{m.code_vn}</div>
                        <div className="font-mono text-[10px] text-slate-400">{m.code_tw}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs">{lang === "vi" ? m.name_vn : m.name_zh}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          {m.origin === "import" && <span className="bg-indigo-100 text-indigo-600 px-1 rounded">{lang === "vi" ? "Nhập khẩu" : "進口"}</span>}
                          {m.seasonal && <span className="bg-amber-100 text-amber-600 px-1 rounded">{lang === "vi" ? "Mùa vụ" : "季節性"}</span>}
                          <span className="text-slate-400">{lang === "vi" ? `Lead: ${m.lead_time_days}d` : `前置:${m.lead_time_days}天`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tl && <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${tl.color}`}>{lang === "vi" ? tl.vi : tl.zh}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{m.stock_warehouse.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{m.stock_sx1 > 0 ? m.stock_sx1.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{m.stock_sx2 > 0 ? m.stock_sx2.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{m.stock_sx4 > 0 ? m.stock_sx4.toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{total.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-slate-600">
                          {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW") : "—"}
                        </div>
                        {m.expiry_date && (
                          <div className={`text-[10px] mt-0.5 font-medium ${daysLeft < 0 ? "text-red-600" : daysLeft < 30 ? "text-red-500" : "text-slate-400"}`}>
                            {daysLeft < 0 ? (lang === "vi" ? `Hết hạn ${Math.abs(daysLeft)} ngày` : `已逾期${Math.abs(daysLeft)}天`) : (lang === "vi" ? `Còn ${daysLeft} ngày` : `剩${daysLeft}天`)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${RISK_STYLE[risk]}`}>
                          {risk === "expired" ? (lang === "vi" ? "HẾT HẠN" : "已過期") : risk === "danger" ? (lang === "vi" ? "⚠ NGUY HIỂM" : "⚠ 危險") : risk === "warning" ? (lang === "vi" ? "Cần theo dõi" : "需關注") : (lang === "vi" ? "✓ An toàn" : "✓ 安全")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && materials.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {lang === "vi" ? "Không tìm thấy vật tư nào" : "找不到物料"}
          </div>
        )}
      </div>
    </div>
  );
}
