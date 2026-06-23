"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { LINE_COLORS, OrderStatus, Region, ProductLine } from "@/data/mockData";
import { formatDate } from "@/lib/utils";
import { Search, Download } from "lucide-react";

interface Order {
  id: number;
  order_date: string | null;
  status: OrderStatus;
  vn_code: string;
  tw_code: string | null;
  vn_product_code: string | null;
  tw_product_code: string | null;
  customer_code: string | null;
  destination: string | null;
  unit: string;
  qty_ordered: number;
  qty_produced: number;
  qty_remaining: number;
  weight_kg: number;
  etd: string | null;
  ship_date: string | null;
  product_line: ProductLine | null;
  notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  CH: "bg-gray-100 text-gray-700 border-gray-200",
  DL: "bg-blue-100 text-blue-700 border-blue-200",
  TK: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CX: "bg-orange-100 text-orange-700 border-orange-200",
  DX: "bg-green-100 text-green-700 border-green-200",
  HU: "bg-red-100 text-red-700 border-red-200",
  NG: "bg-red-100 text-red-700 border-red-200",
  XN: "bg-purple-100 text-purple-700 border-purple-200",
  HM: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export default function OrdersPage() {
  const { t, lang } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLine, setFilterLine] = useState("all");

  const statuses: OrderStatus[] = ["CH", "DL", "TK", "CX", "DX", "HU", "NG", "XN", "HM"];
  const lines: ProductLine[] = ["AV", "ND", "GV"];

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterLine !== "all") params.set("line", filterLine);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (search.trim()) params.set("search", search.trim());

    setLoading(true);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filterStatus, filterLine]);

  const totalQty      = orders.reduce((s, o) => s + (o.qty_ordered || 0), 0);
  const totalProduced = orders.reduce((s, o) => s + (o.qty_produced || 0), 0);
  const totalShipped  = orders.filter((o) => o.status === "DX").reduce((s, o) => s + (o.qty_produced || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {lang === "vi" ? "Quản Lý Đơn Hàng" : "訂單管理"}
          </h1>
          <p className="text-sm text-slate-500">
            {t("total")} {loading ? "…" : orders.length} {t("items")}
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
          >
            <option value="all">{t("allProducts")}</option>
            {lines.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t("allStatus")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{t(s as Parameters<typeof t>[0])} ({s})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: lang === "vi" ? "Tổng SL đặt hàng" : "總訂購量", value: `${totalQty.toLocaleString()} ${lang === "vi" ? "hộp" : "箱"}`, color: "text-slate-700" },
          { label: lang === "vi" ? "Đã sản xuất" : "已生產", value: `${totalProduced.toLocaleString()} ${lang === "vi" ? "hộp" : "箱"}`, color: "text-blue-600" },
          { label: lang === "vi" ? "Đã xuất hàng" : "已出貨", value: `${totalShipped.toLocaleString()} ${lang === "vi" ? "hộp" : "箱"}`, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            {lang === "vi" ? "Đang tải dữ liệu từ database…" : "從資料庫載入中…"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">{t("orderCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("twCode")}</th>
                  <th className="px-4 py-3 font-medium">{t("product")}</th>
                  <th className="px-4 py-3 font-medium">{t("customer")}</th>
                  <th className="px-4 py-3 font-medium">{t("region")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("qty")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("qtyProduced")}</th>
                  <th className="px-4 py-3 font-medium text-right">{t("deliveryDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => {
                  const pct = o.qty_ordered > 0 ? Math.round((o.qty_produced / o.qty_ordered) * 100) : 0;
                  const line = o.product_line as ProductLine | null;
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-blue-600 font-medium">{o.vn_code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-500">{o.tw_code || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {line && (
                            <span className={`${LINE_COLORS[line]} text-white text-[10px] px-1.5 py-0.5 rounded font-medium`}>
                              {line}
                            </span>
                          )}
                          <div>
                            <div className="text-slate-800 font-medium text-xs">
                              {o.vn_product_code || o.tw_product_code || "—"}
                            </div>
                            <div className="text-slate-400 text-[10px] font-mono">{o.tw_product_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{o.customer_code || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">
                          {o.destination || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {o.qty_ordered.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-blue-600 font-medium">{o.qty_produced.toLocaleString()}</div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                          <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {o.etd ? formatDate(o.etd) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] || STATUS_COLORS.CH}`}>
                            {t(o.status as Parameters<typeof t>[0])}
                          </span>
                          {o.notes && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              ⚠ {o.notes}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            {lang === "vi" ? "Không tìm thấy đơn hàng nào" : "找不到符合條件的訂單"}
          </div>
        )}
      </div>
    </div>
  );
}
