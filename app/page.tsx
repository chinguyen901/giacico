"use client";
import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { LINE_COLORS, ProductLine } from "@/data/mockData";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ShoppingCart, Factory, Package, Truck,
  AlertTriangle, Clock, TrendingUp, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";

interface Stats {
  orders:       { total: number; in_production: number; ready_to_ship: number; shipped: number; pending: number };
  expiryAlerts: number;
  agedCount:    number;
  todayPlan:    { planned: number; actual: number };
}

interface Order {
  id: number;
  vn_code: string;
  vn_product_code: string | null;
  tw_product_code: string | null;
  product_line: ProductLine | null;
  customer_code: string | null;
  destination: string | null;
  qty_ordered: number;
  etd: string | null;
  status: string;
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [active, setActive] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => { if (!d.error) setStats(d); });
    fetch("/api/orders?status=DL&status=CX&status=XN").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setActive(d.filter((o) => ["DL", "CX", "XN"].includes(o.status)).slice(0, 8));
    });
  }, []);

  const todayStr = new Date().toLocaleDateString(lang === "vi" ? "vi-VN" : "zh-TW");
  const planned  = stats?.todayPlan.planned ?? 0;
  const actual   = stats?.todayPlan.actual  ?? 0;
  const achievement = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  const statusData = stats ? [
    { name: t("CH"), value: stats.orders.pending,       color: "#94a3b8" },
    { name: t("DL"), value: stats.orders.in_production, color: "#3b82f6" },
    { name: t("CX"), value: stats.orders.ready_to_ship, color: "#f97316" },
    { name: t("DX"), value: stats.orders.shipped,        color: "#22c55e" },
  ].filter((d) => d.value > 0) : [];

  const weekData = [
    { day: "T2", planned: 9000, actual: 8850 },
    { day: "T3", planned: 8500, actual: 8200 },
    { day: "T4", planned: 9500, actual: 7800 },
    { day: "T5", planned: planned || 9000, actual: actual || undefined },
    { day: "T6", planned: 8000, actual: undefined },
    { day: "T7", planned: 5000, actual: undefined },
  ];

  const kpis = [
    { label: t("totalOrders"),   value: stats?.orders.total        ?? "…", icon: ShoppingCart, color: "bg-blue-500",   link: "/orders" },
    { label: t("inProduction"),  value: stats?.orders.in_production ?? "…", icon: Factory,      color: "bg-yellow-500", link: "/schedule" },
    { label: t("readyToShip"),   value: stats?.orders.ready_to_ship ?? "…", icon: Truck,        color: "bg-orange-500", link: "/orders" },
    { label: t("shipped"),       value: stats?.orders.shipped       ?? "…", icon: Package,      color: "bg-green-500",  link: "/orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {lang === "vi" ? "Tổng Quan Hệ Thống" : "系統總覽"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === "vi" ? `Cập nhật: ${todayStr}` : `更新時間：${todayStr}`}
          </p>
        </div>
        <div className="flex gap-2">
          {(["AV", "ND", "GV"] as const).map((line) => (
            <span key={line} className={`${LINE_COLORS[line]} text-white text-xs px-2.5 py-1 rounded-full font-medium`}>{line}</span>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((s) => (
          <Link key={s.label} href={s.link}>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className={`${s.color} text-white p-2 rounded-lg`}><s.icon className="w-5 h-5" /></div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-800">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alert Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/inventory">
          <div className={`rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow ${(stats?.expiryAlerts ?? 0) > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`w-5 h-5 ${(stats?.expiryAlerts ?? 0) > 0 ? "text-red-500" : "text-green-500"}`} />
              <span className="font-semibold text-sm text-slate-700">{t("expiryAlert")}</span>
            </div>
            <div className={`text-3xl font-bold ${(stats?.expiryAlerts ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
              {stats?.expiryAlerts ?? "…"}
            </div>
            <div className="text-xs text-slate-500 mt-1">{lang === "vi" ? "vật tư hết hạn < 30 ngày" : "物料效期 < 30天"}</div>
          </div>
        </Link>

        <Link href="/inventory">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-sm text-slate-700">{t("agedStock")}</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats?.agedCount ?? "…"}</div>
            <div className="text-xs text-slate-500 mt-1">{lang === "vi" ? "lô thành phẩm tồn > 2 tháng" : "庫存超2個月批次"}</div>
          </div>
        </Link>

        <Link href="/schedule">
          <div className={`rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow ${achievement >= 80 ? "bg-blue-50 border-blue-200" : "bg-yellow-50 border-yellow-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${achievement >= 80 ? "text-blue-500" : "text-yellow-500"}`} />
              <span className="font-semibold text-sm text-slate-700">{t("achievement")}</span>
            </div>
            <div className={`text-3xl font-bold ${achievement >= 80 ? "text-blue-600" : "text-yellow-600"}`}>
              {planned > 0 ? `${achievement}%` : "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {lang === "vi" ? `${actual.toLocaleString()} / ${planned.toLocaleString()} kg hôm nay` : `今日 ${actual.toLocaleString()} / ${planned.toLocaleString()} 公斤`}
            </div>
            {planned > 0 && (
              <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                <div className={`h-full rounded-full ${achievement >= 80 ? "bg-blue-500" : "bg-yellow-500"}`} style={{ width: `${Math.min(achievement, 100)}%` }} />
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">
            {lang === "vi" ? "Sản Lượng Tuần Này (kg)" : "本週生產量 (公斤)"}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => v != null ? `${Number(v).toLocaleString()} kg` : "—"} />
              <Legend />
              <Bar dataKey="planned" name={t("planned")} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual"  name={t("actual")}  fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 mb-3 text-sm">
            {lang === "vi" ? "Đơn Hàng Theo Trạng Thái" : "訂單狀態分佈"}
          </h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-300 text-sm">
              {lang === "vi" ? "Đang tải…" : "載入中…"}
            </div>
          )}
        </div>
      </div>

      {/* Active Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-700 text-sm">
            {lang === "vi" ? "Đơn Hàng Đang Xử Lý" : "處理中訂單"}
          </h3>
          <Link href="/orders" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
            {lang === "vi" ? "Xem tất cả" : "查看全部"} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="pb-2 font-medium">{t("orderCode")}</th>
                <th className="pb-2 font-medium">{t("product")}</th>
                <th className="pb-2 font-medium">{t("region")}</th>
                <th className="pb-2 font-medium text-right">{t("qty")}</th>
                <th className="pb-2 font-medium text-right">{t("deliveryDate")}</th>
                <th className="pb-2 font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {active.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center text-slate-400 text-sm">{lang === "vi" ? "Đang tải…" : "載入中…"}</td></tr>
              ) : active.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="py-2 font-mono text-xs text-blue-600">{o.vn_code}</td>
                  <td className="py-2">
                    {o.product_line && (
                      <span className={`${LINE_COLORS[o.product_line]} text-white text-[10px] px-1.5 py-0.5 rounded mr-1.5`}>{o.product_line}</span>
                    )}
                    <span className="text-slate-700 text-xs">{o.vn_product_code || o.tw_product_code}</span>
                  </td>
                  <td className="py-2 text-slate-500 text-xs">{o.destination || "—"}</td>
                  <td className="py-2 text-right font-medium">{o.qty_ordered.toLocaleString()}</td>
                  <td className="py-2 text-right text-slate-500 text-xs">{o.etd ? formatDate(o.etd) : "—"}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {t(o.status as Parameters<typeof t>[0])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
