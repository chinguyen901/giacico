"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { Factory } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const path = usePathname();

  const links = [
    { href: "/", label: t("dashboard") },
    { href: "/orders", label: t("orders") },
    { href: "/schedule", label: t("schedule") },
    { href: "/inventory", label: t("inventory") },
    { href: "/delivery", label: t("delivery") },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <Factory className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-sm hidden md:block">{t("appName")}</span>
          <div className="flex items-center gap-1 ml-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  (l.href === "/" ? path === "/" : path.startsWith(l.href))
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {lang === "vi" ? "🇻🇳 Tiếng Việt" : "🇹🇼 繁體中文"}
          </span>
          <button
            onClick={() => setLang(lang === "vi" ? "zh" : "vi")}
            className="px-3 py-1 text-xs rounded border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            {lang === "vi" ? "切換中文" : "Chuyển VN"}
          </button>
        </div>
      </div>
    </nav>
  );
}
