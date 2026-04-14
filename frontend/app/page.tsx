"use client";
import { useEffect, useState } from "react";
import { FileText, History, Zap, Palette } from "lucide-react";
import BrandForm from "./components/BrandForm";
import GenerateForm from "./components/GenerateForm";
import HistoryList from "./components/HistoryList";
import SkillsList from "./components/SkillsList";
import { fetchBrands } from "./lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Tab = "generate" | "history" | "brand" | "skills";

const NAV = [
  { key: "generate" as Tab, label: "Generate", icon: FileText },
  { key: "history" as Tab, label: "History", icon: History },
  { key: "skills" as Tab, label: "Skills", icon: Zap },
  { key: "brand" as Tab, label: "Brand", icon: Palette },
];

export default function Home() {
  const [brands, setBrands] = useState([]);
  const [tab, setTab] = useState<Tab>("generate");
  const [stats, setStats] = useState({ documents_generated: 0, skills_learned: 0, brands: 0 });

  const loadBrands = async () => {
    const data = await fetchBrands();
    setBrands(data);
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadBrands(); loadStats(); }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-green-600 to-green-900 text-white flex flex-col fixed h-full z-10">
        <div className="px-6 py-8 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-green-700 font-bold text-lg">N</div>
            <p className="font-bold text-white text-base leading-tight">NexDoc</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {NAV.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-white text-green-700 shadow-lg"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-white/20 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Docs", value: stats.documents_generated, tab: "history" as Tab },
              { label: "Skills", value: stats.skills_learned, tab: "skills" as Tab },
              { label: "Brands", value: stats.brands, tab: "brand" as Tab },
            ].map((s) => (
              <button key={s.label} onClick={() => setTab(s.tab)}
                className="bg-white/10 hover:bg-white/20 rounded-xl py-2 transition-all">
                <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>
          <p className="text-xs text-white/40 text-center">© 2026 NexDoc</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8 pt-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-green-700 rounded-full" />
              <h1 className="text-2xl font-bold text-gray-900">
                {tab === "generate" && "Generate Document"}
                {tab === "history" && "Document History"}
                {tab === "skills" && "Agent Skills"}
                {tab === "brand" && "Manage Brand"}
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-4">
              {tab === "generate" && "Create brand-aware documents with AI"}
              {tab === "history" && "View and download previously generated documents"}
              {tab === "skills" && "Skills the agent has learned to improve future documents"}
              {tab === "brand" && "Configure your brand profile and identity"}
            </p>
          </div>

          {tab === "generate" && <GenerateForm brands={brands} />}
          {tab === "history" && <HistoryList />}
          {tab === "skills" && <SkillsList />}
          {tab === "brand" && <BrandForm onSaved={loadBrands} />}
        </div>
      </main>
    </div>
  );
}
