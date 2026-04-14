"use client";
import { useState } from "react";
import { createBrand } from "../lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TONES = ["professional", "friendly", "formal", "creative", "bold"];
const FONTS = ["Calibri", "Arial", "Georgia", "Helvetica", "Times New Roman"];

export default function BrandForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({
    id: "", name: "", tone: "professional", industry: "",
    tagline: "", primary_color: "#16a34a", font: "Calibri",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.id.trim()) e.id = "Required.";
    else if (!/^[a-z0-9_-]+$/.test(form.id)) e.id = "Lowercase, no spaces.";
    if (!form.name.trim()) e.name = "Required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await createBrand(form);
    setSaved(true);
    setSaving(false);
    onSaved();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Live preview */}
      <div className="rounded-2xl p-5 border border-gray-100 shadow-sm overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${form.primary_color}15, ${form.primary_color}05)` }}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Live Preview</p>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md"
            style={{ backgroundColor: form.primary_color }}>
            {form.name ? form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?"}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: form.font, color: form.primary_color }}>
              {form.name || "Brand Name"}
            </p>
            <p className="text-sm text-gray-400" style={{ fontFamily: form.font }}>
              {form.tagline || "Your tagline here"}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block capitalize"
              style={{ backgroundColor: `${form.primary_color}20`, color: form.primary_color }}>
              {form.tone}
            </span>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Identity</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand ID</label>
            <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s/g, "-") })}
              placeholder="e.g. diva-cosmetics"
              className={`w-full rounded-xl px-4 py-2.5 text-sm bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all ${errors.id ? "border-red-300" : "border-gray-200"}`} />
            {errors.id ? <p className="text-red-500 text-xs mt-1">{errors.id}</p> : <p className="text-xs text-gray-400 mt-1">Unique identifier, no spaces</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Brand Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Diva Cosmetics"
              className={`w-full rounded-xl px-4 py-2.5 text-sm bg-gray-50 border focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all ${errors.name ? "border-red-300" : "border-gray-200"}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tagline</label>
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            placeholder="e.g. Beauty that speaks for itself"
            className="w-full rounded-xl px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
            placeholder="e.g. beauty & cosmetics"
            className="w-full rounded-xl px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition-all" />
        </div>
      </div>

      {/* Style */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Style</p>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Tone</label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button key={t} type="button" onClick={() => setForm({ ...form, tone: t })}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                  form.tone === t ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Font</label>
          <div className="flex flex-wrap gap-2">
            {FONTS.map((f) => (
              <button key={f} type="button" onClick={() => setForm({ ...form, font: f })}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.font === f ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Primary Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <div className="flex gap-2 flex-wrap">
              {["#16a34a", "#e91e8c", "#2563eb", "#dc2626", "#7c3aed", "#ea580c", "#0891b2"].map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, primary_color: c })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${form.primary_color === c ? "border-gray-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-mono">{form.primary_color}</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-2xl text-sm font-semibold hover:from-green-400 hover:to-green-600 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-green-600/30 transition-all">
        {saving ? "Saving..." : saved ? "✓ Brand Saved!" : "◈ Save Brand"}
      </button>

      {form.id && saved && (
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-b">Generated Logo</p>
          <img src={`${BASE_URL}/brands/${form.id}/logo`} alt="Brand logo" className="w-full" />
        </div>
      )}
    </form>
  );
}
